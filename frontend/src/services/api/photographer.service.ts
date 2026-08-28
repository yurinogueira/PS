import { apiClient } from "./client";

export interface Photographer {
  id: string;
  name: string;
}

export const photographerService = {
  list: async () => {
    const { data } = await apiClient.get<Photographer[]>("/photographers");
    return data;
  },
  create: async (photographer: Omit<Photographer, "id">) => {
    const { data } = await apiClient.post<Photographer>(
      "/photographers",
      photographer,
    );
    return data;
  },
};
