import { Router } from "express";
import { subDays, startOfDay } from "date-fns";
import prisma from "../lib/db";
import { getDefaultUserId } from "../lib/constants";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDays(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : 30;
  if (Number.isNaN(n) || n < 1 || n > 365) return 30;
  return n;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh! * 60 + em! - (sh! * 60 + sm!);
}

// GET /api/insights/bookings
router.get("/bookings", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const days = parseDays(req.query.days);
    const since = subDays(new Date(), days);

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        createdAt: { gte: since },
      },
      include: {
        eventType: { select: { title: true, slug: true } },
      },
    });

    const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
    const cancelled = bookings.filter((b) => b.status === "CANCELLED");

    const byEventType = new Map<string, number>();
    const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
      day: DAY_NAMES[i]!,
      count: 0,
    }));
    const byHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      count: 0,
    }));
    const dailyMap = new Map<string, number>();

    for (const b of confirmed) {
      byEventType.set(
        b.eventType.title,
        (byEventType.get(b.eventType.title) ?? 0) + 1,
      );
      const d = new Date(b.startTime);
      byDayOfWeek[d.getDay()]!.count += 1;
      byHour[d.getHours()]!.count += 1;
      const dayKey = startOfDay(d).toISOString().slice(0, 10);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + 1);
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    res.json({
      days,
      total: bookings.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      cancellationRate:
        bookings.length > 0
          ? Math.round((cancelled.length / bookings.length) * 100)
          : 0,
      byEventType: Array.from(byEventType.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      byDayOfWeek,
      byHour: byHour.filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 18)),
      dailyTrend,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/routing
router.get("/routing", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const days = parseDays(req.query.days);
    const since = subDays(new Date(), days);

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        status: "CONFIRMED",
        createdAt: { gte: since },
      },
      include: {
        eventType: { select: { title: true, slug: true } },
      },
    });

    const bySlug = new Map<string, { slug: string; title: string; count: number }>();
    for (const b of bookings) {
      const key = b.eventType.slug;
      const existing = bySlug.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(key, {
          slug: b.eventType.slug,
          title: b.eventType.title,
          count: 1,
        });
      }
    }

    res.json({
      days,
      totalBookings: bookings.length,
      routedBookings: 0,
      directBookings: bookings.length,
      directPercent: 100,
      entryPoints: Array.from(bySlug.values()).sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/router-position
router.get("/router-position", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const days = parseDays(req.query.days);
    const since = subDays(new Date(), days);

    const schedule = await prisma.availabilitySchedule.findFirst({
      where: { userId, isDefault: true },
      include: { rules: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        status: "CONFIRMED",
        startTime: { gte: since },
      },
      select: { startTime: true, endTime: true },
    });

    const weeksInRange = Math.max(days / 7, 1);
    const byWeekday = DAY_NAMES.map((day, dayOfWeek) => {
      const rule = schedule?.rules.find((r) => r.dayOfWeek === dayOfWeek);
      const availableMinutes = rule
        ? minutesBetween(rule.startTime, rule.endTime) * weeksInRange
        : 0;

      let bookedMinutes = 0;
      for (const b of bookings) {
        if (new Date(b.startTime).getDay() === dayOfWeek) {
          bookedMinutes +=
            (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) /
            60_000;
        }
      }

      const utilization =
        availableMinutes > 0
          ? Math.round((bookedMinutes / availableMinutes) * 100)
          : 0;

      return {
        day,
        dayOfWeek,
        availableMinutes: Math.round(availableMinutes),
        bookedMinutes: Math.round(bookedMinutes),
        utilization: Math.min(utilization, 100),
      };
    });

    const totalAvailable = byWeekday.reduce((s, d) => s + d.availableMinutes, 0);
    const totalBooked = byWeekday.reduce((s, d) => s + d.bookedMinutes, 0);

    res.json({
      days,
      timezone: schedule?.timezone ?? "Asia/Kolkata",
      overallUtilization:
        totalAvailable > 0
          ? Math.min(Math.round((totalBooked / totalAvailable) * 100), 100)
          : 0,
      byWeekday: byWeekday.filter((d) => d.availableMinutes > 0 || d.bookedMinutes > 0),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/call-history
router.get("/call-history", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const days = parseDays(req.query.days);
    const since = subDays(new Date(), days);
    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        status: "CONFIRMED",
        endTime: { lt: now, gte: since },
      },
      orderBy: { startTime: "desc" },
      include: {
        eventType: { select: { title: true, slug: true } },
      },
    });

    res.json({
      days,
      total: bookings.length,
      calls: bookings.map((b) => ({
        id: b.id,
        attendeeName: b.attendeeName,
        attendeeEmail: b.attendeeEmail,
        eventTitle: b.eventType.title,
        startTime: b.startTime,
        endTime: b.endTime,
        meetingUrl: b.meetingUrl,
        meetingProvider: b.meetingProvider,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/wrong-routing
router.get("/wrong-routing", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const days = parseDays(req.query.days);
    const since = subDays(new Date(), days);

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        createdAt: { gte: since },
      },
      include: {
        eventType: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const cancelled = bookings.filter((b) => b.status === "CANCELLED");
    const byEvent = new Map<string, { confirmed: number; cancelled: number }>();

    for (const b of bookings) {
      const title = b.eventType.title;
      const row = byEvent.get(title) ?? { confirmed: 0, cancelled: 0 };
      if (b.status === "CANCELLED") row.cancelled += 1;
      else row.confirmed += 1;
      byEvent.set(title, row);
    }

    res.json({
      days,
      totalCancelled: cancelled.length,
      cancellationRateByEvent: Array.from(byEvent.entries()).map(
        ([eventTitle, stats]) => ({
          eventTitle,
          confirmed: stats.confirmed,
          cancelled: stats.cancelled,
          rate:
            stats.confirmed + stats.cancelled > 0
              ? Math.round(
                  (stats.cancelled / (stats.confirmed + stats.cancelled)) * 100,
                )
              : 0,
        }),
      ),
      cancelledBookings: cancelled.map((b) => ({
        id: b.id,
        attendeeName: b.attendeeName,
        eventTitle: b.eventType.title,
        startTime: b.startTime,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
