import request from "@/utils/request";

export type EventType = "Care" | "Entertainment" | "Other";
export type EventStatus = "Upcoming" | "Cancelled" | "Ongoing" | "Ended";
export type CareSubType =
  | "VitalCheck"
  | "Therapy"
  | "MedicationAdmin"
  | "Hygiene"
  | "Meal"
  | "Other";
export type EventFrequency = "Daily" | "Weekly" | "Monthly" | "OneTime";

export interface CareConfiguration {
  subType: CareSubType;
  frequency?: EventFrequency;
}

export interface CreateEventData {
  name: string;
  type: EventType;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  location?: string; // Default to institution name if not provided
  room_ids?: string[]; // Optional for special events
  care_configuration?: CareConfiguration; // Only for Care events
}

export interface UpdateEventData {
  name?: string;
  type?: EventType;
  start_time?: string; // ISO date string
  end_time?: string; // ISO date string
  location?: string;
  room_ids?: string[];
  care_configuration?: CareConfiguration;
  status?: EventStatus; // Can be set to Cancelled, but Ongoing/Ended are auto-calculated
}

export interface EventResponse {
  event_id: string;
  institution_id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  start_time: string;
  end_time: string;
  location: string;
  room_ids: string[];
  care_configuration?: CareConfiguration | null;
  created_at: string;
  updated_at: string;
  institution?: {
    institution_id: string;
    name: string;
  };
}

export interface GetEventsParams {
  take?: number;
  skip?: number;
  type?: EventType;
  status?: EventStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface EventPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetEventsResponse {
  message: string;
  data: {
    events: EventResponse[];
    total: number;
    pagination?: EventPagination;
  };
}

// Tạo event mới
export const createEvent = async (data: CreateEventData) => {
  const response = await request.post("/api/events", data);
  return response.data;
};

// Lấy danh sách events
export const getEvents = async (params?: GetEventsParams) => {
  const response = await request.get("/api/events", { params });
  return response.data;
};

// Lấy events theo room_id (cho resident/family)
export const getEventsByRoom = async (roomId: string, params?: GetEventsParams) => {
  const response = await request.get("/api/events/room", { 
    params: { ...params, room_id: roomId } 
  });
  return response.data;
};

// Lấy event theo ID
export const getEventById = async (eventId: string) => {
  const response = await request.get(`/api/events/${eventId}`);
  return response.data;
};

// Cập nhật event
export const updateEvent = async (eventId: string, data: UpdateEventData) => {
  const response = await request.patch(`/api/events/${eventId}`, data);
  return response.data;
};

// Xóa event
export const deleteEvent = async (eventId: string) => {
  const response = await request.delete(`/api/events/${eventId}`);
  return response.data;
};
