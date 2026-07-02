import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAppStore } from '../store/app.store'
import { setAuditUserDisplayName } from '../lib/audit'

export function useFirebaseAuth(): void {
  const setAuthenticated = useAppStore((s) => s.setAuthenticated)
  const setAuthChecked = useAppStore((s) => s.setAuthChecked)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  useEffect(() => {
    let unsubProfile: (() => void) | undefined

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user)
      setAuthChecked(true)

      unsubProfile?.()
      unsubProfile = undefined
      if (user) {
        setCurrentUser({ email: user.email, displayName: user.displayName, role: null })
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          const profileDisplayName = snap.data()?.displayName as string | undefined
          const role = (snap.data()?.role as string | undefined) ?? null
          setAuditUserDisplayName(profileDisplayName)
          setCurrentUser({ displayName: profileDisplayName || user.displayName, role })
        })
      } else {
        setAuditUserDisplayName(null)
        setCurrentUser({ email: null, displayName: null, role: null })
      }
    })

    return () => {
      unsubscribe()
      unsubProfile?.()
    }
  }, [setAuthenticated, setAuthChecked, setCurrentUser])
}
