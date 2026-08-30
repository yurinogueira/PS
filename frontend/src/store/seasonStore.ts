import { create } from "zustand";
import { safeStorage } from "../services/storage/storage";

export interface Season {
  id: string;
  name: string;
  photographer_ids?: string[];
  judges?: string[];
}

interface SeasonState {
  activeSeason: Season | null;
  setActiveSeason: (season: Season | null) => void;
}

const getStoredSeason = (): Season | null => {
  const seasonStr = safeStorage.getItem("season-storage");
  if (seasonStr) {
    try {
      return JSON.parse(seasonStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const useSeasonStore = create<SeasonState>((set) => {
  const activeSeason = getStoredSeason();
  return {
    activeSeason,
    setActiveSeason: (season) => {
      if (season) {
        safeStorage.setItem("season-storage", JSON.stringify(season));
      } else {
        safeStorage.removeItem("season-storage");
      }
      set({ activeSeason: season });
    },
  };
});
