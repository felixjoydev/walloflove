import type {
  GuestbookConfig,
  EntriesListResponse,
  SubmitEntryRequest,
  SubmitEntryResponse,
  ApiError,
} from "@shared/types/api";

type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

let baseUrl = "";

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

const etagCache = new Map<string, string>();

async function request<T>(
  path: string,
  options?: RequestInit & { useEtag?: boolean }
): Promise<Result<T>> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.useEtag) {
    const etag = etagCache.get(path);
    if (etag) headers["If-None-Match"] = etag;
  }

  try {
    const res = await fetch(url, { ...options, headers: { ...headers, ...options?.headers } });

    if (res.status === 304) {
      return { ok: true, data: null as unknown as T };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, error: body as ApiError };
    }

    if (options?.useEtag) {
      const etag = res.headers.get("ETag");
      if (etag) etagCache.set(path, etag);
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: { error: "Network error" } };
  }
}

export function fetchConfig(
  guestbookId: string
): Promise<Result<GuestbookConfig>> {
  return request<GuestbookConfig>(`/api/v1/guestbooks/${guestbookId}`);
}

export function fetchEntries(
  guestbookId: string,
  cursor?: string | null
): Promise<Result<EntriesListResponse>> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request<EntriesListResponse>(
    `/api/v1/guestbooks/${guestbookId}/entries${params}`,
    { useEtag: !cursor }
  );
}

export function submitEntry(
  guestbookId: string,
  data: SubmitEntryRequest
): Promise<Result<SubmitEntryResponse>> {
  return request<SubmitEntryResponse>(
    `/api/v1/guestbooks/${guestbookId}/entries`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function deleteEntry(
  guestbookId: string,
  entryId: string,
  token: string
): Promise<Result<{ success: boolean }>> {
  return request<{ success: boolean }>(
    `/api/v1/guestbooks/${guestbookId}/entries/${entryId}`,
    { method: "DELETE", body: JSON.stringify({ deletion_token: token }) }
  );
}
