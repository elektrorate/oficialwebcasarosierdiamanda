export function getActionWarnings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((warning): warning is string => typeof warning === "string")
    : [];
}
