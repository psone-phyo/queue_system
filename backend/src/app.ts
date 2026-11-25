import express from "express";
import cors from "cors";
import { json, urlencoded } from "body-parser";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import roomRoutes from "./routes/room.route";
import authRoutes from "./routes/auth.route";
import ticketRoutes from "./routes/ticket.route";
import queueRoutes from "./routes/queue.route";
import staffRoutes from "./routes/staff.route";
import statsRoutes from "./routes/stats.route";
import qrRoutes from "./routes/qr.route";
import { notFound, errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/qr", qrRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
