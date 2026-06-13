  // Default schedule: Mon–Fri 09:00–17:00 IST
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
