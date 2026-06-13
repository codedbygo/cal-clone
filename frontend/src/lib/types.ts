export interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "textarea";
  required: boolean;
}

export interface EventType {
  id: string;
  userId: string;
  title: string;
  description: string;
  durationMinutes: number;
  slug: string;
  hidden: boolean;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  customQuestions: CustomQuestion[];
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
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  customQuestions?: CustomQuestion[];
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
  preferredMeetingProvider: MeetingProvider;
  availableDates: string[];
  selectedDate: string | null;
  slots: Slot[];
  slotsByDate: Record<string, Slot[]>;
}

export type MeetingProvider = "GOOGLE_MEET" | "ZOOM" | "CAL_VIDEO";

export interface Booking {
  id: string;
  eventTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "CANCELLED";
  answers: Record<string, string>;
  meetingUrl?: string | null;
  meetingProvider?: MeetingProvider;
  externalEventId?: string | null;
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
    user?: { name: string };
  };
}

export type IntegrationProvider = "GOOGLE" | "ZOOM";

export interface IntegrationSummary {
  provider: IntegrationProvider;
  name: string;
  category: "Calendar" | "Video";
  description: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  accountEmail: string | null;
  connectedAt: string | null;
  configured: boolean;
}

export interface InsightsBookingsData {
  days: number;
  total: number;
  confirmed: number;
  cancelled: number;
  cancellationRate: number;
  byEventType: { name: string; count: number }[];
  byDayOfWeek: { day: string; count: number }[];
  byHour: { hour: number; label: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export interface InsightsRoutingData {
  days: number;
  totalBookings: number;
  routedBookings: number;
  directBookings: number;
  directPercent: number;
  entryPoints: { slug: string; title: string; count: number }[];
}

export interface InsightsRouterPositionData {
  days: number;
  timezone: string;
  overallUtilization: number;
  byWeekday: {
    day: string;
    dayOfWeek: number;
    availableMinutes: number;
    bookedMinutes: number;
    utilization: number;
  }[];
}

export interface InsightsCallHistoryData {
  days: number;
  total: number;
  calls: {
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    eventTitle: string;
    startTime: string;
    endTime: string;
    meetingUrl: string | null;
    meetingProvider: MeetingProvider;
  }[];
}

export interface InsightsWrongRoutingData {
  days: number;
  totalCancelled: number;
  cancellationRateByEvent: {
    eventTitle: string;
    confirmed: number;
    cancelled: number;
    rate: number;
  }[];
  cancelledBookings: {
    id: string;
    attendeeName: string;
    eventTitle: string;
    startTime: string;
    createdAt: string;
  }[];
}

export type BookingFilter = "upcoming" | "past" | "cancelled";

export interface CreateBookingInput {
  eventTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string;
  answers?: Record<string, string>;
}

export interface AvailabilityOverride {
  date: string;
  type: "UNAVAILABLE" | "CUSTOM_HOURS";
  startTime?: string;
  endTime?: string;
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
  overrides: AvailabilityOverride[];
}

export interface CreateAvailabilityInput {
  name: string;
}

export interface UpdateAvailabilityInput {
  name?: string;
  timezone: string;
  rules: AvailabilityRule[];
  overrides?: AvailabilityOverride[];
}
