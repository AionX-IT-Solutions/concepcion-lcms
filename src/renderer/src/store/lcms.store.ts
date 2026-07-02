import { create } from 'zustand'
import {
  batchCreateWithCounters,
  batchDeleteWithCounters,
  createDoc,
  newDocId,
  patchDoc,
  removeDoc,
  subscribeCollection,
  upsertDoc
} from '../lib/firestore-sync'
import { deleteFileRef, deleteFileRefs } from '../lib/storage'
import { formatCurrency, getFullName } from '../lib/utils'
import { logAudit } from '../lib/audit'
import type {
  BillingFees,
  Case,
  CaseDecision,
  CaseDevelopmentEntry,
  CaseNote,
  Client,
  Hearing,
  Payment,
  Task
} from '../types/lcms.types'

const COLLECTIONS = {
  clients: 'clients',
  cases: 'cases',
  caseDecisions: 'caseDecisions',
  billingFees: 'billingFees',
  payments: 'payments',
  caseDevEntries: 'caseDevEntries',
  hearings: 'hearings',
  tasks: 'tasks',
  caseNotes: 'caseNotes'
} as const

interface LcmsState {
  loading: boolean
  clients: Client[]
  cases: Case[]
  caseDecisions: CaseDecision[]
  billingFees: BillingFees[]
  payments: Payment[]
  caseDevEntries: CaseDevelopmentEntry[]
  hearings: Hearing[]
  tasks: Task[]
  caseNotes: CaseNote[]

  initListeners: () => () => void

  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  addCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCase: (id: string, patch: Partial<Omit<Case, 'id'>>) => Promise<void>
  deleteCase: (id: string) => Promise<void>

  addDecision: (decision: Omit<CaseDecision, 'id'>) => Promise<void>
  updateDecision: (id: string, patch: Partial<Omit<CaseDecision, 'id'>>) => Promise<void>
  deleteDecision: (id: string) => Promise<void>

  upsertBillingFees: (fees: BillingFees) => Promise<void>

  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>
  updatePayment: (id: string, patch: Partial<Omit<Payment, 'id'>>) => Promise<void>
  deletePayment: (id: string) => Promise<void>

  addCaseDevEntry: (entry: Omit<CaseDevelopmentEntry, 'id'>) => Promise<void>
  updateCaseDevEntry: (id: string, patch: Partial<Omit<CaseDevelopmentEntry, 'id'>>) => Promise<void>
  deleteCaseDevEntry: (id: string) => Promise<void>

  addHearing: (hearing: Omit<Hearing, 'id'>) => Promise<void>
  updateHearing: (id: string, patch: Partial<Omit<Hearing, 'id'>>) => Promise<void>
  deleteHearing: (id: string) => Promise<void>

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  addCaseNote: (note: Omit<CaseNote, 'id' | 'createdAt'>) => Promise<void>
  deleteCaseNote: (id: string) => Promise<void>

  getCasesByClient: (clientId: string) => Case[]
  getPaymentsByCase: (caseId: string) => Payment[]
  getDecisionsByCase: (caseId: string) => CaseDecision[]
  getCaseDevEntriesByCase: (caseId: string) => CaseDevelopmentEntry[]
  getBillingFeesByCase: (caseId: string) => BillingFees | undefined
  getTotalPaid: (caseId: string) => number
  getAgreedTotal: (caseId: string) => number
  getCompletedAppearances: (caseId: string) => number
}

function nowIso(): string {
  return new Date().toISOString()
}

/** Lowercased, denormalized on every write — lets Firestore do a real server-side prefix search. */
function clientSearchName(c: { firstName: string; middleName?: string; lastName: string }): string {
  return getFullName(c.firstName, c.middleName ?? '', c.lastName).toLowerCase()
}

