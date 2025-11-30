import request from "@/utils/request";

export interface CreateResidentData {
  full_name: string;
  gender: "male" | "female";
  date_of_birth: string; // ISO date string
  notes?: string;
  assigned_staff_id?: string;
  room_id?: string;
  family_user_id?: string; // ID của family member để link
  // Body measurements (chỉ nhập một lần)
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  chronicDiseases?: Array<{
    name: string;
    diagnosed_at?: string;
    severity?: "MILD" | "MODERATE" | "SEVERE";
    status?: "ACTIVE" | "RECOVERED";
    note?: string;
  }>;
  allergies?: Array<{
    substance: string;
    reaction?: string;
    severity?: "MILD" | "MODERATE" | "SEVERE";
    note?: string;
  }>;
}

export interface ResidentResponse {
  resident_id: string;
  full_name: string;
  gender: "male" | "female";
  date_of_birth: string;
  notes?: string;
  assigned_staff_id?: string;
  room_id?: string;
  admission_date?: string;
  created_at: string;
  institution_id?: string;
  // Body measurements (chỉ nhập một lần)
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  room?: {
    room_id: string;
    room_number: string;
    type: string;
    capacity: number;
    is_available: boolean;
    current_occupancy: number;
  };
  chronicDiseases?: Array<{
    id: string;
    name: string;
    diagnosed_at?: string;
    severity?: string;
    status?: string;
    note?: string;
  }>;
  allergies?: Array<{
    id: string;
    substance: string;
    reaction?: string;
    severity?: string;
    note?: string;
  }>;
  familyResidentLinks?: Array<{
    link_id: string;
    family_email: string;
    status: string;
  }>;
  healthAssessments?: Array<{
    assessment_id: string;
    created_at: string;
    temperature_c?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    notes?: string;
  }>;
}

export interface ResidentListParams {
  page?: number;
  limit?: number;
  search?: string;
  roomId?: string;
}

export interface ResidentListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResidentListResult {
  residents: ResidentResponse[];
  pagination?: ResidentListMeta;
}

// Lấy danh sách residents (có thể paginate/filter)
export const getResidents = async (
  params?: ResidentListParams
): Promise<ResidentListResult> => {
  const response = await request.get("/api/residents/get-resident", {
    params: params
      ? {
          page: params.page,
          limit: params.limit,
          search: params.search,
          room_id: params.roomId,
        }
      : undefined,
  });

  const payload = response.data?.data;

  if (Array.isArray(payload)) {
    return {
      residents: payload,
    };
  }

  return {
    residents: payload?.residents || [],
    pagination: payload?.pagination,
  };
};

// Lấy thông tin resident theo ID
export const getResidentById = async (residentId: string) => {
  const response = await request.get(
    `/api/residents/get-resident-by-id/${residentId}`
  );
  return response.data;
};

// Tạo resident mới
export const createResident = async (data: CreateResidentData) => {
  const response = await request.post("/api/residents/create-resident", data);
  return response.data;
};

// Tạo applicant (lịch hẹn đánh giá)
export const createApplicant = async (data: {
  resident_id: string;
  appointment_date: string;
}) => {
  const response = await request.post("/api/residents/create-applicant", data);
  return response.data;
};

// Lấy danh sách lịch hẹn pending
export const getAppointmentPending = async () => {
  const response = await request.get("/api/residents/get-appointment-pending");
  return response.data;
};

// Lấy lịch sử các lịch hẹn
export const getAppointmentHistory = async () => {
  const response = await request.get("/api/residents/get-appointment-history");
  return response.data;
};

// Join institution (chấp nhận resident vào viện)
export const joinInstitution = async (data: { resident_id: string }) => {
  const response = await request.post("/api/residents/join-institution", data);
  return response.data;
};

// Get family dashboard data
export const getFamilyDashboardData = async (residentId?: string) => {
  const response = await request.get("/api/residents/family/dashboard", {
    params: residentId ? { resident_id: residentId } : undefined,
  });
  return response.data;
};

