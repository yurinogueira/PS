import { apiClient } from "./client";

export interface Photo {
  file_number: string;
  photographer_id: string;
  payment_method: string;
  amount_paid?: number;
  judges?: string[];
  created_at?: string;
}

export interface Dog {
  breed: string;
  judge?: string;
  judges?: string[];
  is_owner?: boolean;
  competitions_won: number;
  won_competitions?: string[];
  photos: Photo[];
}

export interface SeasonClient {
  id: string;
  person_id: string;
  season_id: string;
  dogs: Dog[];
}

export interface ClientListParams {
  season_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedClientsResponse {
  data: SeasonClient[];
  total: number;
  page: number;
  limit: number;
}

export const clientService = {
  list: async (
    params?: ClientListParams,
  ): Promise<PaginatedClientsResponse> => {
    const { data } = await apiClient.get<PaginatedClientsResponse>("/clients", {
      params,
    });
    return (
      data || {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
      }
    );
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
