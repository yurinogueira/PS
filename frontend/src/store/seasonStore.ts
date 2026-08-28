import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Season {
  id: string;
  name: string;
}

interface SeasonState {
  activeSeason: Season | null;
  setActiveSeason: (season: Season | null) => void;
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set) => ({
      activeSeason: null,
      setActiveSeason: (season) => set({ activeSeason: season }),
    }),
    {
      name: "season-storage",
    },
  ),
);
