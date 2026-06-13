import { Router } from "express";
import prisma from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { ApiError } from "../middleware/errorHandler";
import {
  computeDaySlots,
  computeMonthAvailability,
  monthRangeUtc,
} from "../services/availability";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const BOOTSTRAP_CACHE_TTL_MS = 5 * 60_000;

const bootstrapCache = new Map<
  string,
  { body: Record<string, unknown>; expires: number }
>();

async function loadEventWithSchedule(slug: string, preview: boolean) {
  const userId = await getDefaultUserId();
  const eventType = await prisma.eventType.findUnique({
    where: { userId_slug: { userId, slug } },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          schedule: { include: { rules: true } },
        },
      },
    },
  });
  if (!eventType || (eventType.hidden && !preview)) {
    throw new ApiError(404, "NOT_FOUND", "Event type not found");
  }
  return eventType;
}

async function loadEventForBootstrap(slug: string, preview: boolean) {
  const userId = await getDefaultUserId();
  const eventType = await prisma.eventType.findUnique({
    where: { userId_slug: { userId, slug } },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          schedule: { include: { rules: true } },
        },
      },
      bookings: {
        where: { status: "CONFIRMED" },
        select: { startTime: true, endTime: true },
      },
    },
  });
  if (!eventType || (eventType.hidden && !preview)) {
    throw new ApiError(404, "NOT_FOUND", "Event type not found");
  }
  return eventType;
}

function eventPayload(
  eventType: Awaited<ReturnType<typeof loadEventForBootstrap>>,
) {
  return {
    id: eventType.id,
    userId: eventType.userId,
    title: eventType.title,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    slug: eventType.slug,
    hidden: eventType.hidden,
    createdAt: eventType.createdAt,
    updatedAt: eventType.updatedAt,
    user: {
      name: eventType.user.name,
      email: eventType.user.email,
    },
  };
}

export function invalidateBootstrapCache() {
  bootstrapCache.clear();
}

// GET /api/slots/bootstrap — one round-trip: month dates + all day slots
router.get("/bootstrap", async (req, res, next) => {
  try {
    const slug = req.query.slug;
    const month = req.query.month;
    const preview = req.query.preview === "1";

    if (typeof slug !== "string" || !slug) {
      throw new ApiError(400, "VALIDATION", "slug: required");
    }
    if (typeof month !== "string" || !MONTH_RE.test(month)) {
      throw new ApiError(400, "VALIDATION", "month: must be YYYY-MM");
    }

    const cacheKey = `${slug}:${month}:${preview}`;
    const cached = bootstrapCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return res.json(cached.body);
    }

    const eventType = await loadEventForBootstrap(slug, preview);
    const schedule = eventType.user.schedule;

    if (!schedule) {
      const body = {
        event: eventPayload(eventType),
        timezone: "Asia/Kolkata",
        availableDates: [],
        selectedDate: null,
        slots: [],
        slotsByDate: {},
      };
      bootstrapCache.set(cacheKey, {
        body,
        expires: Date.now() + BOOTSTRAP_CACHE_TTL_MS,
      });
      return res.json(body);
    }

    const { rangeStart, rangeEnd } = monthRangeUtc(month, schedule.timezone);
    const bookings = eventType.bookings.filter(
      (b) => b.startTime < rangeEnd && b.endTime > rangeStart,
    );

    const availableDates = computeMonthAvailability({
      month,
      durationMinutes: eventType.durationMinutes,
      timezone: schedule.timezone,
      rules: schedule.rules,
      bookings,
    });

    const slotsByDate: Record<string, ReturnType<typeof computeDaySlots>> = {};
    for (const dateStr of availableDates) {
      slotsByDate[dateStr] = computeDaySlots({
        date: dateStr,
        durationMinutes: eventType.durationMinutes,
        timezone: schedule.timezone,
        rules: schedule.rules,
        bookings,
      });
    }

    const selectedDate = availableDates[0] ?? null;
    const slots = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

    const body = {
      event: eventPayload(eventType),
      timezone: schedule.timezone,
      availableDates,
      selectedDate,
      slots,
      slotsByDate,
    };
    bootstrapCache.set(cacheKey, {
      body,
      expires: Date.now() + BOOTSTRAP_CACHE_TTL_MS,
    });
    res.json(body);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const slug = req.query.slug;
    const date = req.query.date;
    const month = req.query.month;
    const preview = req.query.preview === "1";

    if (typeof slug !== "string" || !slug) {
      throw new ApiError(400, "VALIDATION", "slug: required");
    }

    const eventType = await loadEventWithSchedule(slug, preview);
    const schedule = eventType.user.schedule;

    if (typeof month === "string" && MONTH_RE.test(month)) {
      if (!schedule) {
        return res.json({ availableDates: [], timezone: "Asia/Kolkata" });
      }

      const { rangeStart, rangeEnd } = monthRangeUtc(month, schedule.timezone);
      const bookings = await prisma.booking.findMany({
        where: {
          eventTypeId: eventType.id,
          status: "CONFIRMED",
          startTime: { lt: rangeEnd },
          endTime: { gt: rangeStart },
        },
        select: { startTime: true, endTime: true },
      });

      const availableDates = computeMonthAvailability({
        month,
        durationMinutes: eventType.durationMinutes,
        timezone: schedule.timezone,
        rules: schedule.rules,
        bookings,
      });

      return res.json({
        availableDates,
        timezone: schedule.timezone,
      });
    }

    if (typeof date !== "string" || !DATE_RE.test(date)) {
      throw new ApiError(400, "VALIDATION", "date: must be YYYY-MM-DD");
    }

    if (!schedule) {
      return res.json({ slots: [], timezone: "Asia/Kolkata" });
    }

    const { rangeStart, rangeEnd } = monthRangeUtc(
      date.slice(0, 7),
      schedule.timezone,
    );

    const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        status: "CONFIRMED",
        startTime: { lt: rangeEnd },
        endTime: { gt: rangeStart },
      },
      select: { startTime: true, endTime: true },
    });

    const slots = computeDaySlots({
      date,
      durationMinutes: eventType.durationMinutes,
      timezone: schedule.timezone,
      rules: schedule.rules,
      bookings,
    });

    res.json({ slots, timezone: schedule.timezone });
  } catch (err) {
    next(err);
  }
});

export default router;
