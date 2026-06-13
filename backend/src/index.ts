import "dotenv/config";
import express from "express";
import cors from "cors";

import prisma from "./lib/db";
import { getDefaultUserId } from "./lib/constants";
import eventTypesRouter from "./routes/eventTypes";
import slotsRouter from "./routes/slots";
import bookingsRouter from "./routes/bookings";
import availabilityRouter from "./routes/availability";
import { errorHandler } from "./middleware/errorHandler";

async function warmupDatabase() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$connect();
      await getDefaultUserId();
      console.log("Database connected");
      return;
    } catch (err) {
      if (attempt === 3) {
        console.warn(
          "DB warmup failed — API requests will error until Neon is reachable. Check DATABASE_URL in backend/.env:",
          err,
        );
        return;
      }
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({
      status: "degraded",
      db: "disconnected",
      hint: "Check DATABASE_URL / DIRECT_URL in backend/.env — Neon project may be paused.",
    });
  }
});

app.use("/api/event-types", eventTypesRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/availability", availabilityRouter);
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
