import type { MeetingProvider } from "@prisma/client";
import prisma from "../../lib/db";
import { sendEmail } from "./mailer";
import {
  confirmationEmail,
  rescheduleEmail,
  type BookingEmailContext,
} from "./templates";

type BookingForEmail = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: Date;
  endTime: Date;
  meetingUrl: string | null;
  meetingProvider: MeetingProvider;
  eventType: {
    title: string;
    slug: string;
    user: { name: string; email: string };
  };
};

function calVideoUrl(bookingId: string): string {
  const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return `${base}/booking/video?id=${encodeURIComponent(bookingId)}`;
}

function resolveMeetingUrl(booking: BookingForEmail): string {
  if (booking.meetingUrl?.startsWith("http")) return booking.meetingUrl;
  return calVideoUrl(booking.id);
}

async function resolveTimezoneForSlug(slug: string): Promise<string> {
  const eventType = await prisma.eventType.findFirst({
    where: { slug },
    select: { userId: true },
  });
  if (!eventType) return "Asia/Kolkata";

  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: eventType.userId, isDefault: true },
  });
  return schedule?.timezone ?? "Asia/Kolkata";
}

async function buildContext(booking: BookingForEmail): Promise<BookingEmailContext> {
  const timezone = await resolveTimezoneForSlug(booking.eventType.slug);
  const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const rescheduleUrl = `${base}/book/${booking.eventType.slug}?reschedule=${booking.id}`;

  return {
    eventTitle: booking.eventType.title,
    hostName: booking.eventType.user.name,
    hostEmail: booking.eventType.user.email,
    guestName: booking.attendeeName,
    guestEmail: booking.attendeeEmail,
    startTime: booking.startTime,
    endTime: booking.endTime,
    timezone,
    meetingProvider: booking.meetingProvider,
    meetingUrl: resolveMeetingUrl(booking),
    rescheduleUrl,
  };
}

async function sendToGuestAndHost(
  guestEmail: string,
  hostEmail: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  try {
    await sendEmail({ to: guestEmail, subject, text, html });
    if (hostEmail && hostEmail !== guestEmail) {
      await sendEmail({ to: hostEmail, subject, text, html });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send booking email:", message);
  }
}

export async function sendBookingConfirmationEmail(
  booking: BookingForEmail,
): Promise<void> {
  const ctx = await buildContext(booking);
  const { subject, text, html } = confirmationEmail(ctx);
  await sendToGuestAndHost(
    booking.attendeeEmail,
    booking.eventType.user.email,
    subject,
    text,
    html,
  );
}

export async function sendBookingRescheduleEmail(
  booking: BookingForEmail,
  previousStartTime: Date,
): Promise<void> {
  const ctx = await buildContext(booking);
  const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
  const previousEndTime = new Date(previousStartTime.getTime() + durationMs);
  const { subject, text, html } = rescheduleEmail(
    ctx,
    previousStartTime,
    previousEndTime,
  );
  await sendToGuestAndHost(
    booking.attendeeEmail,
    booking.eventType.user.email,
    subject,
    text,
    html,
  );
}
