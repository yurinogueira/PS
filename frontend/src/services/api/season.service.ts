import { apiClient } from "./client";

export interface Season {
  id: string;
  name: string;
  photographer_ids: string[];
  judges?: string[];
  created_at?: string;
  updated_at?: string;
}

export const seasonService = {
  list: async () => {
    const { data } = await apiClient.get<Season[]>("/seasons");
    return data || [];
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Season>(`/seasons/${id}`);
    return data;
  },
  create: async (season: Omit<Season, "id">) => {
    const { data } = await apiClient.post<Season>("/seasons", season);
    return data;
  },
  update: async (id: string, season: Partial<Season>) => {
    const { data } = await apiClient.put<Season>(`/seasons/${id}`, season);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/seasons/${id}`);
  },
};
