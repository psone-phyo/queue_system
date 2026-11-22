import {z} from "zod";

export const listRoomQuerySchema = z.object({
    name: z.string().trim().optional(),
    isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});
export type ListRoomQuery = z.infer<typeof listRoomQuerySchema>;

export const createRoomBodySchema = z.object({
      name: z.string().trim().min(1).max(50),  
      isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});
export type CreateRoomBody = z.infer<typeof createRoomBodySchema>;

export const updateRoomParamsSchema = z.object({
    id: z.string().trim().min(1),
});
export type UpdateRoomParams = z.infer<typeof updateRoomParamsSchema>;

export const updateRoomBodySchema = z.object({
    name: z.string().trim().min(1).max(50), 
    isActive: z.enum(["true", "false"]).transform((v) => v === "true"), 
});
export type UpdateRoomBody = z.infer<typeof updateRoomBodySchema>;

export const deleteRoomParamsSchema = z.object({
    id: z.string().trim().min(1),
});
export type DeleteRoomParams = z.infer<typeof deleteRoomParamsSchema>;
