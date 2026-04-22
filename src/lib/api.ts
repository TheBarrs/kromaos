export function successResponse(data: unknown, status = 200) {
  return Response.json({ data, success: true }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, details, success: false }, { status });
}

type SearchParams = {
  page: number;
  perPage: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  [key: string]: string | number;
};

export function parseSearchParams(url: string): SearchParams {
  const { searchParams } = new URL(url);
  const all = Object.fromEntries(searchParams.entries()) as Record<string, string>;
  return {
    ...all,
    page: parseInt(all.page || "1"),
    perPage: parseInt(all.perPage || "20"),
    search: all.search || "",
    sortBy: all.sortBy || "createdAt",
    sortOrder: (all.sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc",
  };
}
