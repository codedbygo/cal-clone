import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { formatScheduleSummary } from "../lib/scheduleSummary";
import { invalidateBootstrapCache } from "./slots";
import { ApiError } from "../middleware/errorHandler";
import {
  validateAvailabilityRules,
  validateAvailabilityOverrides,
  validateScheduleName,
  validateTimezone,
} from "../lib/validate";

const router = Router();

const scheduleInclude = {
  rules: { orderBy: { dayOfWeek: "asc" as const } },
  overrides: { orderBy: { date: "asc" as const } },
} satisfies Prisma.AvailabilityScheduleInclude;

type ScheduleRecord = Prisma.AvailabilityScheduleGetPayload<{
  include: typeof scheduleInclude;
}>;

const DEFAULT_RULES = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
}));

function formatSchedule(schedule: ScheduleRecord) {
  const rules = schedule.rules
    .map(({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const overrides = schedule.overrides
    .map(({ date, type, startTime, endTime }) => ({
      date,
      type,
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    id: schedule.id,
    name: schedule.name,
    isDefault: schedule.isDefault,
    timezone: schedule.timezone,
    summary: formatScheduleSummary(rules),
    rules,
    overrides,
  };
}

async function loadScheduleForUser(id: string, userId: string) {
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { id, userId },
    include: scheduleInclude,
  });
  if (!schedule) {
    throw new ApiError(404, "NOT_FOUND", "Schedule not found");
  }
  return schedule;
}

async function loadScheduleWithRules(id: string) {
  return prisma.availabilitySchedule.findUniqueOrThrow({
    where: { id },
    include: scheduleInclude,
  });
}

// GET /api/availability — list all schedules for host
router.get("/", async (_req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const schedules = await prisma.availabilitySchedule.findMany({
      where: { userId },
      include: scheduleInclude,
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    res.json(schedules.map(formatSchedule));
  } catch (err) {
    next(err);
  }
});

// POST /api/availability — create named schedule (Cal.com "+ New" flow)
router.post("/", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const name = validateScheduleName(req.body.name);
    const timezone =
      req.body.timezone !== undefined
        ? validateTimezone(req.body.timezone)
        : "Asia/Kolkata";
    const rules =
      req.body.rules !== undefined
        ? validateAvailabilityRules(req.body.rules)
        : DEFAULT_RULES;

    const existingCount = await prisma.availabilitySchedule.count({
      where: { userId },
    });
    const isDefault = existingCount === 0;

    const created = await prisma.availabilitySchedule.create({
      data: { userId, name, timezone, isDefault },
    });

    if (rules.length > 0) {
      await prisma.availabilityRule.createMany({
        data: rules.map((r) => ({ scheduleId: created.id, ...r })),
      });
    }

    const schedule = await loadScheduleWithRules(created.id);

    invalidateBootstrapCache();
    res.status(201).json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// GET /api/availability/:id — single schedule for edit page
router.get("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const schedule = await loadScheduleForUser(req.params.id, userId);
    res.json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// PUT /api/availability/:id — update name, timezone, weekly rules
router.put("/:id", async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const userId = await getDefaultUserId();
    await loadScheduleForUser(scheduleId, userId);

    const name =
      req.body.name !== undefined
        ? validateScheduleName(req.body.name)
        : undefined;
    const timezone = validateTimezone(req.body.timezone);
    const rules = validateAvailabilityRules(req.body.rules);
    const overrides =
      req.body.overrides !== undefined
        ? validateAvailabilityOverrides(req.body.overrides)
        : undefined;

    await prisma.availabilitySchedule.update({
      where: { id: scheduleId },
      data: {
        ...(name !== undefined ? { name } : {}),
        timezone,
      },
    });

    await prisma.availabilityRule.deleteMany({ where: { scheduleId } });

    if (rules.length > 0) {
      await prisma.availabilityRule.createMany({
        data: rules.map((r) => ({ scheduleId, ...r })),
      });
    }

    if (overrides !== undefined) {
      await prisma.availabilityOverride.deleteMany({ where: { scheduleId } });
      if (overrides.length > 0) {
        await prisma.availabilityOverride.createMany({
          data: overrides.map((o) => ({
            scheduleId,
            date: o.date,
            type: o.type,
            startTime: o.startTime ?? null,
            endTime: o.endTime ?? null,
          })),
        });
      }
    }

    const schedule = await loadScheduleWithRules(scheduleId);

    invalidateBootstrapCache();
    res.json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/availability/:id/default — mark as default for public booking
router.patch("/:id/default", async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const userId = await getDefaultUserId();
    await loadScheduleForUser(scheduleId, userId);

    await prisma.availabilitySchedule.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    await prisma.availabilitySchedule.update({
      where: { id: scheduleId },
      data: { isDefault: true },
    });

    const schedule = await loadScheduleWithRules(scheduleId);

    invalidateBootstrapCache();
    res.json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/availability/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const schedule = await loadScheduleForUser(req.params.id, userId);

    const count = await prisma.availabilitySchedule.count({ where: { userId } });
    if (count <= 1) {
      throw new ApiError(
        400,
        "VALIDATION",
        "Cannot delete your only availability schedule",
      );
    }

    await prisma.availabilitySchedule.delete({ where: { id: schedule.id } });

    if (schedule.isDefault) {
      const nextSchedule = await prisma.availabilitySchedule.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (nextSchedule) {
        await prisma.availabilitySchedule.update({
          where: { id: nextSchedule.id },
          data: { isDefault: true },
        });
      }
    }

    invalidateBootstrapCache();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
