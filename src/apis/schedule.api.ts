import request from "@/utils/request";

export interface CreateScheduleData {
  activity_id: string;
  resident_id?: string;
  staff_id?: string; // For single staff (backward compatible)
  staff_ids?: string[]; // For multiple staff assignment
  title: string;
  description?: string;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  frequency?: "daily" | "weekly" | "monthly" | "one_time" | "custom";
  is_recurring?: boolean;
  recurring_until?: string; // ISO date string
  status?: "planned" | "participated" | "did_not_participate";
  notes?: string;
}

export interface ScheduleResponse {
  schedule_id: string;
  activity_id: string;
  institution_id: string;
  resident_id?: string;
  staff_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  frequency: string;
  is_recurring: boolean;
  recurring_until?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  activity?: {
    activity_id: string;
    name: string;
    type: string;
    duration_minutes?: number;
  };
  resident?: {
    resident_id: string;
    full_name: string;
    room_id?: string;
  };
  staff?: {
    user_id: string;
    staffProfile?: {
      full_name: string;
      position: string;
    };
  };
  institution?: {
    institution_id: string;
    name: string;
  };
}

// Tạo schedule mới (hỗ trợ cả single và multiple staff)
export const createSchedule = async (data: CreateScheduleData) => {
  const response = await request.post("/api/schedules", data);
  // Response có thể là single schedule hoặc array of schedules
  return response.data;
};

// Lấy danh sách schedules
export const getSchedules = async (params?: {
  start_date?: string;
  end_date?: string;
  resident_id?: string;
  staff_id?: string;
}) => {
  const response = await request.get("/api/schedules", { params });
  return response.data;
};

// Lấy schedules sắp tới
export const getUpcomingSchedules = async () => {
  const response = await request.get("/api/schedules/upcoming");
  return response.data;
};

// Lấy thống kê schedules
export const getScheduleStatistics = async () => {
  const response = await request.get("/api/schedules/statistics");
  return response.data;
};

// Lấy schedules theo resident
export const getSchedulesByResident = async (residentId: string) => {
  const response = await request.get(`/api/schedules/resident/${residentId}`);
  return response.data;
};

// Lấy schedules theo staff
export const getSchedulesByStaff = async (staffId: string) => {
  const response = await request.get(`/api/schedules/staff/${staffId}`);
  return response.data;
};

// Lấy schedule theo ID
export const getScheduleById = async (scheduleId: string) => {
  const response = await request.get(`/api/schedules/${scheduleId}`);
  return response.data;
};

// Cập nhật schedule
export const updateSchedule = async (
  scheduleId: string,
  data: Partial<CreateScheduleData>
) => {
  const response = await request.put(`/api/schedules/${scheduleId}`, data);
  return response.data;
};

// Cập nhật status của schedule
export const updateScheduleStatus = async (
  scheduleId: string,
  status: "planned" | "participated" | "did_not_participate"
) => {
  const response = await request.patch(`/api/schedules/${scheduleId}/status`, {
    status,
  });
  return response.data;
};

// Xóa schedule
export const deleteSchedule = async (scheduleId: string) => {
  const response = await request.delete(`/api/schedules/${scheduleId}`);
  return response.data;
};
