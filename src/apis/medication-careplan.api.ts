import request from "@/utils/request";

export interface Medication {
  medication_id: string;
  institution_id: string;
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  timing: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignments_count?: number;
}

export interface CreateMedicationData {
  name: string;
  dosage: string;
  form:
    | "tablet"
    | "syrup"
    | "injection"
    | "capsule"
    | "liquid"
    | "cream"
    | "other";
  frequency: string;
  timing: "before_meal" | "after_meal" | "with_meal" | "any_time";
  instructions?: string;
}

export interface UpdateMedicationData {
  name?: string;
  dosage?: string;
  form?:
    | "tablet"
    | "syrup"
    | "injection"
    | "capsule"
    | "liquid"
    | "cream"
    | "other";
  frequency?: string;
  timing?: "before_meal" | "after_meal" | "with_meal" | "any_time";
  instructions?: string;
  is_active?: boolean;
}

export interface MedicationCarePlanAssignment {
  assignment_id: string;
  medication_id: string;
  institution_id: string;
  resident_ids: string[];
  room_ids: string[];
  staff_ids: string[];
  start_date: string;
  end_date?: string;
  time_slot?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  medication?: {
    medication_id: string;
    name: string;
    dosage: string;
    form: string;
    frequency: string;
    timing: string;
  };
  residents?: Array<{
    resident_id: string;
    full_name: string;
    allergies?: Array<{
      id: string;
      substance: string;
      severity?: string;
    }>;
    dietTags?: Array<{
      tag_id: string;
      tag_type: string;
      tag_name: string;
    }>;
  }>;
  rooms?: Array<{
    room_id: string;
    room_number: string;
    type: string;
    capacity: number;
  }>;
  staff?: Array<{
    user_id: string;
    email: string;
    staffProfile?: {
      full_name: string;
      position: string;
    };
  }>;
}

export interface CreateMedicationCarePlanData {
  medication_id: string;
  resident_ids?: string[];
  room_ids?: string[];
  staff_ids?: string[];
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  time_slot?: "morning" | "noon" | "afternoon" | "evening";
  notes?: string;
}

