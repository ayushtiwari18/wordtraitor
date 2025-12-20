import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Modal state
  modalOpen: false,
  modalContent: null,
  
  // Toast notifications
  toasts: [],
  
  // Loading states
  globalLoading: false,
  
  // Theme preferences
  soundEnabled: true,
  particlesEnabled: true,

  // Open modal
  openModal: (content) => set({ 
    modalOpen: true, 
    modalContent: content 
  }),

  // Close modal
  closeModal: () => set({ 
    modalOpen: false, 
    modalContent: null 
  }),

  // Add toast notification
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { 
      id: Date.now(), 
      ...toast 
    }]
  })),

  // Remove toast
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Show success toast
  showSuccess: (message) => {
    set((state) => ({
      toasts: [...state.toasts, {
        id: Date.now(),
        type: 'success',
        message,
        duration: 3000
      }]
    }))
  },

  // Show error toast
  showError: (message) => {
    set((state) => ({
      toasts: [...state.toasts, {
        id: Date.now(),
        type: 'error',
        message,
        duration: 4000
      }]
    }))
  },

  // Show info toast
  showInfo: (message) => {
    set((state) => ({
      toasts: [...state.toasts, {
        id: Date.now(),
        type: 'info',
        message,
        duration: 3000
      }]
    }))
  },

  // Toggle sound
  toggleSound: () => set((state) => ({ 
    soundEnabled: !state.soundEnabled 
  })),

  // Toggle particles
  toggleParticles: () => set((state) => ({ 
    particlesEnabled: !state.particlesEnabled 
  })),

  // Set global loading
  setGlobalLoading: (loading) => set({ globalLoading: loading })
}))