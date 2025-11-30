import request from "@/utils/request";

export type FeedbackStatus = "pending" | "in_progress" | "resolved";

export interface CategoryResponse {
  category_id: string;
  institution_id: string;
  name: string;
  description: string | null;
  metadata: {
    types?: string[];
    attachmentsRequired?: boolean;
    urgency?: string;
    contactMethod?: string;
    requiredFields?: string[];
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackData {
  resident_id?: string;
  category_id: string;
  type?: string;
  message: string;
  attachments?: string[];
}

export interface FeedbackResponse {
  feedback_id: string;
  family_user_id: string;
  resident_id: string | null;
  institution_id: string;
  category_id: string;
  type: string | null;
  message: string;
  attachments: string[];
  status: FeedbackStatus;
  staff_notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resident?: {
    resident_id: string;
    full_name: string;
    room?: {
      room_id: string;
      room_number: string;
    } | null;
    dietTags?: Array<{
      tag_id: string;
      tag_type: string;
      tag_name: string;
    }>;
  } | null;
  category?: CategoryResponse;
  family_user?: {
    email: string;
    familyProfile?: {
      full_name: string;
    };
  };
  assigned_staff?: {
    user_id: string;
    staffProfile?: {
      full_name: string;
    };
  } | null;
  institution?: {
    name: string;
  };
}

export interface GetFeedbacksQuery {
  category_id?: string;
  type?: string;
  status?: FeedbackStatus;
  resident_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface GetFeedbacksByFamilyQuery {
  status?: FeedbackStatus;
  category_id?: string;
  resident_id?: string;
}

export interface UpdateFeedbackData {
  status?: FeedbackStatus;
  staff_notes?: string;
  assigned_staff_id?: string;
  type?: string;
}

export interface CreateNotificationData {
  feedback_id: string;
  recipient_type: "resident" | "family" | "staff";
  recipient_id?: string;
  message: string;
  title: string;
}

export interface FeedbackStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  duplicateCount: number;
}

// ========== CATEGORY APIs ==========

// Get all categories
export const getCategories = async () => {
  const response = await request.get("/api/feedbacks/categories");
  return response.data;
};

// ========== FEEDBACK APIs ==========

// Create feedback (Family)
export const createFeedback = async (data: CreateFeedbackData) => {
  const response = await request.post("/api/feedbacks/feedback", data);
  return response.data;
};

// Get feedbacks (Staff view)
export const getFeedbacks = async (query?: GetFeedbacksQuery) => {
  const response = await request.get("/api/feedbacks/feedback", {
    params: query,
  });
  return response.data;
};

// Get feedback by ID
export const getFeedbackById = async (feedbackId: string) => {
  const response = await request.get(`/api/feedbacks/feedback/${feedbackId}`);
  return response.data;
};

// Get feedbacks by family (Family view)
export const getFeedbacksByFamily = async (
  query?: GetFeedbacksByFamilyQuery
) => {
  const response = await request.get("/api/feedbacks/feedback/family", {
    params: query,
  });
  return response.data;
};

// Update feedback (Staff)
export const updateFeedback = async (
  feedbackId: string,
  data: UpdateFeedbackData
) => {
  const response = await request.patch(
    `/api/feedbacks/feedback/${feedbackId}`,
    data
  );
  return response.data;
};

// Get feedback statistics (Staff)
export const getFeedbackStats = async () => {
  const response = await request.get("/api/feedbacks/feedback/stats");
  return response.data;
};

// ========== NOTIFICATION APIs ==========

// Send notification
export const sendNotification = async (data: CreateNotificationData) => {
  const response = await request.post("/api/feedbacks/notifications", data);
  return response.data;
};
