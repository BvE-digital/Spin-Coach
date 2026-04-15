import { create } from 'zustand'

interface UIState {
  isOnline: boolean
  isSyncing: boolean
  setOnline: (v: boolean) => void
  setSyncing: (v: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  setOnline: (v) => set({ isOnline: v }),
  setSyncing: (v) => set({ isSyncing: v }),
}))
