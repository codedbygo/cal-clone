import type { MeetingProvider } from "@prisma/client";

export interface BookingEmailContext {
  eventTitle: string;
  hostName: string;
  hostEmail: string;
  guestName: string;
  guestEmail: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  meetingProvider: MeetingProvider;
  meetingUrl: string;
  rescheduleUrl: string;
}

function providerLabel(provider: MeetingProvider): string {
  if (provider === "GOOGLE_MEET") return "Google Meet";
  if (provider === "ZOOM") return "Zoom";
  return "Cal Video";
}

function formatDateTimeRange(
  start: Date,
  end: Date,
  timezone: string,
): string {
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(end)} (${timezone})`;
}

function baseDetails(ctx: BookingEmailContext): string {
  const where = providerLabel(ctx.meetingProvider);
  return [
    `Event: ${ctx.eventTitle}`,
    `When: ${formatDateTimeRange(ctx.startTime, ctx.endTime, ctx.timezone)}`,
    `Host: ${ctx.hostName} (${ctx.hostEmail})`,
    `Guest: ${ctx.guestName} (${ctx.guestEmail})`,
    `Where: ${where}`,
    `Join: ${ctx.meetingUrl}`,
    `Reschedule: ${ctx.rescheduleUrl}`,
  ].join("\n");
}

function baseDetailsHtml(ctx: BookingEmailContext): string {
  const where = providerLabel(ctx.meetingProvider);
  return `
    <p><strong>Event:</strong> ${ctx.eventTitle}</p>
    <p><strong>When:</strong> ${formatDateTimeRange(ctx.startTime, ctx.endTime, ctx.timezone)}</p>
    <p><strong>Host:</strong> ${ctx.hostName} (${ctx.hostEmail})</p>
    <p><strong>Guest:</strong> ${ctx.guestName} (${ctx.guestEmail})</p>
    <p><strong>Where:</strong> ${where}</p>
    <p><strong>Join:</strong> <a href="${ctx.meetingUrl}">${ctx.meetingUrl}</a></p>
    <p><a href="${ctx.rescheduleUrl}">Reschedule this booking</a></p>
  `;
}

export function confirmationEmail(ctx: BookingEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Confirmed: ${ctx.eventTitle} with ${ctx.hostName}`;
  const text = `Your meeting is scheduled.\n\n${baseDetails(ctx)}`;
  const html = `
    <h2>Your meeting is scheduled</h2>
    ${baseDetailsHtml(ctx)}
  `;
  return { subject, text, html };
}

export function rescheduleEmail(
  ctx: BookingEmailContext,
  previousStartTime: Date,
  previousEndTime: Date,
): { subject: string; text: string; html: string } {
  const subject = `Rescheduled: ${ctx.eventTitle} with ${ctx.hostName}`;
  const previousWhen = formatDateTimeRange(
    previousStartTime,
    previousEndTime,
    ctx.timezone,
  );
  const newWhen = formatDateTimeRange(ctx.startTime, ctx.endTime, ctx.timezone);
  const text = [
    "Your meeting has been rescheduled.",
    "",
    `Previous time: ${previousWhen}`,
    `New time: ${newWhen}`,
    "",
    baseDetails(ctx),
  ].join("\n");
  const html = `
    <h2>Your meeting has been rescheduled</h2>
    <p><strong>Previous time:</strong> ${previousWhen}</p>
    <p><strong>New time:</strong> ${newWhen}</p>
    ${baseDetailsHtml(ctx)}
  `;
  return { subject, text, html };
}
