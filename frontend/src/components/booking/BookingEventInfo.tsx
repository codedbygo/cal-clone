import { Calendar, Clock, Globe, Video } from "lucide-react";
import type { EventTypeWithHost } from "@/lib/types";
import { formatBookingSlotSummary } from "@/lib/utils";

interface Props {
  event: EventTypeWithHost;
  timezone: string;
  selectedDayLabel?: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
}

export function BookingEventInfo({
  event,
  timezone,
  selectedDayLabel,
  selectedStartTime,
  selectedEndTime,
}: Props) {
  const initials = event.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const slotSummary =
    selectedDayLabel && selectedStartTime && selectedEndTime
      ? formatBookingSlotSummary(
          selectedDayLabel,
          selectedStartTime,
          selectedEndTime,
        )
      : null;

  return (
    <div className="flex flex-col p-6 lg:border-r lg:border-gray-200 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-medium text-white">
          {initials}
        </div>
        <span className="text-sm text-gray-500">{event.user.name}</span>
      </div>

      <h1 className="mt-6 text-xl font-semibold text-gray-900 lg:text-2xl">
        {event.title}
      </h1>

      <div className="mt-4 space-y-3">
        {slotSummary && (
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{slotSummary}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{event.durationMinutes}m</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Video className="h-4 w-4 shrink-0" />
          <span>Cal Video</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Globe className="h-4 w-4 shrink-0" />
          <span>{timezone}</span>
        </div>
      </div>

      {event.description && !slotSummary && (
        <p className="mt-6 text-sm leading-relaxed text-gray-500">
          {event.description}
        </p>
      )}
    </div>
  );
}
