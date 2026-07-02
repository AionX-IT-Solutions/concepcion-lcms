import {
  collection,
  doc,
  endAt,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  writeBatch,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore'
import { db } from './firebase'

/** Firestore rejects `undefined` field values — drop them so optional fields can be omitted. */
function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) clean[key] = value
  }
  return clean
}

const COUNTERS_COLLECTION = 'counters'

// Highest code point in the Unicode Basic Multilingual Plane — appending it to
// a prefix and using it as the upper bound of a range query gives a "starts
// with" match (any string beginning with the prefix sorts before prefix+this).
const PREFIX_RANGE_END = String.fromCharCode(0xf8ff)

export function subscribeCollection<T>(
  collectionName: string,
  onChange: (items: T[]) => void
): () => void {
  return onSnapshot(collection(db, collectionName), (snap: QuerySnapshot<DocumentData>) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
  })
}

export function subscribeCounter(counterId: string, onChange: (count: number) => void): () => void {
  return onSnapshot(doc(db, COUNTERS_COLLECTION, counterId), (snap) => {
    onChange((snap.data()?.count as number | undefined) ?? 0)
  })
}

/**
 * Real server-side search — a Firestore range query on `field` for values
 * starting with `prefix`, capped at `limitCount` docs actually fetched (not a
 * client-side filter over an already-downloaded collection). Firestore has no
 * substring/full-text search, so callers should query a lowercased field for
 * case-insensitive prefix matching.
 */
export async function searchByPrefix<T>(
  collectionName: string,
  field: string,
  prefix: string,
  limitCount = 10
): Promise<T[]> {
  const trimmed = prefix.trim()
  const base = collection(db, collectionName)
  const q = trimmed
    ? query(base, orderBy(field), startAt(trimmed), endAt(trimmed + PREFIX_RANGE_END), limit(limitCount))
    : query(base, orderBy(field), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
}

type BatchOp =
  | { type: 'set'; collection: string; id: string; data: Record<string, unknown>; merge?: boolean }
  | { type: 'update'; collection: string; id: string; data: Record<string, unknown> }
  | { type: 'delete'; collection: string; id: string }

/** Commits a list of writes/deletes as a single all-or-nothing Firestore batch. */
export async function commitBatch(ops: BatchOp[]): Promise<void> {
  if (ops.length === 0) return
  const batch = writeBatch(db)
  for (const op of ops) {
    const ref = doc(db, op.collection, op.id)
    if (op.type === 'delete') batch.delete(ref)
    else if (op.type === 'set') batch.set(ref, stripUndefined(op.data), { merge: op.merge ?? false })
    else batch.update(ref, stripUndefined(op.data))
  }
  await batch.commit()
}

/** `set` with `increment()` creates the counter doc on first use — no separate init step needed. */
function counterOp(counterId: string, amount: number): BatchOp {
  return {
    type: 'set',
    collection: COUNTERS_COLLECTION,
    id: counterId,
    data: { count: increment(amount) },
    merge: true
  }
}

/** Generates a fresh document ID without writing anything — lets a caller know the id up front. */
export function newDocId(collectionName: string): string {
  return doc(collection(db, collectionName)).id
}

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>,
  opts?: { counter?: string }
): Promise<string> {
  const ref = doc(collection(db, collectionName))
  const ops: BatchOp[] = [{ type: 'set', collection: collectionName, id: ref.id, data }]
  if (opts?.counter) ops.push(counterOp(opts.counter, 1))
  await commitBatch(ops)
  return ref.id
}

export interface BatchWriteOp {
  collection: string
  id: string
  data: Record<string, unknown>
  merge?: boolean
  counter?: string
}

/** Creates/upserts several related docs (e.g. a case + its billing fees doc) atomically. */
export async function batchCreateWithCounters(writes: BatchWriteOp[]): Promise<void> {
  if (writes.length === 0) return
  const counterDeltas = new Map<string, number>()
  const ops: BatchOp[] = []
  for (const w of writes) {
    ops.push({ type: 'set', collection: w.collection, id: w.id, data: w.data, merge: w.merge })
    if (w.counter) counterDeltas.set(w.counter, (counterDeltas.get(w.counter) ?? 0) + 1)
  }
  for (const [counterId, delta] of counterDeltas) {
    ops.push(counterOp(counterId, delta))
  }
  await commitBatch(ops)
}

export async function upsertDoc(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  opts?: { counter?: string }
): Promise<void> {
  const ops: BatchOp[] = [{ type: 'set', collection: collectionName, id, data, merge: true }]
  if (opts?.counter) ops.push(counterOp(opts.counter, 1))
  await commitBatch(ops)
}

export async function patchDoc(
  collectionName: string,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  await commitBatch([{ type: 'update', collection: collectionName, id, data: patch }])
}

export async function removeDoc(
  collectionName: string,
  id: string,
  opts?: { counter?: string }
): Promise<void> {
  const ops: BatchOp[] = [{ type: 'delete', collection: collectionName, id }]
  if (opts?.counter) ops.push(counterOp(opts.counter, -1))
  await commitBatch(ops)
}

/**
 * Deletes many docs (optionally across several collections) plus any related
 * per-collection counter decrements, all in a single atomic batch — used for
 * cascade deletes (e.g. deleting a client also deletes its cases and every
 * case-owned record) so a partial failure can never leave orphaned data.
 */
export async function batchDeleteWithCounters(
  deletions: Array<{ collection: string; id: string; counter?: string }>
): Promise<void> {
  if (deletions.length === 0) return
  const counterDeltas = new Map<string, number>()
  const ops: BatchOp[] = []
  for (const d of deletions) {
    ops.push({ type: 'delete', collection: d.collection, id: d.id })
    if (d.counter) counterDeltas.set(d.counter, (counterDeltas.get(d.counter) ?? 0) - 1)
  }
  for (const [counterId, delta] of counterDeltas) {
    ops.push(counterOp(counterId, delta))
  }
  await commitBatch(ops)
}
