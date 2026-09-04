export function parseDuration(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}
