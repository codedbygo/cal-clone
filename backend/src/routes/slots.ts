import { Router } from "express";
import {
  addDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import prisma from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { ApiError } from "../middleware/errorHandler";
import { generateSlots } from "../services/slots";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

async function loadEventType(slug: string, preview: boolean) {
  const userId = await getDefaultUserId();
  const eventType = await prisma.eventType.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (!eventType || (eventType.hidden && !preview)) {
    throw new ApiError(404, "NOT_FOUND", "Event type not found");
  }
  return eventType;
}

router.get("/", async (req, res, next) => {
  try {
    const slug = req.query.slug;
    const date = req.query.date;
    const month = req.query.month;
    const preview = req.query.preview === "1";

    if (typeof slug !== "string" || !slug) {
      throw new ApiError(400, "VALIDATION", "slug: required");
    }

    const eventType = await loadEventType(slug, preview);

    if (typeof month === "string" && MONTH_RE.test(month)) {
      const schedule = await prisma.availabilitySchedule.findUnique({
        where: { userId: eventType.userId },
        include: { rules: true },
      });
      if (!schedule) {
        return res.json({ availableDates: [], timezone: "UTC" });
      }

      const monthStart = parseISO(`${month}-01`);
      const monthEnd = endOfMonth(monthStart);
      const availableDates: string[] = [];

      for (
        let day = startOfMonth(monthStart);
        day <= monthEnd;
        day = addDays(day, 1)
      ) {
        const dateStr = format(day, "yyyy-MM-dd");
        const noonUtc = fromZonedTime(`${dateStr}T12:00:00`, schedule.timezone);
        const dayOfWeek = toZonedTime(noonUtc, schedule.timezone).getDay();
        const rule =
          schedule.rules.find((r) => r.dayOfWeek === dayOfWeek) ?? null;
        if (!rule) continue;

        const dayStart = fromZonedTime(
          `${dateStr}T00:00:00`,
          schedule.timezone,
        );
        const dayEnd = fromZonedTime(
          `${dateStr}T23:59:59`,
          schedule.timezone,
        );

        const bookings = await prisma.booking.findMany({
          where: {
            eventTypeId: eventType.id,
            status: "CONFIRMED",
            startTime: { lt: dayEnd },
            endTime: { gt: dayStart },
          },
          select: { startTime: true, endTime: true },
        });

        const slots = generateSlots({
          date: dateStr,
          durationMinutes: eventType.durationMinutes,
          timezone: schedule.timezone,
          rule: { startTime: rule.startTime, endTime: rule.endTime },
          bookings,
        });

        if (slots.length > 0) {
          availableDates.push(dateStr);
        }
      }

      return res.json({
        availableDates,
        timezone: schedule.timezone,
      });
    }

    if (typeof date !== "string" || !DATE_RE.test(date)) {
      throw new ApiError(400, "VALIDATION", "date: must be YYYY-MM-DD");
    }

    const schedule = await prisma.availabilitySchedule.findUnique({
      where: { userId: eventType.userId },
      include: { rules: true },
    });
    if (!schedule) {
      return res.json({ slots: [] });
    }

    const noonUtc = fromZonedTime(`${date}T12:00:00`, schedule.timezone);
    const dayOfWeek = toZonedTime(noonUtc, schedule.timezone).getDay();
    const rule =
      schedule.rules.find((r) => r.dayOfWeek === dayOfWeek) ?? null;

    const dayStart = fromZonedTime(`${date}T00:00:00`, schedule.timezone);
    const dayEnd = fromZonedTime(`${date}T23:59:59`, schedule.timezone);

    const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        status: "CONFIRMED",
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true },
    });

    const slots = generateSlots({
      date,
      durationMinutes: eventType.durationMinutes,
      timezone: schedule.timezone,
      rule: rule ? { startTime: rule.startTime, endTime: rule.endTime } : null,
      bookings,
    });

    res.json({ slots, timezone: schedule.timezone });
  } catch (err) {
    next(err);
  }
});

export default router;
