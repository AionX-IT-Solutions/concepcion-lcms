export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced'

export interface MockFileRef {
  name: string
  /** Firebase Storage download URL */
  url?: string
  /** Firebase Storage object path — used to delete the object later */
  storagePath?: string
  sizeKb?: number
  uploadedAt: string
}

export interface Client {
  id: string
  lastName: string
  firstName: string
  middleName?: string
  dateOfBirth: string
  civilStatus: CivilStatus
  spouseName?: string
  occupation: string
  completeAddress: string
  contactNumber: string
  emailAddress: string
  validIdType: string
  validIdReference?: MockFileRef
  createdAt: string
  updatedAt: string
}

export type CaseStatus =
  | 'WITH DECISION / RESOLUTION'
  | 'PENDING'
  | 'ON APPEAL'
  | 'DISMISSED'
  | 'CLOSED'

export const CASE_STATUSES: CaseStatus[] = [
  'PENDING',
  'WITH DECISION / RESOLUTION',
  'ON APPEAL',
  'DISMISSED',
  'CLOSED'
]

export interface CaseDecision {
  id: string
  caseId: string
  dateOfPromulgation: string
  action: string
  fileRef?: MockFileRef
}

export interface Case {
  id: string
  clientId: string
  caStation: string
  caseNumber: string
  status: CaseStatus
  caseTitle: string
  partiesInvolved: string
  rulingOnLegalIssue: string
  clientNarrative: string
  createdAt: string
  updatedAt: string
}

export interface BillingFees {
  caseId: string
  acceptanceFee: number
  perAppearanceFee: number
  depositForCost: number
  successFee: number
}

export interface Payment {
  id: string
  caseId: string
  date: string
  particulars: string
  amount: number
}

export type CaseDevDocType =
  | 'Filed Complaint'
  | 'Answer Received'
  | 'Reply Filed'
  | 'Pre-Trial'
  | 'Motion'
  | 'Order'
  | 'Other'

export const CASE_DEV_DOC_TYPES: CaseDevDocType[] = [
  'Filed Complaint',
  'Answer Received',
  'Reply Filed',
  'Pre-Trial',
  'Motion',
  'Order',
  'Other'
]

export interface CaseDevelopmentEntry {
  id: string
  caseId: string
  date: string
  documentType: CaseDevDocType
  description: string
  fileRef?: MockFileRef
}

export type HearingType =
  | 'Arraignment'
  | 'Pre-Trial'
  | 'Trial'
  | 'Promulgation'
  | 'Motion Hearing'
  | 'Mediation'
  | 'Other'

export const HEARING_TYPES: HearingType[] = [
  'Arraignment',
  'Pre-Trial',
  'Trial',
  'Promulgation',
  'Motion Hearing',
  'Mediation',
  'Other'
]

export type HearingStatus = 'Scheduled' | 'Postponed' | 'Cancelled' | 'Completed'

export const HEARING_STATUSES: HearingStatus[] = [
  'Scheduled',
  'Postponed',
  'Cancelled',
  'Completed'
]

export interface Hearing {
  id: string
  caseId: string
  date: string
  time: string
  courtBranch: string
  hearingType: HearingType
  status: HearingStatus
  notes?: string
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export const TASK_STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Done']
export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High']

export interface Task {
  id: string
  title: string
  caseId?: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  notes?: string
  createdAt: string
}

export interface CaseNote {
  id: string
  caseId: string
  date: string
  text: string
  createdAt: string
}
