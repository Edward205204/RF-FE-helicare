import { UserRole } from "@/constants/user-role";
import { z } from "zod";

export const signinSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Email is invalid")
    .trim(),
  password: z.string().nonempty("Password is required").trim(),
});

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "Full Name is required")
      .min(2, "Full Name must be at least 2 characters")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Email is invalid")
      .trim(),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least 1 symbol"),
    confirm_password: z.string().min(1, "Confirm password is required"),
    role: z.optional(z.nativeEnum(UserRole)),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be the same as password",
    path: ["confirm_password"],
  });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least 1 symbol"),
    confirm_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be the same as password",
    path: ["confirm_password"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email is invalid")
    .trim(),
});

export type ForgotPasswordEmailFormData = z.infer<
  typeof forgotPasswordEmailSchema
>;

export type SignupFormData = z.infer<typeof signupSchema>;
export type SigninFormData = z.infer<typeof signinSchema>;
