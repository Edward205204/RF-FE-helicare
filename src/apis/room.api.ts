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

export interface RoomListParams {
  page?: number;
  limit?: number;
}

export interface RoomListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoomListResult {
  rooms: RoomResponse[];
  pagination?: RoomListMeta;
}

// Lấy danh sách rooms (institution_id lấy từ token BE)
export const getRooms = async (
  params?: RoomListParams
): Promise<RoomListResult> => {
  const response = await request.get(`/api/rooms/rooms`, {
    params: params
      ? {
          page: params.page,
          limit: params.limit,
        }
      : undefined,
  });

  const payload = response.data?.data;

  if (Array.isArray(payload)) {
    return {
      rooms: payload,
    };
  }

  return {
    rooms: payload?.rooms || [],
    pagination: payload?.pagination,
  };
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

// Room Change Request APIs
export interface RoomChangeRequestResponse {
  request_id: string;
  resident_id: string;
  institution_id: string;
  requested_by: string;
  requested_by_role: string;
  current_room_id: string | null;
  requested_room_id: string;
  requested_room_type: "single" | "double" | "multi";
  status: "pending" | "approved" | "rejected" | "completed";
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  resident?: {
    resident_id: string;
    full_name: string;
  };
  current_room?: {
    room_id: string;
    room_number: string;
  };
  requested_room?: {
    room_id: string;
    room_number: string;
    type: string;
    capacity: number;
    current_occupancy: number;
  };
}

export interface CreateRoomChangeRequestData {
  resident_id: string;
  requested_room_id: string;
  requested_room_type: "single" | "double" | "multi";
  reason?: string;
}

// Lấy danh sách phòng trống theo type
export const getAvailableRoomsByType = async (roomType: string) => {
  const response = await request.get(`/api/rooms/rooms/available`, {
    params: { room_type: roomType },
  });
  return response.data;
};

// Tạo yêu cầu đổi phòng
export const createRoomChangeRequest = async (
  data: CreateRoomChangeRequestData
) => {
  const response = await request.post(`/api/rooms/room-change-requests`, data);
  return response.data;
};

// Lấy danh sách room change requests cho family
export const getRoomChangeRequestsForFamily = async () => {
  const response = await request.get(`/api/rooms/room-change-requests/family`);
  return response.data;
};

// Lấy danh sách room change requests (cho staff)
export const getRoomChangeRequests = async (status?: string) => {
  const response = await request.get(`/api/rooms/room-change-requests`, {
    params: status ? { status } : undefined,
  });
  return response.data;
};

// Staff xác nhận room change request
export const approveRoomChangeRequest = async (
  requestId: string,
  notes?: string
) => {
  const response = await request.post(
    `/api/rooms/room-change-requests/${requestId}/approve`,
    { notes }
  );
  return response.data;
};

// Staff từ chối room change request
export const rejectRoomChangeRequest = async (
  requestId: string,
  notes?: string
) => {
  const response = await request.post(
    `/api/rooms/room-change-requests/${requestId}/reject`,
    { notes }
  );
  return response.data;
};
