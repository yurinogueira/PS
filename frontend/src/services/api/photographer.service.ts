import { apiClient } from "./client";

export interface Photographer {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export const photographerService = {
  list: async () => {
    const { data } = await apiClient.get<Photographer[]>("/photographers");
    return data || [];
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Photographer>(`/photographers/${id}`);
    return data;
  },
  create: async (photographer: Omit<Photographer, "id">) => {
    const { data } = await apiClient.post<Photographer>(
      "/photographers",
      photographer,
    );
    return data;
  },
  update: async (id: string, photographer: Partial<Photographer>) => {
    const { data } = await apiClient.put<Photographer>(
      `/photographers/${id}`,
      photographer,
    );
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/photographers/${id}`);
  },
};
