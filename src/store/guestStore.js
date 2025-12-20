import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Guest user store - no authentication needed
export const useGuestStore = create(
  persist(
    (set, get) => ({
      guestId: null,
      username: null,
      avatar: null,

      // Initialize or get existing guest
      initializeGuest: () => {
        const currentGuest = get()
        if (!currentGuest.guestId) {
          const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          set({ guestId: newGuestId })
        }
      },

      // Set username
      setUsername: (username) => {
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        set({ username, avatar })
      },

      // Get guest info
      getGuest: () => {
        const { guestId, username, avatar } = get()
        return { guestId, username, avatar }
      },

      // Clear guest (for new session)
      clearGuest: () => set({ guestId: null, username: null, avatar: null })
    }),
    {
      name: 'wordtraitor-guest'
    }
  )
)