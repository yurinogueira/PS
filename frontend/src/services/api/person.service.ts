import { apiClient } from "./client";

export interface Person {
  id: string;
  name: string;
  email: string;
  alternative_email: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

export const personService = {
  list: async () => {
    const { data } = await apiClient.get<Person[]>("/people");
    return data || [];
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Person>(`/people/${id}`);
    return data;
  },
  create: async (person: Omit<Person, "id">) => {
    const { data } = await apiClient.post<Person>("/people", person);
    return data;
  },
  update: async (id: string, person: Partial<Person>) => {
    const { data } = await apiClient.put<Person>(`/people/${id}`, person);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/people/${id}`);
  },
};
