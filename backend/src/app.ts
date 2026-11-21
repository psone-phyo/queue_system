import express from "express";
import cors from "cors";
import { json, urlencoded } from "body-parser";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import roomRoutes from "./routes/room.route";
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
app.use(notFound);
app.use(errorHandler);

export default app;