import { Router } from "express";
import { addMinutes } from "date-fns";
import prisma from "../lib/db";
import { invalidateBootstrapCache } from "./slots";
import { ApiError } from "../middleware/errorHandler";
import {
  validateAttendeeEmail,
  validateAttendeeName,
  validateBookingStartTime,
  validateEventTypeId,
} from "../lib/validate";

const router = Router();

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
            user: { select: { name: true } },
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

    const booking = await prisma.$transaction(async (tx) => {
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

export default router;
