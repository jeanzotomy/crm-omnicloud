export function parsePaginationParams(sp: URLSearchParams, defaultSize = 20, maxSize = 50) {
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const pageSize = Math.min(maxSize, Math.max(1, Number(sp.get('pageSize') ?? defaultSize)));
  return { page, pageSize };
}
