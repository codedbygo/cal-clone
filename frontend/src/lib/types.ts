export interface EventType {
  id: string;
  userId: string;
  title: string;
  description: string;
  durationMinutes: number;
  slug: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventTypeWithHost extends EventType {
  user: { name: string; email?: string };
}

export interface EventTypeInput {
  title: string;
  description?: string;
  durationMinutes: number;
  slug: string;
  hidden?: boolean;
}

export interface Slot {
  time: string;
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  slots: Slot[];
  timezone: string;
}

export interface MonthAvailabilityResponse {
  availableDates: string[];
  timezone: string;
}

export interface BookingBootstrapResponse {
  event: EventTypeWithHost;
  timezone: string;
  availableDates: string[];
  selectedDate: string | null;
  slots: Slot[];
  slotsByDate: Record<string, Slot[]>;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

export interface BookingWithEvent extends Booking {
  eventType: {
    title: string;
    durationMinutes: number;
    slug: string;
    user: { name: string; email?: string };
  };
}

export interface BookingListItem extends Booking {
  eventType: {
    title: string;
    durationMinutes: number;
    slug: string;
  };
}

export type BookingFilter = "upcoming" | "past" | "cancelled";

export interface CreateBookingInput {
  eventTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string;
}

export interface AvailabilityRule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilitySchedule {
  id: string;
  name: string;
  isDefault: boolean;
  timezone: string;
  summary: string;
  rules: AvailabilityRule[];
}

export interface CreateAvailabilityInput {
  name: string;
}

export interface UpdateAvailabilityInput {
  name?: string;
  timezone: string;
  rules: AvailabilityRule[];
}
