export const uniqueIds = (ids?: string[]) => [...new Set((ids ?? []).filter(Boolean))];

type Dated = { id: string; capturedAt?: Date | null; createdAt: Date };

// Newest first; ties broken by id so paging stays stable.
export const compareNewest = (left: Dated, right: Dated) =>
  +(right.capturedAt ?? right.createdAt) - +(left.capturedAt ?? left.createdAt) || right.id.localeCompare(left.id);
