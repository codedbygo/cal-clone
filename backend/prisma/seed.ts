import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addDays, format, nextMonday } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

const TZ = "Asia/Kolkata";

// "10:00 on <date> in IST" → the exact UTC instant (Hyderabad uses Asia/Kolkata).
function slotUtc(day: Date, time: string, durationMinutes: number) {
  const start = fromZonedTime(`${format(day, "yyyy-MM-dd")}T${time}:00`, TZ);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

// Idempotent: users/event types/schedule upsert by unique keys;
// bookings are wiped and recreated so their relative dates
// (upcoming vs past) stay correct no matter when seeding runs.
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "host@example.com" },
    update: { name: "Savitha Sista", timezone: TZ },
    create: {
      name: "Savitha Sista",
      email: "host@example.com",
      timezone: TZ,
    },
  });

  const thirtyMin = await prisma.eventType.upsert({
    where: { userId_slug: { userId: user.id, slug: "30-min" } },
    update: {},
    create: {
      userId: user.id,
      title: "30 Minute Meeting",
      description: "A quick half-hour sync to discuss anything you like.",
      durationMinutes: 30,
      slug: "30-min",
    },
  });

  const introCall = await prisma.eventType.upsert({
    where: { userId_slug: { userId: user.id, slug: "intro-call" } },
    update: { hidden: true },
    create: {
      userId: user.id,
      title: "Intro Call",
      description: "Short 15-minute introduction call.",
      durationMinutes: 15,
      slug: "intro-call",
      hidden: true,
    },
  });

  await prisma.eventType.upsert({
    where: { userId_slug: { userId: user.id, slug: "15-min" } },
    update: {},
    create: {
      userId: user.id,
      title: "15 min meeting",
      description: "Quick 15-minute catch-up.",
      durationMinutes: 15,
      slug: "15-min",
      hidden: false,
    },
  });

  // Weekly availability: Mon–Fri (1–5), 09:00–17:00 in schedule TZ.
  // Rules are replaced wholesale — same semantics as PUT /api/availability.
  const schedule = await prisma.availabilitySchedule.upsert({
    where: { userId: user.id },
    update: { timezone: TZ },
    create: { userId: user.id, timezone: TZ },
  });
  await prisma.availabilityRule.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.availabilityRule.createMany({
    data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      scheduleId: schedule.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
    })),
  });

  // Bookings: 1 upcoming confirmed, 1 past confirmed, 1 past cancelled —
  // all on Mondays inside the 9–5 window so they match availability.
  await prisma.booking.deleteMany({});

  const upcomingMonday = nextMonday(new Date());
  const lastMonday = addDays(upcomingMonday, -7);
  const twoMondaysAgo = addDays(upcomingMonday, -14);

  const upcoming = slotUtc(upcomingMonday, "10:00", thirtyMin.durationMinutes);
  const pastDone = slotUtc(lastMonday, "11:00", thirtyMin.durationMinutes);
  const pastCancelled = slotUtc(twoMondaysAgo, "15:00", introCall.durationMinutes);

  await prisma.booking.createMany({
    data: [
      {
        eventTypeId: thirtyMin.id,
        attendeeName: "Asha Rao",
        attendeeEmail: "asha@example.com",
        startTime: upcoming.start,
        endTime: upcoming.end,
        status: "CONFIRMED",
      },
      {
        eventTypeId: thirtyMin.id,
        attendeeName: "Vikram Shetty",
        attendeeEmail: "vikram@example.com",
        startTime: pastDone.start,
        endTime: pastDone.end,
        status: "CONFIRMED",
      },
      {
        eventTypeId: introCall.id,
        attendeeName: "Meera Iyer",
        attendeeEmail: "meera@example.com",
        startTime: pastCancelled.start,
        endTime: pastCancelled.end,
        status: "CANCELLED",
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    eventTypes: await prisma.eventType.count(),
    rules: await prisma.availabilityRule.count(),
    bookings: await prisma.booking.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
