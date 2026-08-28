import { describe, it, expect } from "vitest";
import { maskPhone, formatPhone } from "./phone";

describe("phone utility", () => {
  describe("maskPhone", () => {
    it("handles empty or nullish values", () => {
      expect(maskPhone("")).toBe("");
      expect(maskPhone(null)).toBe("");
      expect(maskPhone(undefined)).toBe("");
    });

    it("formats area code progressively", () => {
      expect(maskPhone("2")).toBe("(2");
      expect(maskPhone("21")).toBe("(21");
      expect(maskPhone("219")).toBe("(21) 9");
      expect(maskPhone("219999")).toBe("(21) 9999");
    });

    it("formats 10 digits (landline) properly", () => {
      expect(maskPhone("2123456789")).toBe("(21) 2345-6789");
    });

    it("formats 11 digits (mobile) properly", () => {
      expect(maskPhone("21999999999")).toBe("(21) 99999-9999");
      expect(maskPhone("21972978784")).toBe("(21) 97297-8784");
    });

    it("strips non-digits and truncates to 11 digits", () => {
      expect(maskPhone("(21) 97297-8784 extra 123")).toBe("(21) 97297-8784");
    });
  });

  describe("formatPhone", () => {
    it("handles empty or nullish values", () => {
      expect(formatPhone("")).toBe("");
      expect(formatPhone(null)).toBe("");
      expect(formatPhone(undefined)).toBe("");
    });

    it("formats 11-digit mobile number", () => {
      expect(formatPhone("21972978784")).toBe("(21) 97297-8784");
      expect(formatPhone("11988887777")).toBe("(11) 98888-7777");
    });

    it("formats 10-digit landline number", () => {
      expect(formatPhone("2123456789")).toBe("(21) 2345-6789");
    });

    it("formats 9-digit number without DDD", () => {
      expect(formatPhone("972978784")).toBe("97297-8784");
    });

    it("formats 8-digit number without DDD", () => {
      expect(formatPhone("23456789")).toBe("2345-6789");
    });
  });
});
