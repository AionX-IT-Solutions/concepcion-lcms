import { deleteApp, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { firebaseConfig, auth, db } from './firebase'
import { patchDoc, removeDoc, subscribeCollection } from './firestore-sync'
import { logAudit, setAuditUserDisplayName } from './audit'

export interface UserAccount {
  id: string
  uid: string
  email: string
  displayName: string | null
  role: string | null
  createdAt: string
}

export function subscribeUserAccounts(onChange: (users: UserAccount[]) => void): () => void {
  return subscribeCollection<UserAccount>('users', onChange)
}

/**
 * Creates a Firebase Auth account without disturbing the currently signed-in
 * admin session — createUserWithEmailAndPassword signs in as the new user on
 * whichever auth instance it's called on, so this runs it on a throwaway
 * secondary app instance instead of the app's main `auth`.
 */
export async function createUserAccount(input: {
  email: string
  password: string
  displayName?: string
}): Promise<UserAccount> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, input.email, input.password)
    if (input.displayName) {
      await updateProfile(cred.user, { displayName: input.displayName })
    }
    const record: UserAccount = {
      id: cred.user.uid,
      uid: cred.user.uid,
      email: cred.user.email ?? input.email,
      displayName: input.displayName ?? null,
      role: null,
      createdAt: new Date().toISOString()
    }
    await setDoc(doc(db, 'users', cred.user.uid), record)
    void logAudit({ action: 'Created user account', module: 'Users', target: record.email })
    return record
  } finally {
    await secondaryAuth.signOut().catch(() => {})
    await deleteApp(secondaryApp).catch(() => {})
  }
}

/**
 * Removes the user from the in-app roster only. Client SDKs cannot disable or
 * delete another account's Firebase Auth login — that still requires the
 * Firebase Console (Authentication tab) or a server-side Admin SDK.
 */
export async function removeUserAccountRecord(id: string): Promise<void> {
  await removeDoc('users', id)
  void logAudit({ action: 'Removed user account', module: 'Users', target: id, severity: 'Warning' })
}

export async function setUserAccountRole(id: string, role: string | null): Promise<void> {
  await patchDoc('users', id, { role })
  void logAudit({ action: 'Changed user role', module: 'Users', target: `${id} → ${role ?? 'none'}` })
}

/**
 * Lets the signed-in user set their own name. Writes both the Firebase Auth
 * profile and the `users/{uid}` Firestore doc (merged, since accounts seeded
 * outside `createUserAccount` — e.g. via the Firebase console — never got a
 * roster doc) so the display name sticks everywhere it's read from, including
 * the audit trail.
 */
export async function updateOwnDisplayName(displayName: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const trimmed = displayName.trim()
  await updateProfile(user, { displayName: trimmed || null })
  await setDoc(
    doc(db, 'users', user.uid),
    { id: user.uid, uid: user.uid, email: user.email ?? '', displayName: trimmed || null },
    { merge: true }
  )
  setAuditUserDisplayName(trimmed || null)
}

/**
 * Changes the signed-in user's own password. Firebase requires a recent
 * login for this operation, so the current password is used to
 * re-authenticate first — this also doubles as verifying the user actually
 * knows their current password before letting them set a new one.
 */
export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not signed in')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
  void logAudit({ action: 'Changed password', module: 'Auth', target: user.email })
}
