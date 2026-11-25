import { Role } from "../constants/roles";

// Augment Express's Request so TypeScript knows about req.staff everywhere.
// This avoids casting (req as any).staff throughout the codebase.
declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth after a valid JWT is verified.
      // Optional because public routes don't have an authenticated staff user.
      staff?: {
        id: string;       // MongoDB _id as string
        role: Role;
        name: string;
      };
    }
  }
}
