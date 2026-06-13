import { Router } from "express";
import { addMinutes } from "date-fns";
import prisma, { prismaDirect } from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { invalidateBootstrapCache } from "./slots";
import { ApiError } from "../middleware/errorHandler";
import {
  validateAttendeeEmail,
  validateAttendeeName,
  validateBookingFilter,
  validateBookingStartTime,
  validateBookingStatus,
  validateEventTypeId,
} from "../lib/validate";

const router = Router();

// GET /api/bookings?filter=upcoming|past|cancelled — host dashboard list
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
        startTime:
          filter === "upcoming" ? "asc" : "desc",
      },
      include: {
        eventType: {
          select: { title: true, durationMinutes: true, slug: true },
        },
      },
    });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings — create with overlap check (409 SLOT_TAKEN)
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
        },
      });
    });

    invalidateBootstrapCache();

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id — confirmation page (includes event type details)
router.get("/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        eventType: {
          select: {
            title: true,
            durationMinutes: true,
            slug: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!booking) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id — cancel (status → CANCELLED)
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    validateBookingStatus(req.body.status);

    const existing = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { eventType: { select: { userId: true } } },
    });
    if (!existing || existing.eventType.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    const booking = await prisma.booking.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
      include: {
        eventType: {
          select: { title: true, durationMinutes: true, slug: true },
        },
      },
    });

    invalidateBootstrapCache();

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

export default router;
