import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDB } from "./config/db";
const server = http.createServer(app);

async function start() {
  await connectDB();
  server.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});