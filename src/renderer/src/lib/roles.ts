import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { commitBatch, createDoc, patchDoc, subscribeCollection } from './firestore-sync'

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  type: 'System' | 'Custom'
  /** Bypasses every permission check app-wide, regardless of `permissions`. */
  isSystemDeveloper?: boolean
}

export const ALL_PERMISSIONS = [
  'view:clients',
  'manage:clients',
  'view:cases',
  'manage:cases',
  'view:billing',
  'manage:billing',
  'view:documents',
  'manage:documents',
  'view:reports',
  'manage:settings',
  'manage:users'
]

const DEFAULT_ROLES: Omit<Role, 'id'>[] = [
  { name: 'Admin', description: 'Full system access', permissions: ALL_PERMISSIONS, type: 'System' },
  {
    name: 'Attorney',
    description: 'Full case and client access',
    permissions: [
      'view:clients',
      'manage:clients',
      'view:cases',
      'manage:cases',
      'view:billing',
      'view:documents',
      'manage:documents',
      'view:reports'
    ],
    type: 'System'
  },
  {
    name: 'Paralegal',
    description: 'View and limited data entry',
    permissions: ['view:clients', 'view:cases', 'view:billing', 'view:documents', 'manage:documents'],
    type: 'System'
  },
  {
    name: 'Billing Staff',
    description: 'Billing module access only',
    permissions: ['view:billing', 'manage:billing', 'view:reports'],
    type: 'Custom'
  }
]

const ROLES_COLLECTION = 'roles'

/** Seeds the four starter roles the first time the roles collection is ever loaded. */
export async function seedDefaultRolesIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, ROLES_COLLECTION))
  if (!snap.empty) return
  await Promise.all(DEFAULT_ROLES.map((role) => createDoc(ROLES_COLLECTION, role)))
}

export function subscribeRoles(onChange: (roles: Role[]) => void): () => void {
  return subscribeCollection<Role>(ROLES_COLLECTION, onChange)
}

export async function createRole(input: {
  name: string
  description: string
  type: 'System' | 'Custom'
}): Promise<void> {
  await createDoc(ROLES_COLLECTION, { ...input, permissions: [] })
}

export async function updateRolePermissions(
  id: string,
  permissions: string[],
  isSystemDeveloper: boolean
): Promise<void> {
  await patchDoc(ROLES_COLLECTION, id, { permissions, isSystemDeveloper })
}

/** Deletes a role and, atomically, unassigns it from every user that had it. */
export async function deleteRole(roleId: string, affectedUserIds: string[]): Promise<void> {
  await commitBatch([
    { type: 'delete', collection: ROLES_COLLECTION, id: roleId },
    ...affectedUserIds.map((uid) => ({
      type: 'update' as const,
      collection: 'users',
      id: uid,
      data: { role: null }
    }))
  ])
}
