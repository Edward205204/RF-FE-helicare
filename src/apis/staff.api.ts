import request from "@/utils/request";

export interface StaffResponse {
  user_id: string;
  email: string;
  role: string;
  status?: string; // "active" | "inactive"
  full_name: string;
  phone: string;
  position: string | null;
  hire_date: string | null;
  staff_role?: string | null;
  phone_number?: string;
  shift?: string | null;
  current_tasks?: number;
  completed_tasks_today?: number;
  assigned_residents?: number;
  avatar?: string | null;
  notes?: string | null;
}

export const getStaffList = async () => {
  const response = await request.get("/api/staff/staff");
  return response.data;
};

export interface StaffDetailResponse {
  user_id: string;
  email: string;
  role: string;
  full_name: string;
  staff_role: string | null;
  phone_number: string;
  avatar: string | null;
  hire_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const getStaffById = async (staff_id: string) => {
  const response = await request.get(`/api/staff/${staff_id}`);
  return response.data;
};

export interface StaffResidentResponse {
  resident_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  room_id: string | null;
  admission_date: string | null;
  room?: {
    room_id: string;
    room_number: string;
    type: string;
  } | null;
}

export const getStaffResidents = async (staff_id: string) => {
  const response = await request.get(`/api/staff/${staff_id}/residents`);
  return response.data;
};

export interface StaffTaskResponse {
  pending_tasks: Array<{
    care_log_id: string;
    resident_id: string;
    type: string;
    title: string;
    description?: string;
    start_time: string;
    status: string;
    resident?: {
      resident_id: string;
      full_name: string;
    };
  }>;
  completed_tasks: Array<{
    care_log_id: string;
    resident_id: string;
    type: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    status: string;
    resident?: {
      resident_id: string;
      full_name: string;
    };
  }>;
}

export const getStaffTasks = async (staff_id: string) => {
  const response = await request.get(`/api/staff/${staff_id}/tasks`);
  return response.data;
};

export interface AssignTaskPayload {
  task_type: string;
  resident_id?: string;
  due_time: string;
  description?: string;
  title: string;
}

export const assignTaskToStaff = async (
  staff_id: string,
  data: AssignTaskPayload
) => {
  const response = await request.post(
    `/api/staff/${staff_id}/assign-task`,
    data
  );
  return response.data;
};

export const markTaskDone = async (task_id: string) => {
  const response = await request.patch(`/api/staff/tasks/${task_id}/done`);
  return response.data;
};

export interface StaffPerformanceResponse {
  tasks_completed: number;
  tasks_late: number;
  assessments_completed: number;
  alerts_handled: number;
  ranking: string;
}

export const getStaffPerformance = async (staff_id: string, month?: string) => {
  const query = month ? `?month=${month}` : "";
  const response = await request.get(
    `/api/staff/${staff_id}/performance${query}`
  );
  return response.data;
};

export interface CreateIncidentPayload {
  resident_id: string;
  type: string;
  description: string;
  severity: string;
}

export const createIncident = async (data: CreateIncidentPayload) => {
  const response = await request.post("/api/staff/incident", data);
  return response.data;
};

export interface IncidentResponse {
  incident_id: string;
  resident_id: string;
  type: string;
  description: string;
  severity: string;
  created_at: string;
  resident?: {
    resident_id: string;
    full_name: string;
  };
  staff?: {
    user_id: string;
    staffProfile?: {
      full_name: string;
      position: string;
    };
  };
}

export const getIncidents = async () => {
  const response = await request.get("/api/staff/incidents");
  return response.data;
};

export interface CreateStaffPayload {
  avatar?: string | null;
  email: string;
  full_name: string;
  phone: string;
  hire_date: string;
  position: string;
  notes?: string;
  institution_id: string;
}

export interface MessageResponse {
  message: string;
}

export const createStaffForInstitution = async (
  data: CreateStaffPayload
): Promise<MessageResponse> => {
  const response = await request.post(
    "/api/staff/create-staff-for-institution",
    data
  );
  return response.data;
};

export interface UploadStaffAvatarResponse {
  url: string;
  type: string;
}

export const uploadStaffAvatar = async (
  file: File,
  options?: { staffInviteToken?: string }
): Promise<{ message: string; data: UploadStaffAvatarResponse }> => {
  const formData = new FormData();
  formData.append("image", file);
  const endpoint = options?.staffInviteToken
    ? `/api/staff/upload-staff-avatar?staff_invite_token=${encodeURIComponent(
        options.staffInviteToken
      )}`
    : "/api/staff/upload-staff-avatar";
  const response = await request.post(endpoint, formData);
  return response.data;
};

export interface VerifyStaffInvitePayload {
  email: string;
  password: string;
  confirm_password: string;
  staff_invite_token: string;
  avatar?: string | null;
}

export const verifyStaffInviteAndResetPassword = async (
  data: VerifyStaffInvitePayload
): Promise<MessageResponse> => {
  const response = await request.post(
    "/api/staff/verify-staff-invite-and-reset-password",
    data
  );
  return response.data;
};
