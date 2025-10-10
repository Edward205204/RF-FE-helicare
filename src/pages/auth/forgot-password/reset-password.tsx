import { useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Input, Button, Label } from "@/components/ui/index";
import { toast } from "react-toastify";
import { HTTP_STATUS } from "@/constants/http-status";
import path from "@/constants/path";
import { resetPassword } from "@/apis/auth.api";
import { AppContext } from "@/contexts/app.context";
import { ResetPasswordFormData, resetPasswordSchema } from "@/utils/zod";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { setEmailToVerify } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid token");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({
        ...data,
        forgot_password_token: token,
      });
      toast.success(result.message || "Password reset successfully");
      setEmailToVerify(null);
      navigate(path.signin);
    } catch (error: any) {
      if (error.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        const formErrors = error.response.data?.errors;
        if (formErrors) {
          Object.keys(formErrors).forEach((key) => {
            setError(key as keyof ResetPasswordFormData, {
              type: "server",
              message: formErrors[key]?.msg?.message || "",
            });
          });
        }
      } else {
        toast.error(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-white">
        <div className="w-full max-w-md flex flex-col items-center px-4">
          <h1 className="text-3xl font-bold text-[#5985d8] mb-4 text-center">
            HeLiCare
          </h1>
          <div className="text-center">
            <p className="text-red-600 mb-4">Invalid or missing token</p>
            <Button
              onClick={() => navigate(path.forgotPasswordEmail)}
              className="bg-[#5985d8] text-white"
            >
              Back to forgot password
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-white">
      <form
        className="w-full max-w-md flex flex-col items-center px-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-3xl font-bold text-[#5985d8] mb-4 text-center">
          HeLiCare
        </h1>
        <div className="text-center text-base text-gray-700 mb-8">
          Enter your new password to complete the reset process.
        </div>

        <div className="w-full mb-4">
          <div className="flex items-center mb-2">
            <Label
              htmlFor="password"
              className="block flex-1 text-sm font-normal text-left text-gray-700"
            >
              New Password
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#5985d8] p-0 rounded focus:outline-none ml-2 h-auto w-auto"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
              errors.password ? "border-red-500" : "border-gray-400"
            }`}
            placeholder="New password"
            id="password"
            {...register("password")}
            autoComplete="new-password"
          />
          <div className="h-4">
            {errors.password && (
              <div className="text-sm text-red-500 text-left">
                {errors.password.message}
              </div>
            )}
          </div>
        </div>

        <div className="w-full mb-4">
          <div className="flex items-center mb-2">
            <Label
              htmlFor="confirm_password"
              className="block flex-1 text-sm font-normal text-left text-gray-700"
            >
              Confirm New Password
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#5985d8] p-0 rounded focus:outline-none ml-2 h-auto w-auto"
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <Input
            type={showConfirmPassword ? "text" : "password"}
            className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
              errors.confirm_password ? "border-red-500" : "border-gray-400"
            }`}
            placeholder="Confirm new password"
            id="confirm_password"
            {...register("confirm_password")}
            autoComplete="new-password"
          />
          <div className="h-4">
            {errors.confirm_password && (
              <div className="text-sm text-red-500 text-left">
                {errors.confirm_password.message}
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Resetting..." : "Reset password"}
        </Button>

        <Button
          type="button"
          onClick={() => navigate(path.signin)}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
        >
          Back to sign in
        </Button>
      </form>
    </div>
  );
}
