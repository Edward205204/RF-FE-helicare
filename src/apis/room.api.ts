import request from "@/utils/request";

export interface RoomResponse {
  room_id: string;
  room_number: string;
  type: "single" | "double" | "multi";
  capacity: number;
  current_occupancy: number;
  is_available: boolean;
  notes?: string;
  institution_id: string;
  residents?: Array<{
    resident_id: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
  }>;
}

export interface CreateRoomData {
  room_number: string;
  type: "single" | "double" | "multi";
  capacity: number;
  notes?: string;
}

// Lấy danh sách rooms (institution_id lấy từ token BE)
export const getRooms = async () => {
  const response = await request.get(`/api/rooms/rooms`);
  return response.data;
};

// Lấy thông tin room theo ID
export const getRoomById = async (roomId: string) => {
  const response = await request.get(`/api/rooms/rooms/${roomId}`);
  return response.data;
};

// Lấy danh sách residents trong room
export const getResidentsInRoom = async (roomId: string) => {
  const response = await request.get(`/api/rooms/rooms/${roomId}/residents`);
  return response.data;
};

// Tạo room mới (chỉ admin)
export const createRoom = async (data: CreateRoomData) => {
  const response = await request.post(`/api/rooms/rooms`, data);
  return response.data;
};

// Update room (chỉ admin)
export const updateRoom = async (
  roomId: string,
  data: Partial<CreateRoomData>
) => {
  const response = await request.patch(`/api/rooms/rooms/${roomId}`, data);
  return response.data;
};

// Delete room (chỉ admin)
export const deleteRoom = async (roomId: string) => {
  const response = await request.delete(`/api/rooms/rooms/${roomId}`);
  return response.data;
};
