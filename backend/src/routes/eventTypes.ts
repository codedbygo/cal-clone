import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db";
import { getDefaultUserId } from "../lib/constants";
import { ApiError } from "../middleware/errorHandler";
import {
  validateDescription,
  validateDuration,
  validateHidden,
  validateSlug,
  validateTitle,
  validateBufferMinutes,
  validateCustomQuestions,
} from "../lib/validate";

const router = Router();

// GET /api/event-types — all event types for default host (incl. hidden)
router.get("/", async (_req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const eventTypes = await prisma.eventType.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(eventTypes);
  } catch (err) {
    next(err);
  }
});

// GET /api/event-types/slug/:slug — public booking page (hidden → 404 unless ?preview=1)
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const preview = req.query.preview === "1";
    const eventType = await prisma.eventType.findUnique({
      where: { userId_slug: { userId, slug: req.params.slug } },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!eventType || (eventType.hidden && !preview)) {
      throw new ApiError(404, "NOT_FOUND", "Event type not found");
    }
    res.json(eventType);
  } catch (err) {
    next(err);
  }
});

// POST /api/event-types — create
router.post("/", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const title = validateTitle(req.body.title);
    const description = validateDescription(req.body.description);
    const durationMinutes = validateDuration(req.body.durationMinutes);
    const slug = validateSlug(req.body.slug);
    const hidden =
      req.body.hidden !== undefined ? validateHidden(req.body.hidden) : false;
    const bufferBeforeMinutes = validateBufferMinutes(
      req.body.bufferBeforeMinutes,
      "bufferBeforeMinutes",
    );
    const bufferAfterMinutes = validateBufferMinutes(
      req.body.bufferAfterMinutes,
      "bufferAfterMinutes",
    );
    const customQuestions = validateCustomQuestions(req.body.customQuestions);

    const eventType = await prisma.eventType.create({
      data: {
        userId,
        title,
        description,
        durationMinutes,
        slug,
        hidden,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        customQuestions: customQuestions as unknown as Prisma.InputJsonValue,
      },
    });
    res.status(201).json(eventType);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(new ApiError(409, "SLUG_TAKEN", "This URL slug is already in use"));
    }
    next(err);
  }
});

// PATCH /api/event-types/:id — toggle hidden (on/off switch)
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const hidden = validateHidden(req.body.hidden);

    let eventType;
    try {
      eventType = await prisma.eventType.update({
        where: { id: req.params.id },
        data: { hidden },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ApiError(404, "NOT_FOUND", "Event type not found");
      }
      throw err;
    }
    if (eventType.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Event type not found");
    }
    res.json(eventType);
  } catch (err) {
    next(err);
  }
});

// PUT /api/event-types/:id — full update
router.put("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const existing = await prisma.eventType.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Event type not found");

    const data: Prisma.EventTypeUpdateInput = {};
    if (req.body.title !== undefined) data.title = validateTitle(req.body.title);
    if (req.body.description !== undefined) {
      data.description = validateDescription(req.body.description);
    }
    if (req.body.durationMinutes !== undefined) {
      data.durationMinutes = validateDuration(req.body.durationMinutes);
    }
    if (req.body.slug !== undefined) data.slug = validateSlug(req.body.slug);
    if (req.body.hidden !== undefined) data.hidden = validateHidden(req.body.hidden);
    if (req.body.bufferBeforeMinutes !== undefined) {
      data.bufferBeforeMinutes = validateBufferMinutes(
        req.body.bufferBeforeMinutes,
        "bufferBeforeMinutes",
      );
    }
    if (req.body.bufferAfterMinutes !== undefined) {
      data.bufferAfterMinutes = validateBufferMinutes(
        req.body.bufferAfterMinutes,
        "bufferAfterMinutes",
      );
    }
    if (req.body.customQuestions !== undefined) {
      data.customQuestions = validateCustomQuestions(
        req.body.customQuestions,
      ) as unknown as Prisma.InputJsonValue;
    }

    const eventType = await prisma.eventType.update({
      where: { id: existing.id },
      data,
    });
    res.json(eventType);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(new ApiError(409, "SLUG_TAKEN", "This URL slug is already in use"));
    }
    next(err);
  }
});

// DELETE /api/event-types/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const existing = await prisma.eventType.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Event type not found");

    await prisma.eventType.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
