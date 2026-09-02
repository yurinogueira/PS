import { create } from "zustand";

interface MenuState {
  activeMenuId: string | null;
  openMenu: (id: string) => void;
  closeMenu: (id?: string) => void;
  closeAll: () => void;
  isMenuOpen: (id: string) => boolean;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  activeMenuId: null,
  openMenu: (id: string) => set({ activeMenuId: id }),
  closeMenu: (id?: string) => {
    const current = get().activeMenuId;
    if (!id || current === id) {
      set({ activeMenuId: null });
    }
  },
  closeAll: () => set({ activeMenuId: null }),
  isMenuOpen: (id: string) => get().activeMenuId === id,
}));
