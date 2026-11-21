import {RoomModel} from "../models/room.model";
import {AppError} from "../utils/appError";
import {ListRoomQuery, CreateRoomBody, UpdateRoomParams, UpdateRoomBody, DeleteRoomParams} from "../validators/room.validator";
import {escapeRegex} from "../utils/escapteRegex";

export async function listRooms(data:ListRoomQuery){
    const searchName = { $regex: escapeRegex(data.name), $options: "i" };
    return await RoomModel.find({name: searchName, isActive: data.isActive}).lean();
}

export async function createRoom(data:CreateRoomBody){
      const exists = await RoomModel.exists({ name: data.name });
      if (exists){
        throw new AppError(409, "Room name already exists");
      }
      return RoomModel.create({ name: data.name });
}

export async function updateRoom(params: UpdateRoomParams, data:UpdateRoomBody){
    const room = await RoomModel.findById(params.id);
    if (!room){
        throw new AppError(404, "Room not found");
    }
    const exists = await RoomModel.exists({ name: data.name, _id: { $ne: params.id } });
    if (exists){
        throw new AppError(409, "Room name already exists");
    }
    room.name = data.name;
    return room.save();
}

export async function deleteRoom(params: DeleteRoomParams){
    return await RoomModel.findByIdAndDelete(params.id);
}