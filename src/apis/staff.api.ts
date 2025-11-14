import request from "@/utils/request";

export interface StaffResponse {
  user_id: string;
  email: string;
  role: string;
  full_name: string;
  phone: string;
  position: string | null;
  hire_date: string | null;
}

export const getStaffList = async () => {
  const response = await request.get("/api/staff/staff");
  return response.data;
};

export interface CreateStaffPayload {
  avatar?: string | null;
  email: string;
  full_name: string;
  phone: string;
  hire_date: string;
  position: string;
  notes?: string;
  institution_id: string;
}

export interface MessageResponse {
  message: string;
}

export const createStaffForInstitution = async (
  data: CreateStaffPayload
): Promise<MessageResponse> => {
  const response = await request.post(
    "/api/staff/create-staff-for-institution",
    data
  );
  return response.data;
};

export interface UploadStaffAvatarResponse {
  url: string;
  type: string;
}

export const uploadStaffAvatar = async (
  file: File,
  options?: { staffInviteToken?: string }
): Promise<{ message: string; data: UploadStaffAvatarResponse }> => {
  const formData = new FormData();
  formData.append("image", file);
  const endpoint = options?.staffInviteToken
    ? `/api/staff/upload-staff-avatar?staff_invite_token=${encodeURIComponent(
        options.staffInviteToken
      )}`
    : "/api/staff/upload-staff-avatar";
  const response = await request.post(endpoint, formData);
  return response.data;
};

export interface VerifyStaffInvitePayload {
  email: string;
  password: string;
  confirm_password: string;
  staff_invite_token: string;
  avatar?: string | null;
}

export const verifyStaffInviteAndResetPassword = async (
  data: VerifyStaffInvitePayload
): Promise<MessageResponse> => {
  const response = await request.post(
    "/api/staff/verify-staff-invite-and-reset-password",
    data
  );
  return response.data;
};
