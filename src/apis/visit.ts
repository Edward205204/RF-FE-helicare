import request from "@/utils/request";

export interface CreateVisitData {
  resident_id: string;
  visit_date: string;
  visit_time: string;
  duration?: number;
  purpose?: string;
  notes?: string;
}

export interface VisitResponse {
  visit_id: string;
  family_user_id: string;
  resident_id: string;
  institution_id: string;
  visit_date: string;
  visit_time: string;
  duration: number;
  purpose?: string;
  notes?: string;
  status: string;
  qr_code_data: string;
  qr_expires_at: string;
  time_slot: {
    name: string;
    start_time: string;
    end_time: string;
  };
  resident?: {
    full_name: string;
    room?: {
      room_number: string;
    };
  };
  institution?: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AvailabilityResponse {
  date: string;
  total_visitors: number;
  max_visitors_per_day: number;
  is_day_available: boolean;
  time_slots: {
    slot_id: string;
    name: string;
    start_time: string;
    end_time: string;
    current_visitors: number;
    max_visitors: number;
    is_available: boolean;
  }[];
}

export interface VisitListResponse {
  visits: VisitResponse[];
  total: number;
}

export const visitApi = {
  createVisit: async (data: CreateVisitData) => {
    const response = await request.post("/api/visits/visits", data);
    return response.data;
  },

  checkAvailability: async (residentId: string, date: string) => {
    const response = await request.get(
      `/api/visits/visits/availability?resident_id=${residentId}&date=${date}`
    );
    return response.data;
  },

  getFamilyVisits: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await request.get(
      `/api/visits/visits?${queryParams.toString()}`
    );
    return response.data;
  },

  getVisitById: async (visitId: string) => {
    const response = await request.get(`/api/visits/visits/${visitId}`);
    return response.data;
  },

  updateVisit: async (visitId: string, data: Partial<CreateVisitData>) => {
    const response = await request.patch(`/api/visits/visits/${visitId}`, data);
    return response.data;
  },

  cancelVisit: async (visitId: string, reason?: string) => {
    const response = await request.post("/api/visits/visits/cancel", {
      visit_id: visitId,
      reason,
    });
    return response.data;
  },

  checkIn: async (qrCodeData: string) => {
    const response = await request.post("/api/visits/visits/check-in", {
      qr_code_data: qrCodeData,
    });
    return response.data;
  },

  checkOut: async (visitId: string) => {
    const response = await request.post("/api/visits/visits/check-out", {
      visit_id: visitId,
    });
    return response.data;
  },
};
