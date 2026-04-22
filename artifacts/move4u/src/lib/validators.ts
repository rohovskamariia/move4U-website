export function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

export function isValidPhone(raw: string): boolean {
  const v = normalisePhone(raw);
  if (!v) return false;
  if (/^0\d{9,10}$/.test(v)) return true;
  if (/^\+[1-9]\d{6,14}$/.test(v)) return true;
  if (/^[1-9]\d{8,14}$/.test(v)) return true;
  return false;
}

export function isValidEmail(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
