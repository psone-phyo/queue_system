export const ROLES = ["admin","receptionist"] as const;
export type Role = (typeof ROLES)[number];