export const useLcmsStore = create<LcmsState>()((set, get) => {
  /** Every doc owned by a set of cases (billing fees, payments, decisions, dev entries) — used for cascade deletes. */
  function caseCascadeDeletions(caseIds: string[]) {
    if (caseIds.length === 0) return []
    const state = get()
    const paymentIds = state.payments.filter((p) => caseIds.includes(p.caseId)).map((p) => p.id)
    const decisionIds = state.caseDecisions
      .filter((d) => caseIds.includes(d.caseId))
      .map((d) => d.id)
    const devIds = state.caseDevEntries
      .filter((e) => caseIds.includes(e.caseId))
      .map((e) => e.id)
    const hearingIds = state.hearings.filter((h) => caseIds.includes(h.caseId)).map((h) => h.id)
    const taskIds = state.tasks
      .filter((t) => t.caseId && caseIds.includes(t.caseId))
      .map((t) => t.id)
    const noteIds = state.caseNotes.filter((n) => caseIds.includes(n.caseId)).map((n) => n.id)

    return [
      ...caseIds.map((id) => ({ collection: COLLECTIONS.cases, id, counter: COLLECTIONS.cases })),
      ...caseIds.map((id) => ({
        collection: COLLECTIONS.billingFees,
        id,
        counter: COLLECTIONS.billingFees
      })),
      ...paymentIds.map((id) => ({
        collection: COLLECTIONS.payments,
        id,
        counter: COLLECTIONS.payments
      })),
      ...decisionIds.map((id) => ({
        collection: COLLECTIONS.caseDecisions,
        id,
        counter: COLLECTIONS.caseDecisions
      })),
      ...hearingIds.map((id) => ({
        collection: COLLECTIONS.hearings,
        id,
        counter: COLLECTIONS.hearings
      })),
      ...taskIds.map((id) => ({
        collection: COLLECTIONS.tasks,
        id,
        counter: COLLECTIONS.tasks
      })),
      ...devIds.map((id) => ({
        collection: COLLECTIONS.caseDevEntries,
        id,
        counter: COLLECTIONS.caseDevEntries
      })),
      ...noteIds.map((id) => ({
        collection: COLLECTIONS.caseNotes,
        id,
        counter: COLLECTIONS.caseNotes
      }))
    ]
  }

  /** Every Storage file attached to a set of cases (decisions + dev entries) — used for cascade deletes. */
  function caseFileRefs(caseIds: string[]) {
    if (caseIds.length === 0) return []
    const state = get()
    return [
      ...state.caseDecisions.filter((d) => caseIds.includes(d.caseId)).map((d) => d.fileRef),
      ...state.caseDevEntries.filter((e) => caseIds.includes(e.caseId)).map((e) => e.fileRef)
    ]
  }

  return {
    loading: true,
    clients: [],
    cases: [],
    caseDecisions: [],
    billingFees: [],
    payments: [],
    caseDevEntries: [],
    hearings: [],
    tasks: [],
    caseNotes: [],

    initListeners: () => {
      set({
        loading: true,
        clients: [],
        cases: [],
        caseDecisions: [],
        billingFees: [],
        payments: [],
        caseDevEntries: [],
        hearings: [],
        tasks: [],
        caseNotes: []
      })

      const seen = new Set<string>()
      const totalCollections = Object.keys(COLLECTIONS).length
      function onFirstLoad(name: string): void {
        if (seen.has(name)) return
        seen.add(name)
        if (seen.size >= totalCollections) set({ loading: false })
      }

      const unsubs = [
        subscribeCollection<Client>(COLLECTIONS.clients, (clients) => {
          set({ clients })
          onFirstLoad(COLLECTIONS.clients)
          // Backfill the search field for docs created before it existed.
          for (const c of clients) {
            if (!(c as unknown as { searchName?: string }).searchName) {
              patchDoc(COLLECTIONS.clients, c.id, { searchName: clientSearchName(c) }).catch(() => {})
            }
          }
        }),
        subscribeCollection<Case>(COLLECTIONS.cases, (cases) => {
          set({ cases })
          onFirstLoad(COLLECTIONS.cases)
          for (const c of cases) {
            if (!(c as unknown as { searchTitle?: string }).searchTitle) {
              patchDoc(COLLECTIONS.cases, c.id, { searchTitle: c.caseTitle.toLowerCase() }).catch(() => {})
            }
          }
        }),
        subscribeCollection<CaseDecision>(COLLECTIONS.caseDecisions, (caseDecisions) => {
          set({ caseDecisions })
          onFirstLoad(COLLECTIONS.caseDecisions)
        }),
        subscribeCollection<BillingFees>(COLLECTIONS.billingFees, (billingFees) => {
          set({ billingFees })
          onFirstLoad(COLLECTIONS.billingFees)
        }),
        subscribeCollection<Payment>(COLLECTIONS.payments, (payments) => {
          set({ payments })
          onFirstLoad(COLLECTIONS.payments)
        }),
        subscribeCollection<CaseDevelopmentEntry>(COLLECTIONS.caseDevEntries, (caseDevEntries) => {
          set({ caseDevEntries })
          onFirstLoad(COLLECTIONS.caseDevEntries)
        }),
        subscribeCollection<Hearing>(COLLECTIONS.hearings, (hearings) => {
          set({ hearings })
          onFirstLoad(COLLECTIONS.hearings)
        }),
        subscribeCollection<Task>(COLLECTIONS.tasks, (tasks) => {
          set({ tasks })
          onFirstLoad(COLLECTIONS.tasks)
        }),
        subscribeCollection<CaseNote>(COLLECTIONS.caseNotes, (caseNotes) => {
          set({ caseNotes })
          onFirstLoad(COLLECTIONS.caseNotes)
        })
      ]

      return () => unsubs.forEach((unsub) => unsub())
    },

    addClient: async (client) => {
      await createDoc(
        COLLECTIONS.clients,
        { ...client, searchName: clientSearchName(client), createdAt: nowIso(), updatedAt: nowIso() },
        { counter: COLLECTIONS.clients }
      )
      void logAudit({
        action: 'Created client',
        module: 'Clients',
        target: getFullName(client.firstName, client.middleName ?? '', client.lastName)
      })
    },

    updateClient: async (id, patch) => {
      const current = get().clients.find((c) => c.id === id)
      const merged = { ...current, ...patch }
      const searchName =
        merged.firstName && merged.lastName ? clientSearchName(merged as Client) : undefined
      await patchDoc(COLLECTIONS.clients, id, { ...patch, searchName, updatedAt: nowIso() })
      void logAudit({
        action: 'Updated client',
        module: 'Clients',
        target: current ? getFullName(current.firstName, current.middleName ?? '', current.lastName) : id
      })
    },

    deleteClient: async (id) => {
      const client = get().clients.find((c) => c.id === id)
      const caseIds = get()
        .cases.filter((c) => c.clientId === id)
        .map((c) => c.id)
      const fileRefs = [client?.validIdReference, ...caseFileRefs(caseIds)]
      await batchDeleteWithCounters([
        { collection: COLLECTIONS.clients, id, counter: COLLECTIONS.clients },
        ...caseCascadeDeletions(caseIds)
      ])
      await deleteFileRefs(fileRefs)
      void logAudit({
        action: 'Deleted client',
        module: 'Clients',
        target: client ? getFullName(client.firstName, client.middleName ?? '', client.lastName) : id,
        severity: 'Warning'
      })
    },

    addCase: async (caseData) => {
      const id = newDocId(COLLECTIONS.cases)
      await batchCreateWithCounters([
        {
          collection: COLLECTIONS.cases,
          id,
          data: {
            ...caseData,
            searchTitle: caseData.caseTitle.toLowerCase(),
            createdAt: nowIso(),
            updatedAt: nowIso()
          },
          counter: COLLECTIONS.cases
        },
        {
          collection: COLLECTIONS.billingFees,
          id,
          data: {
            caseId: id,
            acceptanceFee: 0,
            perAppearanceFee: 0,
            depositForCost: 0,
            successFee: 0
          },
          counter: COLLECTIONS.billingFees
        }
      ])
      void logAudit({ action: 'Created case', module: 'Cases', target: caseData.caseTitle })
    },

    updateCase: async (id, patch) => {
      const current = get().cases.find((c) => c.id === id)
      const searchTitle = patch.caseTitle ? patch.caseTitle.toLowerCase() : undefined
      await patchDoc(COLLECTIONS.cases, id, { ...patch, searchTitle, updatedAt: nowIso() })
      void logAudit({
        action: 'Updated case',
        module: 'Cases',
        target: patch.caseTitle ?? current?.caseTitle ?? id
      })
    },

    deleteCase: async (id) => {
      const current = get().cases.find((c) => c.id === id)
      const fileRefs = caseFileRefs([id])
      await batchDeleteWithCounters(caseCascadeDeletions([id]))
      await deleteFileRefs(fileRefs)
      void logAudit({
        action: 'Deleted case',
        module: 'Cases',
        target: current?.caseTitle ?? id,
        severity: 'Warning'
      })
    },

    addDecision: async (decision) => {
      await createDoc(COLLECTIONS.caseDecisions, decision, { counter: COLLECTIONS.caseDecisions })
    },

    updateDecision: async (id, patch) => {
      await patchDoc(COLLECTIONS.caseDecisions, id, patch)
    },

    deleteDecision: async (id) => {
      const fileRef = get().caseDecisions.find((d) => d.id === id)?.fileRef
      await removeDoc(COLLECTIONS.caseDecisions, id, { counter: COLLECTIONS.caseDecisions })
      await deleteFileRef(fileRef)
    },

    upsertBillingFees: async (fees) => {
      await upsertDoc(COLLECTIONS.billingFees, fees.caseId, { ...fees })
    },

    addPayment: async (payment) => {
      await createDoc(COLLECTIONS.payments, payment, { counter: COLLECTIONS.payments })
      void logAudit({
        action: 'Recorded payment',
        module: 'Billing',
        target: `${formatCurrency(payment.amount)} — ${payment.particulars}`
      })
    },

    updatePayment: async (id, patch) => {
      await patchDoc(COLLECTIONS.payments, id, patch)
      void logAudit({ action: 'Updated payment', module: 'Billing', target: id })
    },

    deletePayment: async (id) => {
      const current = get().payments.find((p) => p.id === id)
      await removeDoc(COLLECTIONS.payments, id, { counter: COLLECTIONS.payments })
      void logAudit({
        action: 'Deleted payment',
        module: 'Billing',
        target: current ? `${formatCurrency(current.amount)} — ${current.particulars}` : id,
        severity: 'Warning'
      })
    },

    addCaseDevEntry: async (entry) => {
      await createDoc(COLLECTIONS.caseDevEntries, entry, { counter: COLLECTIONS.caseDevEntries })
    },

    updateCaseDevEntry: async (id, patch) => {
      await patchDoc(COLLECTIONS.caseDevEntries, id, patch)
    },

    deleteCaseDevEntry: async (id) => {
      const fileRef = get().caseDevEntries.find((e) => e.id === id)?.fileRef
      await removeDoc(COLLECTIONS.caseDevEntries, id, { counter: COLLECTIONS.caseDevEntries })
      await deleteFileRef(fileRef)
    },

    addHearing: async (hearing) => {
      await createDoc(COLLECTIONS.hearings, hearing, { counter: COLLECTIONS.hearings })
      void logAudit({
        action: 'Scheduled hearing',
        module: 'Hearings',
        target: `${hearing.hearingType} — ${hearing.date}`
      })
    },

    updateHearing: async (id, patch) => {
      const current = get().hearings.find((h) => h.id === id)
      await patchDoc(COLLECTIONS.hearings, id, patch)
      void logAudit({
        action: 'Updated hearing',
        module: 'Hearings',
        target: current ? `${current.hearingType} — ${current.date}` : id
      })
    },

    deleteHearing: async (id) => {
      const current = get().hearings.find((h) => h.id === id)
      await removeDoc(COLLECTIONS.hearings, id, { counter: COLLECTIONS.hearings })
      void logAudit({
        action: 'Deleted hearing',
        module: 'Hearings',
        target: current ? `${current.hearingType} — ${current.date}` : id,
        severity: 'Warning'
      })
    },

    addTask: async (task) => {
      await createDoc(COLLECTIONS.tasks, { ...task, createdAt: nowIso() }, { counter: COLLECTIONS.tasks })
      void logAudit({ action: 'Created task', module: 'Tasks', target: task.title })
    },

    updateTask: async (id, patch) => {
      const current = get().tasks.find((t) => t.id === id)
      await patchDoc(COLLECTIONS.tasks, id, patch)
      void logAudit({
        action: 'Updated task',
        module: 'Tasks',
        target: patch.title ?? current?.title ?? id
      })
    },

    deleteTask: async (id) => {
      const current = get().tasks.find((t) => t.id === id)
      await removeDoc(COLLECTIONS.tasks, id, { counter: COLLECTIONS.tasks })
      void logAudit({
        action: 'Deleted task',
        module: 'Tasks',
        target: current?.title ?? id,
        severity: 'Warning'
      })
    },

    addCaseNote: async (note) => {
      await createDoc(COLLECTIONS.caseNotes, { ...note, createdAt: nowIso() }, { counter: COLLECTIONS.caseNotes })
    },

    deleteCaseNote: async (id) => {
      await removeDoc(COLLECTIONS.caseNotes, id, { counter: COLLECTIONS.caseNotes })
    },

    getCasesByClient: (clientId) => get().cases.filter((c) => c.clientId === clientId),
    getPaymentsByCase: (caseId) => get().payments.filter((p) => p.caseId === caseId),
    getDecisionsByCase: (caseId) => get().caseDecisions.filter((d) => d.caseId === caseId),
    getCaseDevEntriesByCase: (caseId) => get().caseDevEntries.filter((e) => e.caseId === caseId),
    getBillingFeesByCase: (caseId) => get().billingFees.find((b) => b.caseId === caseId),

    getTotalPaid: (caseId) =>
      get()
        .payments.filter((p) => p.caseId === caseId)
        .reduce((sum, p) => sum + p.amount, 0),

    getAgreedTotal: (caseId) => {
      const fees = get().billingFees.find((b) => b.caseId === caseId)
      if (!fees) return 0
      const completedAppearances = get().hearings.filter(
        (h) => h.caseId === caseId && h.status === 'Completed'
      ).length
      return (
        fees.acceptanceFee +
        fees.perAppearanceFee * completedAppearances +
        fees.depositForCost +
        fees.successFee
      )
    },

    getCompletedAppearances: (caseId) =>
      get().hearings.filter((h) => h.caseId === caseId && h.status === 'Completed').length
  }
})
