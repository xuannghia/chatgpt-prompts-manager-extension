import { create } from 'zustand'

interface AppState {
  storeRestoration: Map<string, number>
  searchInput: string
  actions: {
    setSearchInput: (searchInput: string) => void
    setStoreRestoration: (key: string, value: number) => void
  }
}

export const useAppStore = create<AppState>((set) => ({
  storeRestoration: new Map(),
  searchInput: '',
  actions: {
    setSearchInput: (searchInput: string) => {
      set({ searchInput })
    },
    setStoreRestoration: (key: string, value: number) => {
      set(({ storeRestoration }) => {
        storeRestoration.set(key, value)
        return { storeRestoration }
      })
    },
  },
}))
