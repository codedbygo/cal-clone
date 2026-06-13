import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addDays, format, nextMonday } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

const TZ = "Asia/Kolkata";

/** All demo bookings use demo-{category}-{n}@example.com — seed keeps exactly 9 rows. */
const DEMO_EMAIL_PREFIX = "demo-";

function demoEmail(category: "upcoming" | "past" | "cancelled", n: number) {
  return `demo-${category}-${n}@example.com`;
}

function slotUtc(day: Date, time: string, durationMinutes: number) {
  const start = fromZonedTime(`${format(day, "yyyy-MM-dd")}T${time}:00`, TZ);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startTime: start, endTime: end };
}

function demoBooking(
  eventTypeId: string,
  name: string,
  email: string,
  day: Date,
  time: string,
  durationMinutes: number,
  status: "CONFIRMED" | "CANCELLED",
) {
  const { startTime, endTime } = slotUtc(day, time, durationMinutes);
  return { eventTypeId, attendeeName: name, attendeeEmail: email, startTime, endTime, status };
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "host@example.com" },
    update: { name: "Default Host", timezone: TZ },
    create: {
      name: "Default Host",
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

  await prisma.eventType.upsert({
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

  const fifteenMin = await prisma.eventType.upsert({
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

  let schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!schedule) {
    schedule = await prisma.availabilitySchedule.findFirst({
      where: { userId: user.id },
    });
  }
  if (!schedule) {
    schedule = await prisma.availabilitySchedule.create({
      data: {
        userId: user.id,
        name: "Working hours",
        isDefault: true,
        timezone: TZ,
      },
    });
  } else {
    await prisma.availabilitySchedule.update({
      where: { id: schedule.id },
      data: { name: "Working hours", isDefault: true, timezone: TZ },
    });
  }

  await prisma.availabilityRule.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.availabilityRule.createMany({
    data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      scheduleId: schedule!.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
    })),
  });

  // Bookings: drop test data, then insert 3 per tab (upcoming / past / cancelled).
  const removed = await prisma.booking.deleteMany({
    where: { NOT: { attendeeEmail: { startsWith: DEMO_EMAIL_PREFIX } } },
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} test booking(s)`);
  }

  await prisma.booking.deleteMany({
    where: { attendeeEmail: { startsWith: DEMO_EMAIL_PREFIX } },
  });

  const upcomingMonday = nextMonday(new Date());
  const upcomingTuesday = addDays(upcomingMonday, 1);
  const upcomingWednesday = addDays(upcomingMonday, 2);
  const lastMonday = addDays(upcomingMonday, -7);
  const lastTuesday = addDays(upcomingMonday, -6);
  const lastWednesday = addDays(upcomingMonday, -5);
  const twoMondaysAgo = addDays(upcomingMonday, -14);
  const twoTuesdaysAgo = addDays(upcomingMonday, -13);
  const twoWednesdaysAgo = addDays(upcomingMonday, -12);

  await prisma.booking.createMany({
    data: [
      demoBooking(thirtyMin.id, "Alex Demo", demoEmail("upcoming", 1), upcomingMonday, "10:00", thirtyMin.durationMinutes, "CONFIRMED"),
      demoBooking(fifteenMin.id, "Blake Demo", demoEmail("upcoming", 2), upcomingTuesday, "14:00", fifteenMin.durationMinutes, "CONFIRMED"),
      demoBooking(thirtyMin.id, "Casey Demo", demoEmail("upcoming", 3), upcomingWednesday, "11:30", thirtyMin.durationMinutes, "CONFIRMED"),
      demoBooking(thirtyMin.id, "Jordan Demo", demoEmail("past", 1), lastMonday, "11:00", thirtyMin.durationMinutes, "CONFIRMED"),
      demoBooking(fifteenMin.id, "Kelly Demo", demoEmail("past", 2), lastTuesday, "15:00", fifteenMin.durationMinutes, "CONFIRMED"),
      demoBooking(thirtyMin.id, "Lee Demo", demoEmail("past", 3), lastWednesday, "09:30", thirtyMin.durationMinutes, "CONFIRMED"),
      demoBooking(fifteenMin.id, "Sam Demo", demoEmail("cancelled", 1), twoMondaysAgo, "15:00", fifteenMin.durationMinutes, "CANCELLED"),
      demoBooking(thirtyMin.id, "Morgan Demo", demoEmail("cancelled", 2), twoTuesdaysAgo, "10:00", thirtyMin.durationMinutes, "CANCELLED"),
      demoBooking(fifteenMin.id, "Riley Demo", demoEmail("cancelled", 3), twoWednesdaysAgo, "16:00", fifteenMin.durationMinutes, "CANCELLED"),
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    eventTypes: await prisma.eventType.count(),
    schedules: await prisma.availabilitySchedule.count(),
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
