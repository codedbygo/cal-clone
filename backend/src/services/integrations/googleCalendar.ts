import { randomUUID } from "crypto";

export interface CalendarMeetingResult {
  meetingUrl: string;
  externalEventId: string;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  input: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail: string;
    timezone: string;
  },
): Promise<CalendarMeetingResult> {
  const requestId = randomUUID();

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: {
          dateTime: input.startTime.toISOString(),
          timeZone: input.timezone,
        },
        end: {
          dateTime: input.endTime.toISOString(),
          timeZone: input.timezone,
        },
        attendees: [{ email: input.attendeeEmail }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error: ${body}`);
  }

  const event = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { uri?: string }[] };
  };

  const meetingUrl =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.uri)?.uri ??
    "";

  if (!meetingUrl) {
    throw new Error("Google Calendar event created but no Meet link returned");
  }

  return { meetingUrl, externalEventId: event.id };
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Failed to delete Google event: ${body}`);
  }
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  input: {
    title: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail: string;
    timezone: string;
  },
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        start: {
          dateTime: input.startTime.toISOString(),
          timeZone: input.timezone,
        },
        end: {
          dateTime: input.endTime.toISOString(),
          timeZone: input.timezone,
        },
        attendees: [{ email: input.attendeeEmail }],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update Google event: ${body}`);
  }
}
