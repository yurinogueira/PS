import { apiClient } from "./client";

export interface Photo {
  id: string;
  file_number: string;
  photographer_id: string;
  payment_method: string;
  amount_paid?: number;
}

export interface Dog {
  id: string;
  breed: string;
  judge: string;
  is_owner?: boolean;
  competitions_won: number;
  photos: Photo[];
}

export interface SeasonClient {
  id: string;
  person_id: string;
  season_id: string;
  dogs: Dog[];
}

export const clientService = {
  list: async () => {
    const { data } = await apiClient.get<SeasonClient[]>("/clients");
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<SeasonClient>(`/clients/${id}`);
    return data;
  },
  create: async (client: Omit<SeasonClient, "id">) => {
    const { data } = await apiClient.post<SeasonClient>("/clients", client);
    return data;
  },
  update: async (id: string, client: SeasonClient) => {
    const { data } = await apiClient.put<SeasonClient>(
      `/clients/${id}`,
      client,
    );
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/clients/${id}`);
  },
};
