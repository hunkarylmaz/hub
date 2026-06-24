export function b(value: unknown): boolean {
  return value === 1 || value === true;
}

export function toDbBool(value: boolean): number {
  return value ? 1 : 0;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
