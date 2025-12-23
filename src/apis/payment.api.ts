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
    institution?: {
      institution_id: string;
      name: string;
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
export const getPaymentsByFamily = async (
  params?: GetPaymentsQuery
): Promise<{
  message: string;
  data: PaymentResponse[];
}> => {
  const response = await request.get("/api/payments/family", {
    params,
  });
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

// Tạo VNPay payment URL (hoặc mock payment nếu mock=true)
export const createVNPayPayment = async (
  data: CreateVNPayPaymentReqBody,
  mock: boolean = true // Mặc định dùng mock mode
): Promise<{
  message: string;
  data:
    | VNPayPaymentUrlResponse
    | {
        payment_id: string;
        status: string;
        vnpay_order_id: string;
        vnpay_transaction_no: string;
      };
}> => {
  // Gửi mock param trong URL query string - ĐẢM BẢO có dấu ? và = đúng
  const mockParam = mock ? "true" : "false";
  const url = `/api/payments/vnpay/create?mock=${mockParam}`;
  console.log("🚀 Calling VNPay API with URL:", url, "mock param:", mockParam);
  const response = await request.post(url, data);
  console.log("📦 VNPay API Response:", response);
  return response.data;
};

// ========== DBM ACCOUNT ENDPOINTS (Mock Bank Account) ==========

export interface PaymentStatisticsResponse {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  successfulAmount: number;
  paymentByMethod: Array<{
    payment_method: string;
    _count: { payment_method: number };
    _sum: { amount: number | null };
  }>;
  paymentByStatus: Array<{
    status: string;
    _count: { status: number };
    _sum: { amount: number | null };
  }>;
}

export interface RevenueAnalyticsResponse {
  series: Array<{
    date: string;
    value: number;
  }>;
}

export interface RevenueByMethodResponse {
  method: string;
  totalAmount: number;
  count: number;
}

// Lấy thống kê thanh toán cho viện
export const getPaymentStatistics = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ message: string; data: PaymentStatisticsResponse }> => {
  const response = await request.get("/api/payments/dbm/statistics", {
    params,
  });
  return response.data;
};

// Lấy revenue analytics theo thời gian
export const getRevenueAnalytics = async (params?: {
  start_date?: string;
  end_date?: string;
  granularity?: "day" | "week" | "month";
}): Promise<{ message: string; data: RevenueAnalyticsResponse }> => {
  const response = await request.get("/api/payments/dbm/revenue/analytics", {
    params,
  });
  return response.data;
};

// Lấy revenue theo phương thức thanh toán
export const getRevenueByPaymentMethod = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ message: string; data: RevenueByMethodResponse[] }> => {
  const response = await request.get("/api/payments/dbm/revenue/by-method", {
    params,
  });
  return response.data;
};
