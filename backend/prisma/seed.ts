import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TZ = "Asia/Kolkata";

// Idempotent: users/event types/schedule upsert by unique keys.
// Bookings are not seeded — they come only from the public booking flow.
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

  await prisma.eventType.upsert({
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
