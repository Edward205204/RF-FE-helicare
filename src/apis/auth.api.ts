import request from "@/utils/request";
import { SigninFormData, SignupFormData } from "@/utils/zod";

export const login = async (data: SigninFormData) => {
  const response = await request.post("/auth/login", data);
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
