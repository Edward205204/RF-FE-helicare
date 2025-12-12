import request from "@/utils/request";

// Billing Cycle type
export type BillingCycle = "MONTHLY" | "YEARLY";

// Create Service Contract DTO
export interface CreateServiceContractReqBody {
  resident_id: string;
  billing_cycle: BillingCycle;
  amount: number;
  start_date?: string; // ISO date string, optional (default: now)
  next_billing_date: string; // ISO date string
}

// Update Service Contract DTO
export interface UpdateServiceContractReqBody {
  billing_cycle?: BillingCycle;
  amount?: number;
  next_billing_date?: string; // ISO date string
  is_active?: boolean;
}

// Service Contract Response DTO
export interface ServiceContractResponse {
  contract_id: string;
  resident_id: string;
  institution_id: string;
  billing_cycle: BillingCycle;
  amount: number;
  start_date: string;
  next_billing_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  resident?: {
    resident_id: string;
    full_name: string;
    room?: {
      room_id: string;
      room_number: string;
    } | null;
  };
  institution?: {
    institution_id: string;
    name: string;
  };
  payments?: Array<{
    payment_id: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }>;
}

// Get Service Contracts Query
export interface GetServiceContractsQuery {
  resident_id?: string;
  institution_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

// Service Contract List Response
export interface ServiceContractListResponse {
  contracts: ServiceContractResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tạo hợp đồng (Admin/Staff)
export const createServiceContract = async (
  data: CreateServiceContractReqBody
): Promise<{ message: string; data: ServiceContractResponse }> => {
  const response = await request.post("/api/service-contracts", data);
  return response.data;
};

// Lấy danh sách hợp đồng (Admin/Staff)
export const getServiceContracts = async (
  params?: GetServiceContractsQuery
): Promise<{
  message: string;
  contracts: ServiceContractResponse[];
  pagination?: ServiceContractListResponse["pagination"];
}> => {
  const response = await request.get("/api/service-contracts", {
    params,
  });
  return response.data;
};

// Lấy hợp đồng theo ID
export const getServiceContractById = async (
  contractId: string
): Promise<{ message: string; data: ServiceContractResponse }> => {
  const response = await request.get(`/api/service-contracts/${contractId}`);
  return response.data;
};

// Lấy hợp đồng của resident
export const getServiceContractByResidentId = async (
  residentId: string
): Promise<{ message: string; data: ServiceContractResponse | null }> => {
  const response = await request.get(
    `/api/service-contracts/resident/${residentId}`
  );
  return response.data;
};

// Lấy hợp đồng của Family user
export const getServiceContractsByFamily = async (): Promise<{
  message: string;
  data: ServiceContractResponse[];
}> => {
  const response = await request.get("/api/service-contracts/family");
  return response.data;
};

// Cập nhật hợp đồng (Admin/Staff)
export const updateServiceContract = async (
  contractId: string,
  data: UpdateServiceContractReqBody
): Promise<{ message: string; data: ServiceContractResponse }> => {
  const response = await request.patch(
    `/api/service-contracts/${contractId}`,
    data
  );
  return response.data;
};

// Xóa/hủy hợp đồng (Admin/Staff)
export const deleteServiceContract = async (
  contractId: string
): Promise<{ message: string }> => {
  const response = await request.delete(`/api/service-contracts/${contractId}`);
  return response.data;
};
