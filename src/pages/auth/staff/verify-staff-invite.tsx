import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  uploadStaffAvatar,
  verifyStaffInviteAndResetPassword,
  type VerifyStaffInvitePayload,
} from "@/apis/staff.api";
import { HTTP_STATUS } from "@/constants/http-status";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import path from "@/constants/path";

type ServerErrorPayload = {
  errors?: Record<string, { msg?: { message?: string } | string }>;
  message?: string;
};

type FormValues = VerifyStaffInvitePayload;

const DEFAULT_INPUT_STYLE =
  "border-gray-200 focus-visible:ring-2 focus-visible:ring-[#5985d8] focus-visible:border-[#5985d8]";

const decodeToken = (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }
  const payloadSegment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    payloadSegment + "=".repeat((4 - (payloadSegment.length % 4)) % 4);
  const decoded = atob(padded);
  return JSON.parse(decoded) as { email?: string };
};

const VerifyStaffInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") || "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      staff_invite_token: tokenFromQuery,
      avatar: undefined,
    },
  });

  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirm_password");

  const isSubmitDisabled = !isValid || isSubmitting || !isTokenValid;

  const token = useMemo(() => tokenFromQuery.trim(), [tokenFromQuery]);

  useEffect(() => {
    if (!token) {
      setDecodeError("Token not found in URL.");
      setIsTokenValid(false);
      return;
    }
    try {
      const decoded = decodeToken(token);
      if (!decoded.email) {
        throw new Error("Token does not contain a valid email.");
      }
      setValue("email", decoded.email);
      setValue("staff_invite_token", token);
      setIsTokenValid(true);
      setDecodeError(null);
    } catch (error) {
      setDecodeError((error as Error).message);
      setIsTokenValid(false);
    }
  }, [token, setValue]);

  useEffect(() => {
    if (
      passwordValue &&
      confirmPasswordValue &&
      passwordValue !== confirmPasswordValue
    ) {
      setError("confirm_password", {
        type: "validate",
        message: "Confirm password does not match",
      });
    } else {
      clearErrors("confirm_password");
    }
  }, [passwordValue, confirmPasswordValue, setError, clearErrors]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: VerifyStaffInvitePayload = {
        ...values,
        avatar: values.avatar ?? undefined,
      };
      const response = await verifyStaffInviteAndResetPassword(payload);
      toast.success(response.message || "Account activated successfully");
      reset({
        email: values.email,
        password: "",
        confirm_password: "",
        staff_invite_token: token,
        avatar: values.avatar,
      });
      navigate(path.signin, { replace: true });
    } catch (error) {
      const err = error as AxiosError<ServerErrorPayload>;
      if (err.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        const fieldErrors = err.response.data?.errors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([key, value]) => {
            const message =
              typeof value?.msg === "string"
                ? value.msg
                : value?.msg?.message || "Invalid information";
            setError(key as keyof FormValues, {
              type: "server",
              message,
            });
          });
        }
      } else {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Cannot verify invitation";
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Activate Staff Account
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Set your access password and complete your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decodeError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {decodeError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <input
              type="hidden"
              {...register("staff_invite_token", {
                required: "Token is required",
              })}
            />
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                disabled
                className={`${DEFAULT_INPUT_STYLE} bg-gray-100 text-gray-600`}
                {...register("email")}
              />
              <p className="min-h-[1rem] text-sm text-red-500">
                {errors.email?.message}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-700">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className={DEFAULT_INPUT_STYLE}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <p className="min-h-[1rem] text-sm text-red-500">
                  {errors.password?.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-sm text-gray-700"
                >
                  Confirm password
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Re-enter password"
                  className={DEFAULT_INPUT_STYLE}
                  {...register("confirm_password", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === watch("password") ||
                      "Confirm password does not match",
                  })}
                />
                <p className="min-h-[1rem] text-sm text-red-500">
                  {errors.confirm_password?.message}
                </p>
              </div>
            </div>

            <CardFooter className="px-0">
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full bg-[#5985d8] text-white hover:bg-[#4a74c2]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating...
                  </span>
                ) : (
                  "Complete Activation"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyStaffInvite;
