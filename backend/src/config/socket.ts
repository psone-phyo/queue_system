import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { env } from "./env";
import { logger } from "./logger";
import jwt from "jsonwebtoken";
import { Role } from "../constants/roles";

let io: SocketIOServer;

/**
 * initSocket — call once in server.ts, passing the HTTP server.
 * Must be called BEFORE server.listen so the socket server attaches first.
 */
export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // The patient token is taken from the httpOnly cookie, never from an
    // unauthenticated client event argument.
    const cookies = Object.fromEntries(
      (socket.handshake.headers.cookie ?? "")
        .split(";")
        .map((part) => part.trim().split(/=(.*)/s).slice(0, 2))
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => [key, decodeURIComponent(value)])
    );
    const patientToken = cookies.queue_ticket;
    if (patientToken) socket.join(`patient:${patientToken}`);

    // Public display screen joins the "display" broadcast room
    socket.on("join:display", () => {
      socket.join("display");
    });

    // Receptionist / admin dashboard
    socket.on("join:dashboard", () => {
      const accessToken = socket.handshake.auth?.accessToken;
      if (typeof accessToken !== "string") return;
      try {
        const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { role: Role };
        if (payload.role === "admin" || payload.role === "receptionist") {
          socket.join("dashboard");
        }
      } catch {
        // Invalid or expired credentials do not join the staff channel.
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * getIO — used by services to emit events.
 * Throws if called before initSocket (guards against accidental early use).
 */
export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialised — call initSocket(server) in server.ts first");
  return io;
}
