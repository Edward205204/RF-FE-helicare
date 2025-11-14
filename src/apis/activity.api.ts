import request from "@/utils/request";

export type ActivityType =
  | "physical_exercise"
  | "mental_activity"
  | "social_interaction"
  | "meal_time"
  | "medical_checkup"
  | "therapy"
  | "entertainment"
  | "education"
  | "religious_service"
  | "other";

export interface CreateActivityData {
  name: string;
  description?: string;
  type: ActivityType;
  duration_minutes?: number;
  max_participants?: number;
}

export interface ActivityResponse {
  activity_id: string;
  institution_id: string;
  name: string;
  description?: string;
  type: ActivityType;
  duration_minutes?: number;
  max_participants?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tạo activity mới
export const createActivity = async (data: CreateActivityData) => {
  const response = await request.post("/api/activities", data);
  return response.data;
};

// Lấy danh sách activities
export const getActivities = async (params?: {
  take?: number;
  skip?: number;
  type?: ActivityType;
  is_active?: boolean;
  search?: string;
}) => {
  const response = await request.get("/api/activities", { params });
  return response.data;
};

// Lấy activity theo ID
export const getActivityById = async (activityId: string) => {
  const response = await request.get(`/api/activities/${activityId}`);
  return response.data;
};

// Lấy activity types
export const getActivityTypes = async () => {
  const response = await request.get("/api/activities/types");
  return response.data;
};

// Lấy activities theo type
export const getActivitiesByType = async (type: ActivityType) => {
  const response = await request.get(`/api/activities/type/${type}`);
  return response.data;
};

// Cập nhật activity
export const updateActivity = async (
  activityId: string,
  data: Partial<CreateActivityData & { is_active?: boolean }>
) => {
  const response = await request.put(`/api/activities/${activityId}`, data);
  return response.data;
};

// Xóa activity
export const deleteActivity = async (activityId: string) => {
  const response = await request.delete(`/api/activities/${activityId}`);
  return response.data;
};
