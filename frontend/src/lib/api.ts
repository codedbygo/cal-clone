import type {
  EventType,
  EventTypeInput,
  EventTypeWithHost,
  MonthAvailabilityResponse,
  SlotsResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let eventTypesCache: EventType[] | null = null;
let eventTypesInflight: Promise<EventType[]> | null = null;

function invalidateEventTypesCache() {
  eventTypesCache = null;
  eventTypesInflight = null;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const code = body?.error?.code ?? "UNKNOWN";
    const message = body?.error?.message ?? res.statusText;
    throw new ApiClientError(code, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getEventTypes(options?: { fresh?: boolean }): Promise<EventType[]> {
  if (!options?.fresh && eventTypesCache) {
    return Promise.resolve(eventTypesCache);
  }
  if (!options?.fresh && eventTypesInflight) {
    return eventTypesInflight;
  }

  const promise = request<EventType[]>("/event-types").then((data) => {
    eventTypesCache = data;
    eventTypesInflight = null;
    return data;
  });
  eventTypesInflight = promise;
  return promise;
}

export function getEventBySlug(
  slug: string,
  preview = false,
): Promise<EventTypeWithHost> {
  const q = preview ? "?preview=1" : "";
  return request<EventTypeWithHost>(`/event-types/slug/${slug}${q}`);
}

function slotsQuery(
  slug: string,
  params: Record<string, string>,
  preview = false,
): string {
  const q = new URLSearchParams({ slug, ...params });
  if (preview) q.set("preview", "1");
  return `/slots?${q.toString()}`;
}

export function getSlots(
  slug: string,
  date: string,
  preview = false,
): Promise<SlotsResponse> {
  return request<SlotsResponse>(slotsQuery(slug, { date }, preview));
}

export function getMonthAvailability(
  slug: string,
  month: string,
  preview = false,
): Promise<MonthAvailabilityResponse> {
  return request<MonthAvailabilityResponse>(
    slotsQuery(slug, { month }, preview),
  );
}

export function createEventType(data: EventTypeInput): Promise<EventType> {
  invalidateEventTypesCache();
  return request<EventType>("/event-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEventType(
  id: string,
  data: Partial<EventTypeInput>,
): Promise<EventType> {
  invalidateEventTypesCache();
  return request<EventType>(`/event-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function toggleEventTypeHidden(
  id: string,
  hidden: boolean,
): Promise<EventType> {
  invalidateEventTypesCache();
  return request<EventType>(`/event-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ hidden }),
  });
}

export function deleteEventType(id: string): Promise<void> {
  invalidateEventTypesCache();
  return request<void>(`/event-types/${id}`, { method: "DELETE" });
}
