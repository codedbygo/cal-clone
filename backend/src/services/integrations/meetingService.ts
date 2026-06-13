import prisma from "../../lib/db";
import type { MeetingProvider } from "@prisma/client";
import {
  getConnectedIntegration,
  getValidAccessToken,
} from "./integrationStore";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from "./googleCalendar";
import { createZoomMeeting, deleteZoomMeeting, updateZoomMeeting } from "./zoomMeetings";

function calVideoUrl(bookingId: string): string {
  const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return `${base}/booking/video?id=${encodeURIComponent(bookingId)}`;
}

async function resolveTimezone(userId: string): Promise<string> {
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId, isDefault: true },
  });
  return schedule?.timezone ?? "Asia/Kolkata";
}

export async function createMeetingForBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      eventType: {
        include: { user: true },
      },
    },
  });
  if (!booking || booking.status !== "CONFIRMED") return;

  const userId = booking.eventType.userId;
  const timezone = await resolveTimezone(userId);
  const title = `${booking.eventType.title} with ${booking.attendeeName}`;
  const description = `Booking via Cal Clone\nGuest: ${booking.attendeeName} (${booking.attendeeEmail})`;

  const google = await getConnectedIntegration(userId, "GOOGLE");
  if (google?.status === "CONNECTED") {
    try {
      const token = await getValidAccessToken(userId, "GOOGLE");
      if (token) {
        const result = await createGoogleCalendarEvent(token, {
          title,
          description,
          startTime: booking.startTime,
          endTime: booking.endTime,
          attendeeEmail: booking.attendeeEmail,
          timezone,
        });
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            meetingUrl: result.meetingUrl,
            meetingProvider: "GOOGLE_MEET",
            externalEventId: result.externalEventId,
          },
        });
        return;
      }
    } catch (err) {
      console.error("Google meeting creation failed:", err);
    }
  }

  const zoom = await getConnectedIntegration(userId, "ZOOM");
  if (zoom?.status === "CONNECTED") {
    try {
      const token = await getValidAccessToken(userId, "ZOOM");
      if (token) {
        const result = await createZoomMeeting(token, {
          topic: title,
          startTime: booking.startTime,
          durationMinutes: booking.eventType.durationMinutes,
          timezone,
        });
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            meetingUrl: result.meetingUrl,
            meetingProvider: "ZOOM",
            externalEventId: result.externalEventId,
          },
        });
        return;
      }
    } catch (err) {
      console.error("Zoom meeting creation failed:", err);
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      meetingUrl: calVideoUrl(bookingId),
      meetingProvider: "CAL_VIDEO",
      externalEventId: null,
    },
  });
}

export async function updateMeetingForBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      eventType: {
        include: { user: true },
      },
    },
  });
  if (!booking || booking.status !== "CONFIRMED") return;

  const userId = booking.eventType.userId;
  const timezone = await resolveTimezone(userId);
  const title = `${booking.eventType.title} with ${booking.attendeeName}`;

  if (
    booking.meetingProvider === "GOOGLE_MEET" &&
    booking.externalEventId
  ) {
    const token = await getValidAccessToken(userId, "GOOGLE");
    if (token) {
      try {
        await updateGoogleCalendarEvent(token, booking.externalEventId, {
          title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          timezone,
        });
        return;
      } catch (err) {
        console.error("Google meeting update failed:", err);
      }
    }
  }

  if (booking.meetingProvider === "ZOOM" && booking.externalEventId) {
    const token = await getValidAccessToken(userId, "ZOOM");
    if (token) {
      try {
        await updateZoomMeeting(token, booking.externalEventId, {
          topic: title,
          startTime: booking.startTime,
          durationMinutes: booking.eventType.durationMinutes,
          timezone,
        });
        return;
      } catch (err) {
        console.error("Zoom meeting update failed:", err);
      }
    }
  }

  await createMeetingForBooking(bookingId);
}

export async function deleteMeetingForBooking(booking: {
  id: string;
  meetingProvider: MeetingProvider;
  externalEventId: string | null;
  eventType: { userId: string };
}): Promise<void> {
  const userId = booking.eventType.userId;

  if (booking.meetingProvider === "GOOGLE_MEET" && booking.externalEventId) {
    const token = await getValidAccessToken(userId, "GOOGLE");
    if (token) {
      try {
        await deleteGoogleCalendarEvent(token, booking.externalEventId);
      } catch (err) {
        console.error("Google meeting delete failed:", err);
      }
    }
  }

  if (booking.meetingProvider === "ZOOM" && booking.externalEventId) {
    const token = await getValidAccessToken(userId, "ZOOM");
    if (token) {
      try {
        await deleteZoomMeeting(token, booking.externalEventId);
      } catch (err) {
        console.error("Zoom meeting delete failed:", err);
      }
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      meetingUrl: null,
      externalEventId: null,
      meetingProvider: "CAL_VIDEO",
    },
  });
}
