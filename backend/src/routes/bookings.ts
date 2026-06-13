import { Router } from "express";
import { addMinutes } from "date-fns";
import prisma, { prismaDirect } from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { invalidateBootstrapCache } from "./slots";
import { expandBookingWithBuffer } from "../services/slots";
import {
  createMeetingForBooking,
  deleteMeetingForBooking,
  updateMeetingForBooking,
} from "../services/integrations/meetingService";
import {
  sendBookingConfirmationEmail,
  sendBookingRescheduleEmail,
} from "../services/email/sendBookingEmails";
import { ApiError } from "../middleware/errorHandler";
import {
  validateAttendeeEmail,
  validateAttendeeName,
  validateBookingAnswers,
  validateBookingFilter,
  validateBookingStartTime,
  validateBookingStatus,
  validateCustomQuestions,
  validateEventTypeId,
} from "../lib/validate";

const router = Router();

const bookingDetailInclude = {
  eventType: {
    select: {
      title: true,
      durationMinutes: true,
      slug: true,
      customQuestions: true,
      user: { select: { name: true, email: true } },
    },
  },
} as const;

async function loadBookingDetail(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: bookingDetailInclude,
  });
}

async function assertNoOverlap(
  eventTypeId: string,
  startTime: Date,
  endTime: Date,
  bufferBefore: number,
  bufferAfter: number,
  excludeBookingId?: string,
) {
  const conflicts = await prisma.booking.findMany({
    where: {
      eventTypeId,
      status: "CONFIRMED",
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { startTime: true, endTime: true },
  });

  const candidate = expandBookingWithBuffer(
    { startTime, endTime },
    bufferBefore,
    bufferAfter,
  );

  for (const c of conflicts) {
    const blocked = expandBookingWithBuffer(c, bufferBefore, bufferAfter);
    if (
      candidate.startTime < blocked.endTime &&
      candidate.endTime > blocked.startTime
    ) {
      throw new ApiError(409, "SLOT_TAKEN", "This time slot is no longer available");
    }
  }
}

// GET /api/bookings?filter=upcoming|past|cancelled
router.get("/", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const filter = validateBookingFilter(req.query.filter);
    const now = new Date();

    const statusWhere =
      filter === "cancelled"
        ? { status: "CANCELLED" as const }
        : {
            status: "CONFIRMED" as const,
            startTime: filter === "upcoming" ? { gte: now } : { lt: now },
          };

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId },
        ...statusWhere,
      },
      orderBy: {
        startTime: filter === "upcoming" ? "asc" : "desc",
      },
      include: {
        eventType: {
          select: {
            title: true,
            durationMinutes: true,
            slug: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post("/", async (req, res, next) => {
  try {
    const eventTypeId = validateEventTypeId(req.body.eventTypeId);
    const attendeeName = validateAttendeeName(req.body.attendeeName);
    const attendeeEmail = validateAttendeeEmail(req.body.attendeeEmail);
    const startTime = validateBookingStartTime(req.body.startTime);

    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
    });
    if (!eventType || eventType.hidden) {
      throw new ApiError(404, "NOT_FOUND", "Event type not found");
    }

    const questions = validateCustomQuestions(
      Array.isArray(eventType.customQuestions) ? eventType.customQuestions : [],
    );
    const answers = validateBookingAnswers(questions, req.body.answers);

    const endTime = addMinutes(startTime, eventType.durationMinutes);

    const booking = await prismaDirect.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          eventTypeId,
          status: "CONFIRMED",
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (conflict) {
        throw new ApiError(409, "SLOT_TAKEN", "This time slot is no longer available");
      }

      return tx.booking.create({
        data: {
          eventTypeId,
          attendeeName,
          attendeeEmail,
          startTime,
          endTime,
          status: "CONFIRMED",
          answers: answers as object,
        },
      });
    });

    invalidateBootstrapCache();
    await createMeetingForBooking(booking.id);
    const updated = await loadBookingDetail(booking.id);
    if (updated) {
      void sendBookingConfirmationEmail(updated);
    }

    res.status(201).json(updated ?? booking);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get("/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingDetailInclude,
    });
    if (!booking) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id — cancel (host) or reschedule (new startTime)
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        eventType: {
          select: {
            userId: true,
            durationMinutes: true,
            bufferBeforeMinutes: true,
            bufferAfterMinutes: true,
          },
        },
      },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    if (req.body.startTime !== undefined) {
      if (existing.status !== "CONFIRMED") {
        throw new ApiError(400, "VALIDATION", "Only confirmed bookings can be rescheduled");
      }
      const startTime = validateBookingStartTime(req.body.startTime);
      const endTime = addMinutes(startTime, existing.eventType.durationMinutes);

      await assertNoOverlap(
        existing.eventTypeId,
        startTime,
        endTime,
        existing.eventType.bufferBeforeMinutes,
        existing.eventType.bufferAfterMinutes,
        existing.id,
      );

      const previousStartTime = existing.startTime;

      const booking = await prisma.booking.update({
        where: { id: existing.id },
        data: { startTime, endTime },
      });

      invalidateBootstrapCache();
      await updateMeetingForBooking(booking.id);
      const updated = await loadBookingDetail(booking.id);
      if (updated) {
        void sendBookingRescheduleEmail(updated, previousStartTime);
      }
      return res.json(updated ?? booking);
    }

    const userId = await getDefaultUserId();
    validateBookingStatus(req.body.status);

    if (existing.eventType.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    const booking = await prisma.booking.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
      include: {
        eventType: {
          select: {
            title: true,
            durationMinutes: true,
            slug: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    invalidateBootstrapCache();
    void deleteMeetingForBooking({
      id: existing.id,
      meetingProvider: existing.meetingProvider,
      externalEventId: existing.externalEventId,
      eventType: { userId: existing.eventType.userId },
    });

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

export default router;
