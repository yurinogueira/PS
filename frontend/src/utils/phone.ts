/**
 * Formats or masks a string as a Brazilian phone number:
 * - 11 digits: (XX) XXXXX-XXXX (Mobile)
 * - 10 digits: (XX) XXXX-XXXX (Landline)
 * - Partial inputs while typing.
 */

export function maskPhone(value: string | null | undefined): string {
  if (!value) return "";

  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  // Fallback to maskPhone if partial or non-standard length
  return maskPhone(value);
}
