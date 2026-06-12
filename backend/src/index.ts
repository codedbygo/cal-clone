import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

// Only the frontend origin may call this API from a browser (HLD §11)
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routers are mounted here as they are built (Tasks 1.1–2.4):
// app.use("/api/event-types", eventTypesRouter);
// app.use("/api/availability", availabilityRouter);
// app.use("/api/slots", slotsRouter);
// app.use("/api/bookings", bookingsRouter);

const PORT = Number(process.env.PORT) || 4000;

// On Vercel the app runs as a serverless function — Vercel invokes the
// exported handler itself, so binding a port would be wrong there.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;