// Get resident dashboard data
export const getResidentDashboardData = async () => {
  const response = await request.get("/api/residents/resident/dashboard");
  return response.data;
};

export const updateResident = async (
  residentId: string,
  data: Partial<{
    full_name: string;
    gender: "male" | "female";
    date_of_birth: string;
    notes: string;
    room_id: string;
    height_cm: number;
    weight_kg: number;
    bmi: number;
  }>
) => {
  const response = await request.put(
    `/api/residents/update-resident/${residentId}`,
    data
  );
  return response.data;
};

export const deleteResident = async (residentId: string) => {
  const response = await request.delete(
    `/api/residents/delete-resident/${residentId}`
  );
  return response.data;
};

// Lấy danh sách residents của family user
export const getResidentsByFamily = async () => {
  const response = await request.get("/api/residents/get-residents-by-family");
  return response.data;
};

// Lấy danh sách người thân liên kết với resident
export const getFamilyMembersByResident = async (residentId: string) => {
  const response = await request.get(
    `/api/residents/get-family-members-by-resident/${residentId}`
  );
  return response.data;
};

export interface FamilyMemberResponse {
  link_id: string;
  family_user_id: string;
  family_email: string;
  status: string;
  created_at: string;
  full_name: string;
  phone: string | null;
  address: string | null;
}

// Assign staff to resident
export interface AssignStaffPayload {
  staff_id: string;
  shift?: string;
}

export const assignStaffToResident = async (
  residentId: string,
  data: AssignStaffPayload
) => {
  const response = await request.post(
    `/api/residents/${residentId}/assign-staff`,
    data
  );
  return response.data;
};

// Get staff assigned to resident
export interface ResidentStaffResponse {
  user_id: string;
  email: string;
  role: string;
  staffProfile?: {
    full_name: string;
    phone: string;
    position: string;
    avatar: string | null;
    hire_date: string;
  };
}

export const getResidentStaff = async (residentId: string) => {
  const response = await request.get(`/api/residents/${residentId}/staff`);
  return response.data;
};

// Password Management APIs
export interface ResidentAccountResponse {
  resident_id: string;
  full_name: string;
  user?: {
    user_id: string;
    email: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
  } | null;
  room?: {
    room_id: string;
    room_number: string;
  } | null;
  password_status: "not_changed" | "changed";
}

export interface ResidentAccountsParams {
  page?: number;
  limit?: number;
  search?: string;
  password_status?: "all" | "not_changed" | "changed";
  sort_by?: "name" | "created_at" | "status";
  sort_order?: "asc" | "desc";
}

export interface ResidentAccountsResult {
  residents: ResidentAccountResponse[];
  pagination?: ResidentListMeta;
}

// Get resident accounts for password management
export const getResidentAccounts = async (
  params?: ResidentAccountsParams
): Promise<ResidentAccountsResult> => {
  const response = await request.get(
    "/api/residents/password-management/accounts",
    {
      params: params
        ? {
            page: params.page,
            limit: params.limit,
            search: params.search,
            password_status: params.password_status,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
          }
        : undefined,
    }
  );
  // Backend returns { message, data: { residents, pagination } }
  return response.data?.data || response.data;
};

// Reset resident password (sets to inactive - resident must change on first login)
export const resetResidentPassword = async (
  residentId: string,
  newPassword: string
) => {
  const response = await request.post(
    `/api/residents/password-management/${residentId}/reset`,
    {
      new_password: newPassword,
    }
  );
  return response.data;
};

// Change resident password (sets to active - staff sets new password)
export const changeResidentPassword = async (
  residentId: string,
  newPassword: string
) => {
  const response = await request.post(
    `/api/residents/password-management/${residentId}/change`,
    {
      new_password: newPassword,
    }
  );
  return response.data;
};
