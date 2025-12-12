import request from "@/utils/request";

// Payment Method và Status types
export type PaymentMethod = "CASH" | "VNPAY";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

// Create Payment DTO
export interface CreatePaymentReqBody {
  contract_id: string;
  payment_method: PaymentMethod;
  amount: number;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  notes?: string;
}

// Upload Proof Image DTO
export interface UploadProofReqBody {
  proof_image_url: string;
  transaction_ref?: string;
  notes?: string;
}

// Payment Response DTO
export interface PaymentResponse {
  payment_id: string;
  contract_id: string;
  payer_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  proof_image_url: string | null;
  vnpay_transaction_no: string | null;
  vnpay_order_id: string | null;
  vnpay_response_code: string | null;
  vnpay_bank_code: string | null;
  notes: string | null;
  verified_by_id: string | null;
  verified_at: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
  // Relations
  contract?: {
    contract_id: string;
    resident_id: string;
    amount: number;
    billing_cycle: string;
    next_billing_date: string;
    resident?: {
      resident_id: string;
      full_name: string;
    };
  };
  payer?: {
    user_id: string;
    email: string;
    familyProfile?: {
      full_name: string;
    };
  };
  verified_by?: {
    user_id: string;
    email: string;
    staffProfile?: {
      full_name: string;
    };
  };
}

// Get Payments Query
export interface GetPaymentsQuery {
  contract_id?: string;
  payer_id?: string;
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  page?: number;
  limit?: number;
}

// Payment List Response
export interface PaymentListResponse {
  payments: PaymentResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// VNPay Create Payment DTO
export interface CreateVNPayPaymentReqBody {
  contract_id: string;
  period_start: string;
  period_end: string;
}

// VNPay Payment URL Response
export interface VNPayPaymentUrlResponse {
  payment_url: string;
  payment_id: string;
  order_id: string;
}

// Tạo payment (Family)
export const createPayment = async (
  data: CreatePaymentReqBody
): Promise<{ message: string; data: PaymentResponse }> => {
  const response = await request.post("/api/payments", data);
  return response.data;
};

// Lấy danh sách payments (Admin/Staff)
export const getPayments = async (
  params?: GetPaymentsQuery
): Promise<{
  message: string;
  payments: PaymentResponse[];
  pagination?: PaymentListResponse["pagination"];
}> => {
  const response = await request.get("/api/payments", {
    params,
  });
  return response.data;
};

// Lấy payments của Family user
export const getPaymentsByFamily = async (): Promise<{
  message: string;
  data: PaymentResponse[];
}> => {
  const response = await request.get("/api/payments/family");
  return response.data;
};

// Lấy payment theo ID
export const getPaymentById = async (
  paymentId: string
): Promise<{ message: string; data: PaymentResponse }> => {
  const response = await request.get(`/api/payments/${paymentId}`);
  return response.data;
};

// Upload proof image (Family)
export const uploadProof = async (
  paymentId: string,
  data: UploadProofReqBody
): Promise<{ message: string; data: PaymentResponse }> => {
  const response = await request.post(
    `/api/payments/${paymentId}/upload-proof`,
    data
  );
  return response.data;
};

// Admin verify payment (Admin/Staff)
export const verifyPayment = async (
  paymentId: string
): Promise<{ message: string; data: PaymentResponse }> => {
  const response = await request.post(`/api/payments/${paymentId}/verify`);
  return response.data;
};

// Cancel payment (Family)
export const cancelPayment = async (
  paymentId: string
): Promise<{ message: string }> => {
  const response = await request.post(`/api/payments/${paymentId}/cancel`);
  return response.data;
};

// ========== VNPAY ENDPOINTS ==========

// Tạo VNPay payment URL
export const createVNPayPayment = async (
  data: CreateVNPayPaymentReqBody
): Promise<{ message: string; data: VNPayPaymentUrlResponse }> => {
  const response = await request.post("/api/payments/vnpay/create", data);
  return response.data;
};
