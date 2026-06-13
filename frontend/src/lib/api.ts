import type {
  Booking,
  BookingWithEvent,
  CreateBookingInput,
  EventType,
  EventTypeInput,
  EventTypeWithHost,
  BookingBootstrapResponse,
  BookingFilter,
  BookingListItem,
  AvailabilitySchedule,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
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

const API_TIMEOUT_MS = 12_000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
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
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError(
        "TIMEOUT",
        "Request timed out — is the API running? Check backend/.env database connection.",
      );
    }
    throw new ApiClientError(
      "NETWORK",
      "Cannot reach the API — run `make backend` on port 4000 and verify Neon DATABASE_URL.",
    );
  } finally {
    clearTimeout(timeout);
  }
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

const BOOTSTRAP_CACHE_TTL_MS = 5 * 60_000;
const bootstrapMem = new Map<
  string,
  { data: BookingBootstrapResponse; at: number }
>();

function bootstrapCacheKey(slug: string, month: string, preview: boolean) {
  return `${slug}:${month}:${preview}`;
}

function readBootstrapCache(
  key: string,
): BookingBootstrapResponse | null {
  const mem = bootstrapMem.get(key);
  if (mem && Date.now() - mem.at < BOOTSTRAP_CACHE_TTL_MS) {
    return mem.data;
  }
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`bootstrap:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      data: BookingBootstrapResponse;
      at: number;
    };
    if (Date.now() - parsed.at < BOOTSTRAP_CACHE_TTL_MS) {
      bootstrapMem.set(key, parsed);
      return parsed.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeBootstrapCache(key: string, data: BookingBootstrapResponse) {
  const entry = { data, at: Date.now() };
  bootstrapMem.set(key, entry);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(`bootstrap:${key}`, JSON.stringify(entry));
    } catch {
      /* ignore quota */
    }
  }
}

export function getBookingBootstrap(
  slug: string,
  month: string,
  preview = false,
  options?: { fresh?: boolean },
): Promise<BookingBootstrapResponse> {
  const key = bootstrapCacheKey(slug, month, preview);
  if (!options?.fresh) {
    const hit = readBootstrapCache(key);
    if (hit) return Promise.resolve(hit);
  }

  const q = new URLSearchParams({ slug, month });
  if (preview) q.set("preview", "1");
  return request<BookingBootstrapResponse>(`/slots/bootstrap?${q.toString()}`).then(
    (data) => {
      writeBootstrapCache(key, data);
      return data;
    },
  );
}

export function invalidateBookingBootstrapCache() {
  bootstrapMem.clear();
  if (typeof sessionStorage !== "undefined") {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("bootstrap:")) sessionStorage.removeItem(k);
    }
  }
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

export function createBooking(data: CreateBookingInput): Promise<Booking> {
  invalidateBookingBootstrapCache();
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getBooking(id: string): Promise<BookingWithEvent> {
  return request<BookingWithEvent>(`/bookings/${id}`);
}

export function getBookings(
  filter: BookingFilter = "upcoming",
): Promise<BookingListItem[]> {
  return request<BookingListItem[]>(
    `/bookings?filter=${encodeURIComponent(filter)}`,
  );
}

export function rescheduleBooking(
  id: string,
  startTime: string,
): Promise<BookingListItem> {
  invalidateBookingBootstrapCache();
  return request<BookingListItem>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ startTime }),
  });
}

export function cancelBooking(id: string): Promise<BookingListItem> {
  invalidateBookingBootstrapCache();
  return request<BookingListItem>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CANCELLED" }),
  });
}

export function getAvailabilitySchedules(): Promise<AvailabilitySchedule[]> {
  return request<AvailabilitySchedule[]>("/availability");
}

export function getAvailabilitySchedule(
  id: string,
): Promise<AvailabilitySchedule> {
  return request<AvailabilitySchedule>(`/availability/${id}`);
}

export function createAvailabilitySchedule(
  data: CreateAvailabilityInput,
): Promise<AvailabilitySchedule> {
  invalidateBookingBootstrapCache();
  return request<AvailabilitySchedule>("/availability", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAvailabilitySchedule(
  id: string,
  data: UpdateAvailabilityInput,
): Promise<AvailabilitySchedule> {
  invalidateBookingBootstrapCache();
  return request<AvailabilitySchedule>(`/availability/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAvailabilitySchedule(id: string): Promise<void> {
  invalidateBookingBootstrapCache();
  return request<void>(`/availability/${id}`, { method: "DELETE" });
}

export function setDefaultAvailabilitySchedule(
  id: string,
): Promise<AvailabilitySchedule> {
  invalidateBookingBootstrapCache();
  return request<AvailabilitySchedule>(`/availability/${id}/default`, {
    method: "PATCH",
  });
}
