import request from "@/utils/request";
import {
  SigninFormData,
  SignupFormData,
  ResidentSigninFormData,
} from "@/utils/zod";

export interface CheckUserByEmailResponse {
  user_id: string;
  email: string;
  role: string;
  status: string;
  familyProfile: {
    full_name: string;
    phone?: string;
  } | null;
}

export const login = async (data: SigninFormData) => {
  const response = await request.post("/auth/login", data);
  return response.data;
};

export const residentLogin = async (data: ResidentSigninFormData) => {
  const response = await request.post("/auth/resident/login", data);
  return response.data;
};

export const register = async (data: SignupFormData) => {
  const response = await request.post("/auth/register", data);
  return response.data;
};

export const verifyEmailToken = async (token: string) => {
  const response = await request.post("/auth/verify-email", {
    email_verify_token: token,
  });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await request.post("/auth/forgot-password", {
    email,
  });
  return response.data;
};

export const verifyForgotPassword = async (token: string) => {
  const response = await request.post("/auth/verify-forgot-password", {
    forgot_password_token: token,
  });
  return response.data;
};

export const resetPassword = async (data: {
  password: string;
  confirm_password: string;
  forgot_password_token: string;
}) => {
  const response = await request.post("/auth/reset-password", data);
  return response.data;
};

export const resendEmailVerify = async (email: string) => {
  const response = await request.post("/auth/resend-email-verify", {
    email,
  });
  return response.data;
};

export const checkUserByEmail = async (email: string) => {
  const response = await request.get("/auth/check-user-by-email", {
    params: { email },
  });
  return response.data;
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await request.post("/auth/change-password", data);
  return response.data;
};

export const validateFamilyLinkToken = async (token: string) => {
  const response = await request.get("/auth/family-link/validate", {
    params: { family_link_token: token },
  });
  return response.data;
};

export const confirmFamilyLink = async (token: string) => {
  const response = await request.post("/auth/family-link/confirm", {
    family_link_token: token,
  });
  return response.data;
};

export const resendFamilyLink = async () => {
  const response = await request.post("/auth/family-link/resend");
  return response.data;
};
