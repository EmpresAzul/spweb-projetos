export function normalizeBrazilianWhatsapp(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+55") && digits.startsWith("55") ? digits.slice(2) : digits;
}
