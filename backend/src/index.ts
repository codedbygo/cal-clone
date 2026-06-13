import "dotenv/config";
import express from "express";
import cors from "cors";

import prisma from "./lib/db";
import { getDefaultUserId } from "./lib/constants";
import eventTypesRouter from "./routes/eventTypes";
import slotsRouter from "./routes/slots";
import bookingsRouter from "./routes/bookings";
import { errorHandler } from "./middleware/errorHandler";

async function warmupDatabase() {
  try {
    await prisma.$connect();
    await getDefaultUserId();
  } catch (err) {
    console.warn("DB warmup failed — first request may be slow:", err);
  }
}

const app = express();

// Only the frontend origin may call this API from a browser (HLD §11)
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/event-types", eventTypesRouter);
app.use("/api/slots", slotsRouter);
// app.use("/api/availability", availabilityRouter);  // Task 2.3
app.use("/api/bookings", bookingsRouter);

// Central error handler — must be registered after all routes
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

// On Vercel the app runs as a serverless function — Vercel invokes the
// exported handler itself, so binding a port would be wrong there.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    void warmupDatabase();
  });
}

export default app;
