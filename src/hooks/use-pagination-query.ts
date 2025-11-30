import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_PAGE = 1;

type QueryValue = string | number | undefined | null;
interface UpdateOptions {
  resetPage?: boolean;
}

export function usePaginationQuerySync(defaultLimit = 10) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit"));

  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;

  const updateQuery = useCallback(
    (updates: Record<string, QueryValue>, options?: UpdateOptions) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      if (options?.resetPage) {
        next.set("page", "1");
      } else if (!next.get("page")) {
        next.set("page", String(page));
      }

      if (!next.get("limit")) {
        next.set("limit", String(limit));
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, page, limit]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateQuery({ page: Math.max(1, nextPage) });
    },
    [updateQuery]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      updateQuery({ limit: Math.max(1, nextLimit), page: 1 });
    },
    [updateQuery]
  );

  const setQueryParams = useCallback(
    (updates: Record<string, QueryValue>, options?: UpdateOptions) => {
      updateQuery(updates, options);
    },
    [updateQuery]
  );

  return {
    page,
    limit,
    searchParams,
    setPage,
    setLimit,
    setQueryParams,
  };
}

