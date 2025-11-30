import request from "@/utils/request";

export interface CreateCareLogData {
  resident_id: string;
  staff_id?: string;
  activity_id?: string;
  schedule_id?: string;
  type: "meal" | "exercise" | "hygiene" | "medication" | "custom";
  title: string;
  description?: string;
  start_time: string; // ISO date string
  end_time?: string; // ISO date string
  status?: "pending" | "in_progress" | "completed";

  // Medication specific fields
  medication_name?: string;
  dosage?: string;
  medication_status?: "scheduled" | "administered" | "skipped";

  // Meal specific fields
  meal_type?: string; // breakfast, lunch, dinner, snack
  food_items?: string;
  quantity?: string;

  // Exercise specific fields
  exercise_type?: string;
  duration_minutes?: number;
  intensity?: string; // low, medium, high

  notes?: string;
}

export interface CareLogResponse {
  care_log_id: string;
  resident_id: string;
  staff_id: string;
  activity_id?: string;
  schedule_id?: string;
  institution_id: string;
  type: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  status: string;
  medication_name?: string;
  dosage?: string;
  medication_status?: string;
  meal_type?: string;
  food_items?: string;
  quantity?: string;
  exercise_type?: string;
  duration_minutes?: number;
  intensity?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tạo care log mới
export const createCareLog = async (data: CreateCareLogData) => {
  const response = await request.post("/api/carelogs", data);
  return response.data;
};

// Lấy danh sách care logs
export const getCareLogs = async (params?: {
  start_date?: string;
  end_date?: string;
  resident_id?: string;
  staff_id?: string;
  type?: string;
  status?: string;
}) => {
  const response = await request.get("/api/carelogs", { params });
  return response.data;
};

// Lấy thống kê care logs
export const getCareLogStatistics = async () => {
  const response = await request.get("/api/carelogs/statistics");
  return response.data;
};

// Lấy care logs theo resident
export const getCareLogsByResident = async (residentId: string) => {
  const response = await request.get(`/api/carelogs/resident/${residentId}`);
  return response.data;
};

export const getMealCareLogsByResident = async (
  residentId: string,
  params?: {
    start_date?: string;
    end_date?: string;
    take?: number;
    skip?: number;
  }
) => {
  const response = await request.get(
    `/api/carelogs/resident/${residentId}/meals`,
    { params }
  );
  return response.data;
};

// Lấy care logs theo staff
export const getCareLogsByStaff = async (staffId: string) => {
  const response = await request.get(`/api/carelogs/staff/${staffId}`);
  return response.data;
};

// Lấy care log theo ID
export const getCareLogById = async (careLogId: string) => {
  const response = await request.get(`/api/carelogs/${careLogId}`);
  return response.data;
};

// Cập nhật care log
export const updateCareLog = async (
  careLogId: string,
  data: Partial<CreateCareLogData> & { correction_reason?: string }
) => {
  const response = await request.put(`/api/carelogs/${careLogId}`, data);
  return response.data;
};

// Cập nhật status của care log
export const updateCareLogStatus = async (
  careLogId: string,
  status: "pending" | "in_progress" | "completed",
  correction_reason?: string
) => {
  const response = await request.patch(`/api/carelogs/${careLogId}/status`, {
    status,
    correction_reason,
  });
  return response.data;
};

// Xóa care log
export const deleteCareLog = async (careLogId: string) => {
  const response = await request.delete(`/api/carelogs/${careLogId}`);
  return response.data;
};
