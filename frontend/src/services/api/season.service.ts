import { apiClient } from "./client";

export interface Season {
  id: string;
  name: string;
  photographer_ids: string[];
}

export const seasonService = {
  list: async () => {
    const { data } = await apiClient.get<Season[]>("/seasons");
    return data || [];
  },
  create: async (season: Omit<Season, "id">) => {
    const { data } = await apiClient.post<Season>("/seasons", season);
    return data;
  },
};
