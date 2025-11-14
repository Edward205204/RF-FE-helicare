import request from "@/utils/request";

export interface CreateAssessmentData {
  resident_id: string;
  cognitive_status?: "NORMAL" | "IMPAIRED" | "SEVERE";
  mobility_status?: "INDEPENDENT" | "ASSISTED" | "DEPENDENT";
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  temperature_c?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  notes?: string;
}

export interface AssessmentResponse {
  assessment_id: string;
  resident_id: string;
  assessed_by_id: string;
  cognitive_status: string;
  mobility_status: string;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  temperature_c?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  notes?: string;
  created_at: string;
}

// Lấy danh sách tất cả assessments
export const getAssessments = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await request.get("/api/assessments/get-assessments", {
    params,
  });
  return response.data;
};

// Lấy assessment theo ID
export const getAssessmentById = async (assessmentId: string) => {
  const response = await request.get(
    `/api/assessments/get-assessment-by-id/${assessmentId}`
  );
  return response.data;
};

// Lấy assessments theo resident ID
export const getAssessmentsByResident = async (
  residentId: string,
  params?: {
    take?: number;
    skip?: number;
  }
) => {
  const response = await request.get(
    `/api/assessments/get-assessments-by-resident/${residentId}`,
    { params }
  );
  return response.data;
};

// Lấy lịch sử assessments
export const getAssessmentsHistory = async (params?: {
  take?: number;
  skip?: number;
}) => {
  const response = await request.get(
    "/api/assessments/get-assessments-history",
    { params }
  );
  return response.data;
};

// Lấy assessments với query filters (hỗ trợ filter theo resident_id, dates, etc.)
export const getAssessmentsQuery = async (params?: {
  resident_id?: string;
  assessed_by_id?: string;
  cognitive_status?: "all" | "NORMAL" | "IMPAIRED" | "SEVERE";
  mobility_status?: "all" | "INDEPENDENT" | "ASSISTED" | "DEPENDENT";
  time?: "all" | "lte_today" | "gte_today";
  start_date?: string;
  end_date?: string;
  take?: number;
  skip?: number;
}) => {
  const response = await request.get("/api/assessments/get-assessments-query", {
    params,
  });
  return response.data;
};

// Tạo assessment mới
export const createAssessment = async (
  residentId: string,
  data: Omit<CreateAssessmentData, "resident_id">
) => {
  // Backend expects data wrapped in 'assessment' object
  const response = await request.post(
    `/api/assessments/create-assessment/${residentId}`,
    { assessment: data }
  );
  return response.data;
};

// Cập nhật assessment
export const updateAssessment = async (
  assessmentId: string,
  data: Partial<CreateAssessmentData>
) => {
  // Backend expects data wrapped in 'assessment' object
  const response = await request.put(
    `/api/assessments/update-assessment/${assessmentId}`,
    { assessment: data }
  );
  return response.data;
};

// Xóa assessment
export const deleteAssessment = async (assessmentId: string) => {
  const response = await request.delete(
    `/api/assessments/delete-assessment/${assessmentId}`
  );
  return response.data;
};
