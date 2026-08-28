import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./client";
import { personService } from "./person.service";
import { photographerService } from "./photographer.service";
import { seasonService } from "./season.service";

describe("Entity API Services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("personService", () => {
    it("lists people", async () => {
      const mockPeople = [{ id: "p1", name: "Ana", email: "ana@test.com" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockPeople });

      const res = await personService.list();
      expect(apiClient.get).toHaveBeenCalledWith("/people");
      expect(res).toEqual(mockPeople);
    });

    it("gets person by id", async () => {
      const mockPerson = { id: "p1", name: "Ana", email: "ana@test.com" };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockPerson });

      const res = await personService.getById("p1");
      expect(apiClient.get).toHaveBeenCalledWith("/people/p1");
      expect(res).toEqual(mockPerson);
    });

    it("creates person", async () => {
      const newPerson = {
        name: "Ana",
        email: "ana@test.com",
        alternative_email: "",
        phone: "123",
      };
      const created = { id: "p1", ...newPerson };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ data: created });

      const res = await personService.create(newPerson);
      expect(apiClient.post).toHaveBeenCalledWith("/people", newPerson);
      expect(res).toEqual(created);
    });

    it("updates person", async () => {
      const updateData = { name: "Ana Silva" };
      const updated = { id: "p1", name: "Ana Silva" };
      vi.spyOn(apiClient, "put").mockResolvedValueOnce({ data: updated });

      const res = await personService.update("p1", updateData);
      expect(apiClient.put).toHaveBeenCalledWith("/people/p1", updateData);
      expect(res).toEqual(updated);
    });

    it("deletes person", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({});

      await personService.delete("p1");
      expect(apiClient.delete).toHaveBeenCalledWith("/people/p1");
    });
  });

  describe("photographerService", () => {
    it("lists photographers", async () => {
      const mockList = [{ id: "ph1", name: "Bruno" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockList });

      const res = await photographerService.list();
      expect(apiClient.get).toHaveBeenCalledWith("/photographers");
      expect(res).toEqual(mockList);
    });

    it("gets photographer by id", async () => {
      const mockItem = { id: "ph1", name: "Bruno" };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockItem });

      const res = await photographerService.getById("ph1");
      expect(apiClient.get).toHaveBeenCalledWith("/photographers/ph1");
      expect(res).toEqual(mockItem);
    });

    it("creates photographer", async () => {
      const newPhotog = { name: "Bruno" };
      const created = { id: "ph1", ...newPhotog };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ data: created });

      const res = await photographerService.create(newPhotog);
      expect(apiClient.post).toHaveBeenCalledWith("/photographers", newPhotog);
      expect(res).toEqual(created);
    });

    it("updates photographer", async () => {
      const updateData = { name: "Bruno Foto" };
      const updated = { id: "ph1", ...updateData };
      vi.spyOn(apiClient, "put").mockResolvedValueOnce({ data: updated });

      const res = await photographerService.update("ph1", updateData);
      expect(apiClient.put).toHaveBeenCalledWith(
        "/photographers/ph1",
        updateData,
      );
      expect(res).toEqual(updated);
    });

    it("deletes photographer", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({});

      await photographerService.delete("ph1");
      expect(apiClient.delete).toHaveBeenCalledWith("/photographers/ph1");
    });
  });

  describe("seasonService", () => {
    it("lists seasons", async () => {
      const mockSeasons = [
        { id: "s1", name: "Temporada 2026", photographer_ids: ["ph1"] },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockSeasons });

      const res = await seasonService.list();
      expect(apiClient.get).toHaveBeenCalledWith("/seasons");
      expect(res).toEqual(mockSeasons);
    });

    it("gets season by id", async () => {
      const mockSeason = {
        id: "s1",
        name: "Temporada 2026",
        photographer_ids: ["ph1"],
      };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockSeason });

      const res = await seasonService.getById("s1");
      expect(apiClient.get).toHaveBeenCalledWith("/seasons/s1");
      expect(res).toEqual(mockSeason);
    });

    it("creates season", async () => {
      const newSeason = {
        name: "Temporada 2026",
        photographer_ids: ["ph1", "ph2"],
      };
      const created = { id: "s1", ...newSeason };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ data: created });

      const res = await seasonService.create(newSeason);
      expect(apiClient.post).toHaveBeenCalledWith("/seasons", newSeason);
      expect(res).toEqual(created);
    });

    it("updates season", async () => {
      const updateData = {
        name: "Temporada Atualizada",
        photographer_ids: ["ph2"],
      };
      const updated = { id: "s1", ...updateData };
      vi.spyOn(apiClient, "put").mockResolvedValueOnce({ data: updated });

      const res = await seasonService.update("s1", updateData);
      expect(apiClient.put).toHaveBeenCalledWith("/seasons/s1", updateData);
      expect(res).toEqual(updated);
    });

    it("deletes season", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({});

      await seasonService.delete("s1");
      expect(apiClient.delete).toHaveBeenCalledWith("/seasons/s1");
    });
  });
});