export interface UpdateMedicationCarePlanData {
  resident_ids?: string[];
  room_ids?: string[];
  staff_ids?: string[];
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface Alert {
  type: "allergy" | "diet" | "schedule";
  severity: "low" | "medium" | "high";
  message: string;
  resident_id?: string;
  resident_name?: string;
  medication_id: string;
  medication_name: string;
  suggestion?: string;
}

export interface MedicationCarePlanSummary {
  total_medications: number;
  total_assignments: number;
  total_conflicts: number;
  active_assignments: number;
  medications: Array<{
    medication_id: string;
    name: string;
    dosage: string;
    frequency: string;
    assignments_count: number;
    conflicts_count: number;
  }>;
}

// ========== MEDICATION APIs ==========

export const getMedications = async (params?: {
  take?: number;
  skip?: number;
  search?: string;
  is_active?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.take) queryParams.append("take", params.take.toString());
  if (params?.skip) queryParams.append("skip", params.skip.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined)
    queryParams.append("is_active", params.is_active.toString());

  const response = await request.get(
    `/api/medication-careplan/medications?${queryParams.toString()}`
  );
  return response.data;
};

export const getMedicationById = async (medication_id: string) => {
  const response = await request.get(
    `/api/medication-careplan/medications/${medication_id}`
  );
  return response.data;
};

export const createMedication = async (data: CreateMedicationData) => {
  const response = await request.post(
    "/api/medication-careplan/medications",
    data
  );
  return response.data;
};

export const updateMedication = async (
  medication_id: string,
  data: UpdateMedicationData
) => {
  const response = await request.put(
    `/api/medication-careplan/medications/${medication_id}`,
    data
  );
  return response.data;
};

export const deleteMedication = async (medication_id: string) => {
  const response = await request.delete(
    `/api/medication-careplan/medications/${medication_id}`
  );
  return response.data;
};

// ========== CARE PLAN APIs ==========

export const getCarePlans = async (params?: {
  take?: number;
  skip?: number;
  medication_id?: string;
  resident_id?: string;
  room_id?: string;
  staff_id?: string;
  is_active?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.take) queryParams.append("take", params.take.toString());
  if (params?.skip) queryParams.append("skip", params.skip.toString());
  if (params?.medication_id)
    queryParams.append("medication_id", params.medication_id);
  if (params?.resident_id)
    queryParams.append("resident_id", params.resident_id);
  if (params?.room_id) queryParams.append("room_id", params.room_id);
  if (params?.staff_id) queryParams.append("staff_id", params.staff_id);
  if (params?.is_active !== undefined)
    queryParams.append("is_active", params.is_active.toString());

  const response = await request.get(
    `/api/medication-careplan/care-plans?${queryParams.toString()}`
  );
  return response.data;
};

export const createMedicationCarePlan = async (
  data: CreateMedicationCarePlanData
) => {
  const response = await request.post(
    "/api/medication-careplan/care-plans",
    data
  );
  return response.data;
};

export const updateMedicationCarePlan = async (
  assignment_id: string,
  data: UpdateMedicationCarePlanData
) => {
  const response = await request.put(
    `/api/medication-careplan/care-plans/${assignment_id}`,
    data
  );
  return response.data;
};

export const deleteMedicationCarePlan = async (assignment_id: string) => {
  const response = await request.delete(
    `/api/medication-careplan/care-plans/${assignment_id}`
  );
  return response.data;
};

// ========== ALERTS & SUMMARY APIs ==========

export const getAlerts = async (params: {
  medication_id: string;
  resident_ids?: string[];
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("medication_id", params.medication_id);
  if (params.resident_ids && params.resident_ids.length > 0) {
    params.resident_ids.forEach((id) => {
      queryParams.append("resident_ids", id);
    });
  }

  const response = await request.get(
    `/api/medication-careplan/alerts?${queryParams.toString()}`
  );
  return response.data;
};

export const getSummary = async () => {
  const response = await request.get("/api/medication-careplan/summary");
  return response.data;
};

export interface AssignedMedicationResponse {
  assignment_id: string;
  medication: {
    medication_id: string;
    name: string;
    dosage: string;
    form: string;
    frequency: string;
    timing: string;
  };
  residents: Array<{
    resident_id: string;
    full_name: string;
    room?: {
      room_id: string;
      room_number: string;
    };
    allergies?: Array<{
      id: string;
      substance: string;
      severity?: string;
    }>;
    dietTags?: Array<{
      tag_id: string;
      tag_type: string;
      tag_name: string;
    }>;
  }>;
  rooms: Array<{
    room_id: string;
    room_number: string;
    type: string;
    capacity: number;
  }>;
  start_date: string;
  end_date?: string;
  time_slot?: string;
  is_active: boolean;
  notes?: string;
  conflicts?: Alert[];
}

export const getAssignedMedications = async (params?: {
  take?: number;
  skip?: number;
  medication_id?: string;
  resident_id?: string;
  room_id?: string;
  time_slot?: string;
  is_active?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.take) queryParams.append("take", params.take.toString());
  if (params?.skip) queryParams.append("skip", params.skip.toString());
  if (params?.medication_id)
    queryParams.append("medication_id", params.medication_id);
  if (params?.resident_id)
    queryParams.append("resident_id", params.resident_id);
  if (params?.room_id) queryParams.append("room_id", params.room_id);
  if (params?.time_slot) queryParams.append("time_slot", params.time_slot);
  if (params?.is_active !== undefined)
    queryParams.append("is_active", params.is_active.toString());

  const response = await request.get(
    `/api/medication-careplan/assigned-medications?${queryParams.toString()}`
  );
  return response.data;
};
