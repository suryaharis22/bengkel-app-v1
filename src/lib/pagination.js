export function getPaginationParams(searchParams) {
  const pageParam = Number(searchParams.get("page"));
  const perPageParam = Number(searchParams.get("per_page"));

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const perPage =
    Number.isInteger(perPageParam) && perPageParam > 0
      ? Math.min(perPageParam, 100)
      : 10;

  const skip = (page - 1) * perPage;

  return {
    page,
    perPage,
    skip,
  };
}

export function createPaginationMeta({ page, perPage, totalItems }) {
  const totalPages = Math.ceil(totalItems / perPage);

  return {
    current_page: page,
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages,
  };
}
