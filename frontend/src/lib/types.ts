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
