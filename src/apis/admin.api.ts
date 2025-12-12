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
  status?: "active" | "inactive" | "discharged";
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

export interface UpdateResidentStatusReqBody {
  status: "active" | "inactive" | "discharged";
}

export interface ExportQuery {
  format?: "csv" | "xlsx";
  search?: string;
  status?: string;
  room_id?: string;
  role?: "Staff" | "Admin" | "RootAdmin";
}

export interface AuditLog {
  audit_id: string;
  target_type: string;
  target_id: string | null;
  action: string;
  metadata?: any;
  created_at: string;
  actor_id?: string | null;
}

// Staff/Admin Management
export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "Staff" | "Admin" | "RootAdmin";
  status?: "active" | "inactive" | "pending";
}

export interface CreateAdminReqBody {
  email: string;
  institution_id: string;
}

export interface UpdateStaffReqBody {
  role?: "Staff" | "Admin";
  status?: "active" | "inactive" | "pending";
}

export interface ApproveStaffReqBody {
  approve: boolean;
  reason?: string;
}

export interface AssignStaffResidentReqBody {
  resident_id: string;
  role?: string;
}

export interface RevenueQuery {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month";
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

export const updateAdminResidentStatus = async (
  id: string,
  data: UpdateResidentStatusReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.patch(
    `/api/admin/residents/${id}/status`,
    data
  );
  return response.data;
};

export const deleteAdminResident = async (
  id: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/admin/residents/${id}`);
  return response.data;
};

export const exportAdminResidents = async (
  params?: ResidentListParams & ExportQuery
): Promise<Blob> => {
  const response = await request.get("/api/admin/residents/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const getAdminResidentAudit = async (
  id: string
): Promise<{ message: string; data: AuditLog[] }> => {
  const response = await request.get(`/api/admin/residents/${id}/audit`);
  return response.data;
};

export const getAdminResidentAssignments = async (
  id: string
): Promise<{ message: string; data: any[] }> => {
  const response = await request.get(`/api/admin/residents/${id}/assignments`);
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

export const exportAdminStaff = async (
  params?: StaffListParams & ExportQuery
): Promise<Blob> => {
  const response = await request.get("/api/admin/staff/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const approveAdminStaff = async (
  id: string
): Promise<{ message: string; data: any }> => {
  const response = await request.patch(`/api/admin/staff/${id}/approve`);
  return response.data;
};

export const rejectAdminStaff = async (
  id: string,
  body?: ApproveStaffReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.patch(`/api/admin/staff/${id}/reject`, body);
  return response.data;
};

export const resetAdminStaffPassword = async (
  id: string
): Promise<{ message: string }> => {
  const response = await request.post(`/api/admin/staff/${id}/reset-password`);
  return response.data;
};

export const assignAdminStaffResident = async (
  id: string,
  body: AssignStaffResidentReqBody
): Promise<{ message: string; data: any }> => {
  const response = await request.post(`/api/admin/staff/${id}/assign`, body);
  return response.data;
};

export const unassignAdminStaffResident = async (
  id: string,
  resident_id: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/admin/staff/${id}/assign`, {
    data: { resident_id },
  });
  return response.data;
};

export const getAdminStaffAudit = async (
  id: string
): Promise<{ message: string; data: AuditLog[] }> => {
  const response = await request.get(`/api/admin/staff/${id}/audit`);
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

// ========== AUDIT / SETTINGS / ANALYTICS ==========

export const getAdminAuditLogs = async (
  params?: any
): Promise<{ message: string; data: AuditLog[] }> => {
  const response = await request.get("/api/admin/audit", { params });
  return response.data;
};

export const getAdminSettings = async (): Promise<{
  message: string;
  data: any;
}> => {
  const response = await request.get("/api/admin/settings");
  return response.data;
};

export const updateAdminSettings = async (
  data: any
): Promise<{ message: string; data: any }> => {
  const response = await request.put("/api/admin/settings", data);
  return response.data;
};

export const getAdminRevenueAnalytics = async (
  params?: RevenueQuery
): Promise<{
  message: string;
  data: { series: { date: string; value: number }[] };
}> => {
  const response = await request.get("/api/admin/analytics/revenue", {
    params,
  });
  return response.data;
};

export const getAdminAnalyticsSummary = async (): Promise<{
  message: string;
  data: {
    total_revenue: number;
    mrr: number;
    arr: number;
    active_contracts: number;
    unpaid_invoices: number;
  };
}> => {
  const response = await request.get("/api/admin/analytics/summary");
  return response.data;
};
