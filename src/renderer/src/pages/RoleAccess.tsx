import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, FieldInput, FieldSelect } from '../components/ui/FormField'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { formatDate } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import {
  createUserAccount,
  removeUserAccountRecord,
  setUserAccountRole,
  subscribeUserAccounts,
  type UserAccount
} from '../lib/users'
import {
  ALL_PERMISSIONS,
  createRole,
  deleteRole,
  seedDefaultRolesIfEmpty,
  subscribeRoles,
  updateRolePermissions,
  type Role
} from '../lib/roles'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  type: z.enum(['System', 'Custom'])
})
type FormValues = z.infer<typeof schema>

const userSchema = z.object({
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  displayName: z.string().optional()
})
type UserFormValues = z.infer<typeof userSchema>

function EditRoleModal({
  role,
  onOpenChange,
  onSave
}: {
  role: Role
  onOpenChange: (open: boolean) => void
  onSave: (permissions: string[], isSystemDeveloper: boolean) => void | Promise<void>
}) {
  const [permissions, setPermissions] = useState<string[]>(role.permissions)
  const [isSystemDeveloper, setIsSystemDeveloper] = useState(role.isSystemDeveloper ?? false)

  useEffect(() => {
    setPermissions(role.permissions)
    setIsSystemDeveloper(role.isSystemDeveloper ?? false)
  }, [role])

  const togglePermission = (perm: string) => {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title={`Edit Role: ${role.name}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="primary" onClick={() => onSave(permissions, isSystemDeveloper)}>Save Permissions</Button>
        </>
      }
    >
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>{role.description}</p>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            marginBottom: 16,
            borderRadius: 10,
            border: `1px solid ${isSystemDeveloper ? 'var(--accent-primary)' : 'var(--border-default)'}`,
            background: isSystemDeveloper ? 'var(--accent-primary-subtle)' : 'transparent',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={isSystemDeveloper}
            onChange={(e) => setIsSystemDeveloper(e.target.checked)}
            style={{ width: 14, height: 14, marginTop: 2 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>System Developer</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Full access to every module, always — bypasses the checklist below entirely. Use only
              for whoever maintains the system.
            </p>
          </div>
        </label>

        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
            opacity: isSystemDeveloper ? 0.5 : 1
          }}
        >
          Permissions
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            opacity: isSystemDeveloper ? 0.5 : 1,
            pointerEvents: isSystemDeveloper ? 'none' : 'auto'
          }}
        >
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
                style={{ width: 14, height: 14 }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{perm}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export function RoleAccess() {
  const toast = useToast()

  // ── Roles (Firestore-backed — see lib/roles.ts) ────────────────
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    seedDefaultRolesIfEmpty()
    const unsubscribe = subscribeRoles(setRoles)
    return unsubscribe
  }, [])

  const roleOptions = useMemo(
    () => [{ value: '', label: 'No role' }, ...roles.map((r) => ({ value: r.name, label: r.name }))],
    [roles]
  )

  // ── System users (direct client SDK — see lib/users.ts) ────────
  const [users, setUsers] = useState<UserAccount[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeUserAccounts((list) => {
      setUsers(list)
      setUsersLoading(false)
    })
    return unsubscribe
  }, [])

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase()
    return (
      !q ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.displayName ?? '').toLowerCase().includes(q)
    )
  })

  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    reset: resetUserForm,
    formState: { errors: userErrors, isSubmitting: isCreatingUser }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', password: '', displayName: '' }
  })

  const onCreateUser = async (data: UserFormValues) => {
    try {
      await createUserAccount(data)
      toast.success('User created')
      resetUserForm()
      setAddUserOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const [removeTarget, setRemoveTarget] = useState<UserAccount | null>(null)
  const [removingUser, setRemovingUser] = useState(false)

  const onRemoveUser = async () => {
    if (!removeTarget) return
    setRemovingUser(true)
    try {
      await removeUserAccountRecord(removeTarget.id)
      toast.success('Removed from list')
      setRemoveTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setRemovingUser(false)
    }
  }

  const onRoleChange = async (user: UserAccount, role: string) => {
    try {
      await setUserAccountRole(user.id, role || null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const userColumns: Column<UserAccount>[] = [
    { key: 'email', header: 'Email', render: (u) => <span style={{ fontWeight: 600 }}>{u.email}</span> },
    { key: 'displayName', header: 'Name', render: (u) => u.displayName || '—' },
    {
      key: 'role',
      header: 'Role',
      sortable: false,
      render: (u) => (
        <FieldSelect
          value={u.role ?? ''}
          onChange={(e) => onRoleChange(u, e.target.value)}
          options={roleOptions}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            lineHeight: '20px',
            minWidth: 140,
            color: 'var(--text-primary)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)'
          }}
        />
      )
    },
    { key: 'createdAt', header: 'Created', render: (u) => formatDate(u.createdAt) },
    {
      key: 'uid',
      header: 'Actions',
      sortable: false,
      render: (u) => (
        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setRemoveTarget(u)}>
          Remove
        </Button>
      )
    }
  ]

  // ── Roles & permissions ─────────────────────────────────────────
  type RoleRow = Role & { userCount: number }
  const [selected, setSelected] = useState<RoleRow | null>(null)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleRow | null>(null)
  const [deletingRole, setDeletingRole] = useState(false)

  const rolesWithCounts = useMemo(
    () => roles.map((r) => ({ ...r, userCount: users.filter((u) => u.role === r.name).length })),
    [roles, users]
  )

  const filteredRoles = rolesWithCounts.filter(r => {
    const q = roleSearch.trim().toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', type: 'Custom' }
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await createRole(data)
      reset()
      setAddRoleOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role')
    }
  }

  const onDeleteRole = async () => {
    if (!deleteRoleTarget) return
    setDeletingRole(true)
    try {
      const affectedUserIds = users.filter((u) => u.role === deleteRoleTarget.name).map((u) => u.id)
      await deleteRole(deleteRoleTarget.id, affectedUserIds)
      toast.success('Role deleted')
      setDeleteRoleTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeletingRole(false)
    }
  }

  const roleColumns: Column<RoleRow>[] = [
    { key: 'name', header: 'Role Name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'description', header: 'Description' },
    {
      key: 'permissions',
      header: 'Permissions',
      render: r =>
        r.isSystemDeveloper ? (
          <Badge variant="primary">System Developer — full access</Badge>
        ) : (
          <Badge variant="default">{r.permissions.length} permissions</Badge>
        )
    },
    { key: 'userCount', header: 'Users Assigned' },
    { key: 'type', header: 'Type', render: r => <Badge variant={r.type === 'System' ? 'primary' as 'warning' : 'success'}>{r.type}</Badge> },
    { key: 'id', header: 'Actions', sortable: false, render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setSelected(r)}>Edit</Button>
        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteRoleTarget(r)}>Delete</Button>
      </div>
    )}
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(roleColumns)

  return (
    <motion.div key="role-access" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Lock size={20} />} title="Roles & Access" subtitle="Manage system users, roles, and module-level permissions." />

      {/* ── Users ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>System Users</h2>
        <button className="btn-primary" onClick={() => setAddUserOpen(true)}>
          <Plus size={14} /> Add User
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        To disable or permanently delete a login, use Firebase Console → Authentication.
      </p>

      <TableToolbar search={userSearch} onSearch={setUserSearch} searchPlaceholder="Search users..." total={filteredUsers.length} />

      <Card padding="0">
        <DataTable columns={userColumns} data={filteredUsers} loading={usersLoading} emptyMessage="No users yet." />
      </Card>

      {/* ── Roles & permissions ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Roles & Permissions</h2>
        <button className="btn-primary" onClick={() => setAddRoleOpen(true)}>
          <Plus size={14} /> Add Role
        </button>
      </div>

      <TableToolbar
        search={roleSearch}
        onSearch={setRoleSearch}
        searchPlaceholder="Search roles..."
        total={filteredRoles.length}
        columnsButton={<ColumnsButton columns={roleColumns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
      />

      <Card padding="0">
        <DataTable columns={roleColumns} data={filteredRoles} hiddenColumns={hiddenColumns} emptyMessage="No roles defined." />
      </Card>

      {selected && (
        <EditRoleModal
          role={selected}
          onOpenChange={(o) => !o && setSelected(null)}
          onSave={async (permissions, isSystemDeveloper) => {
            try {
              await updateRolePermissions(selected.id, permissions, isSystemDeveloper)
              toast.success('Permissions saved')
              setSelected(null)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to save permissions')
            }
          }}
        />
      )}

      <Modal open={addRoleOpen} onOpenChange={setAddRoleOpen} title="Add Role"
        footer={<><Button variant="outline" onClick={() => setAddRoleOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Create Role</Button></>}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Role Name" required error={errors.name?.message}><FieldInput {...register('name')} error={!!errors.name} /></FormField>
          <FormField label="Description" required error={errors.description?.message}><FieldInput {...register('description')} error={!!errors.description} /></FormField>
          <FormField label="Type" required><FieldSelect {...register('type')} options={[{ value: 'Custom', label: 'Custom' }, { value: 'System', label: 'System' }]} /></FormField>
        </form>
      </Modal>

      <Modal
        open={addUserOpen}
        onOpenChange={(o) => {
          setAddUserOpen(o)
          if (!o) resetUserForm()
        }}
        title="Add User"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUserSubmit(onCreateUser)} loading={isCreatingUser}>
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleUserSubmit(onCreateUser)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Email" required error={userErrors.email?.message}>
            <FieldInput type="email" {...registerUser('email')} error={!!userErrors.email} />
          </FormField>
          <FormField label="Password" required error={userErrors.password?.message}>
            <FieldInput type="password" {...registerUser('password')} error={!!userErrors.password} />
          </FormField>
          <FormField label="Display Name" error={userErrors.displayName?.message}>
            <FieldInput {...registerUser('displayName')} error={!!userErrors.displayName} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove User"
        message={
          removeTarget
            ? `Remove ${removeTarget.email} from this list? Their login will still work — to fully delete or disable it, use Firebase Console → Authentication.`
            : ''
        }
        confirmLabel="Remove"
        danger
        loading={removingUser}
        onConfirm={onRemoveUser}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteRoleTarget}
        title="Delete Role"
        message={
          deleteRoleTarget
            ? `Delete the "${deleteRoleTarget.name}" role? ${
                deleteRoleTarget.userCount > 0
                  ? `${deleteRoleTarget.userCount} user(s) currently assigned this role will have it cleared.`
                  : ''
              } This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deletingRole}
        onConfirm={onDeleteRole}
        onCancel={() => setDeleteRoleTarget(null)}
      />
    </motion.div>
  )
}
