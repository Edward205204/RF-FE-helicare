import request from "@/utils/request";

// Admin Auth
export interface AdminLoginReqBody {
  email: string;
  password: string;
}

export interface AdminRegisterReqBody {
  email: string;
  password: string;
  confirm_password: string;
  institution_id: string;
}

export interface AdminUserResponse {
  user_id: string;
  email: string;
  role: "RootAdmin" | "Admin";
  institution_id: string;
  status: string;
  staffProfile?: {
    full_name: string;
    phone: string;
    position: string;
    avatar: string | null;
  };
}

// Dashboard Stats
export interface DashboardStatsResponse {
  total_residents: number;
  active_residents: number;
  total_staff: number;
  active_staff: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  alerts_count: number;
  occupancy_rate: number;
  total_beds: number;
  occupied_beds: number;
}

// Resident Management
export interface ResidentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "discharged";
  room_id?: string;
}

export interface CreateResidentReqBody {
  full_name: string;
  gender: "male" | "female";
  date_of_birth: string;
  room_id?: string;
  notes?: string;
}

export interface UpdateResidentReqBody {
  full_name?: string;
  gender?: "male" | "female";
  date_of_birth?: string;
  room_id?: string;
  notes?: string;
}

// Staff/Admin Management
export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "Staff" | "Admin" | "RootAdmin";
}

export interface CreateAdminReqBody {
  email: string;
  institution_id: string;
}

export interface UpdateStaffReqBody {
  role?: "Staff" | "Admin";
  status?: "active" | "inactive";
}

// Tasks
export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: "pending" | "in_progress" | "completed";
  staff_id?: string;
}

export interface CreateTaskReqBody {
  title: string;
  description: string;
  staff_id: string;
  resident_id?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high";
}

export interface UpdateTaskReqBody {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  progress?: number;
}

// ========== AUTH ENDPOINTS ==========

export const adminLogin = async (
  data: AdminLoginReqBody
): Promise<{
  message: string;
  data: { access_token: string; user: AdminUserResponse };
}> => {
  const response = await request.post("/api/admin/login", data);
  return response.data;
};

export const adminRegister = async (
  data: AdminRegisterReqBody
): Promise<{ message: string }> => {
  const response = await request.post("/api/admin/register", data);
  return response.data;
};

export const getAdminMe = async (): Promise<{
  message: string;
  data: AdminUserResponse;
}> => {
  const response = await request.get("/api/admin/me");
  return response.data;
};

// ========== DASHBOARD ENDPOINTS ==========

export const getDashboardStats = async (): Promise<{
  message: string;
  data: DashboardStatsResponse;
}> => {
  const response = await request.get("/api/admin/dashboard/stats");
  return response.data;
};

// ========== RESIDENTS ENDPOINTS ==========

export const getAdminResidents = async (
  params?: ResidentListParams
): Promise<{
  message: string;
  residents: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const response = await request.get("/api/admin/residents", { params });
  return response.data;
};

export const createAdminResident = async (
  data: CreateResidentReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.post("/api/admin/residents", data);
  return response.data;
};

export const updateAdminResident = async (
  id: string,
  data: UpdateResidentReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.put(`/api/admin/residents/${id}`, data);
  return response.data;
};

export const deleteAdminResident = async (
  id: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/admin/residents/${id}`);
  return response.data;
};

// ========== STAFF/ADMIN ENDPOINTS ==========

export const getAdminStaff = async (
  params?: StaffListParams
): Promise<{
  message: string;
  staff: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const response = await request.get("/api/admin/staff", { params });
  return response.data;
};

export const createAdmin = async (
  data: CreateAdminReqBody
): Promise<{ message: string }> => {
  const response = await request.post("/api/admin/staff", data);
  return response.data;
};

export const updateAdminStaff = async (
  id: string,
  data: UpdateStaffReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.put(`/api/admin/staff/${id}`, data);
  return response.data;
};

export const deleteAdminStaff = async (
  id: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/admin/staff/${id}`);
  return response.data;
};

// ========== TASKS ENDPOINTS ==========

export const getAdminTasks = async (
  params?: TaskListParams
): Promise<{
  message: string;
  tasks: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const response = await request.get("/api/admin/tasks", { params });
  return response.data;
};

export const createAdminTask = async (
  data: CreateTaskReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.post("/api/admin/tasks", data);
  return response.data;
};

export const updateAdminTask = async (
  id: string,
  data: UpdateTaskReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.put(`/api/admin/tasks/${id}`, data);
  return response.data;
};

export const deleteAdminTask = async (
  id: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/admin/tasks/${id}`);
  return response.data;
};
