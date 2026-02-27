export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export const buildQuery = (path: string, query: QueryParams) => {
  const entries = Object.entries(query).flatMap(([key, value]) => {
    if (value === null || value === undefined) {
      return [];
    }
    return Array.isArray(value)
      ? value.filter((item) => item !== null && item !== undefined).map((item) => [key, String(item)])
      : [[key, String(value)]];
  });

  return entries.length > 0
    ? `${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams(entries).toString()}`
    : path;
};
