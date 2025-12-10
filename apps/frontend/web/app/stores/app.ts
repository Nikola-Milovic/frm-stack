import { create } from "zustand";

interface AppStore {
  userId: string | null;
  setUserId: (userId: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  userId: null,
  setUserId: (userId) => set({ userId }),
}));
