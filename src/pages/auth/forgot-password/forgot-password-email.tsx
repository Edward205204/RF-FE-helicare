import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button, Label } from "@/components/ui/index";

import { toast } from "react-toastify";
import { HTTP_STATUS } from "@/constants/http-status";
import path from "@/constants/path";
import { forgotPassword } from "@/apis/auth.api";
import { AppContext } from "@/contexts/app.context";
import {
  ForgotPasswordEmailFormData,
  forgotPasswordEmailSchema,
} from "@/utils/zod";

const ForgotPasswordEmail = () => {
  const navigate = useNavigate();
  const { setEmailToVerify } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordEmailFormData) => {
    setIsLoading(true);
    try {
      const result = await forgotPassword(data.email);
      toast.success(result.message || "Đã gửi liên kết xác minh thành công");
      setEmailToVerify(data.email);
      navigate(path.waitToVerifyForgotPassword);
    } catch (error: any) {
      if (error.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        const formErrors = error.response.data?.errors;
        if (formErrors) {
          Object.keys(formErrors).forEach((key) => {
            setError(key as keyof ForgotPasswordEmailFormData, {
              type: "server",
              message: formErrors[key]?.msg?.message || "",
            });
          });
        }
      } else {
        toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          Nhập địa chỉ email bạn đã đăng ký để
          <br />
          nhận liên kết xác minh để đặt lại mật khẩu.
        </div>

        <div className="w-full mb-4">
          <Label
            htmlFor="email"
            className="block text-sm font-normal text-left text-gray-700 mb-2"
          >
            Địa chỉ Email
          </Label>
          <Input
            type="email"
            className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
              errors.email ? "border-red-500" : "border-gray-400"
            }`}
            placeholder="example@gmail.com"
            id="email"
            {...register("email")}
            autoComplete="email"
          />
          <div className="h-4">
            {errors.email && (
              <div className="text-sm text-red-500 text-left">
                {errors.email.message}
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang gửi..." : "Gửi liên kết xác minh"}
        </Button>

        <Button
          type="button"
          onClick={() => navigate(path.signin)}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
        >
          Quay lại Đăng nhập
        </Button>
      </form>
    </div>
  );
};

export default ForgotPasswordEmail;
