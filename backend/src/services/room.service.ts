import {RoomModel} from "../models/room.model";
import {AppError} from "../utils/appError";
import {ListRoomQuery, CreateRoomBody, UpdateRoomParams, UpdateRoomBody, DeleteRoomParams} from "../validators/room.validator";
import {escapeRegex} from "../utils/escapteRegex";

export async function listRooms(data:ListRoomQuery){
    const searchName = { $regex: escapeRegex(data.name ?? ""), $options: "i" };
    // Only filter on isActive when it was actually provided — `{isActive: undefined}` matches nothing
    const filter: Record<string, unknown> = { name: searchName };
    if (data.isActive !== undefined) filter.isActive = data.isActive;
    return await RoomModel.find(filter).sort({ name: 1 }).lean();
}

export async function createRoom(data:CreateRoomBody){
      const exists = await RoomModel.exists({ name: data.name });
      if (exists){
        throw new AppError(409, "Room name already exists");
      }
      return RoomModel.create(data);
}

export async function updateRoom(id: string, data:UpdateRoomBody){
    const room = await RoomModel.findById(id);
    if (!room){
        throw new AppError(404, "Room not found");
    }
    const exists = await RoomModel.exists({ name: data.name, _id: { $ne: id } });
    if (exists){
        throw new AppError(409, "Room name already exists");
    }
    room.name = data.name;
    room.isActive = data.isActive;
    return room.save();
}

export async function deleteRoom(id: string){
    const room = await RoomModel.findByIdAndDelete(id);
    if (!room) {
        throw new AppError(404, "Room not found");
    }
    return room; 
}