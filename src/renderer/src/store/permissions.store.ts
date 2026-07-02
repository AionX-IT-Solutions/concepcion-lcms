import { create } from 'zustand'
import { subscribeRoles, type Role } from '../lib/roles'

interface RolesState {
  roles: Role[]
  rolesLoaded: boolean
  initListeners: () => () => void
}

/** Just the roles collection — the signed-in user's role name lives on app.store's currentUser. */
export const useRolesStore = create<RolesState>()((set) => ({
  roles: [],
  rolesLoaded: false,
  initListeners: () => subscribeRoles((roles) => set({ roles, rolesLoaded: true }))
}))
