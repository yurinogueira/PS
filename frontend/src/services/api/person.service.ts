import { apiClient } from "./client";

export interface Person {
  id: string;
  name: string;
  email: string;
  alternative_email: string;
  phone: string;
}

export const personService = {
  list: async () => {
    const { data } = await apiClient.get<Person[]>("/people");
    return data;
  },
  create: async (person: Omit<Person, "id">) => {
    const { data } = await apiClient.post<Person>("/people", person);
    return data;
  },
};
