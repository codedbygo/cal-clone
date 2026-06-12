import { Clock, Globe, Video } from "lucide-react";
import type { EventTypeWithHost } from "@/lib/types";

interface Props {
  event: EventTypeWithHost;
  timezone: string;
}

export function BookingEventInfo({ event, timezone }: Props) {
  const initials = event.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-medium text-white">
          {initials}
        </div>
        <span className="text-sm text-[#9ca3af]">{event.user.name}</span>
      </div>

      <h1 className="mt-6 text-xl font-semibold text-white lg:text-2xl">
        {event.title}
      </h1>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{event.durationMinutes}m</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <Video className="h-4 w-4 shrink-0" />
          <span>Cal Video</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <Globe className="h-4 w-4 shrink-0" />
          <span>{timezone}</span>
        </div>
      </div>

      {event.description && (
        <p className="mt-6 text-sm leading-relaxed text-[#9ca3af]">
          {event.description}
        </p>
      )}
    </div>
  );
}
