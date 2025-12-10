import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerApi } from "@/apis/auth.api";
import bgImage from "../../../assets/signup_background.jpg";
import path from "@/constants/path";
import { Input, Button, Label } from "@/components/ui/index";
import { Eye, EyeOff } from "lucide-react";
import { signupSchema, SignupFormData } from "@/utils/zod";
import { toast } from "react-toastify";
import { HTTP_STATUS } from "@/constants/http-status";
import { UserRole } from "@/constants/user-role";
import { AppContext } from "@/contexts/app.context";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setEmailToVerify } = useContext(AppContext);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const res = await registerApi({ ...data, role: UserRole.Family });
      toast.success(res.message);
      setEmailToVerify(data.email);
      navigate(path.waitToVerify);
    } catch (err: any) {
      if (err.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        console.log(err);
        const formErrors = err.response.data?.errors;
        if (formErrors) {
          Object.keys(formErrors).forEach((key) => {
            setError(key as keyof SignupFormData, {
              type: "server",
              message: formErrors[key]?.msg?.message || "",
            });
          });
        }
      } else {
        toast.error(err.response?.data?.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="fixed inset-0 z-0 w-full h-full bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>
      <div className="flex fixed inset-0 z-10 justify-center items-center">
        <div className="absolute top-6 right-10 text-sm text-gray-700">
          Đã có tài khoản?{" "}
          <button
            type="button"
            className="underline"
            onClick={() => navigate(path.signin)}
          >
            Đăng nhập
          </button>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md mx-auto p-10 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-semibold mb-8 text-center text-[#5985d8]">
            Tạo tài khoản
          </h2>
          <form
            className="flex flex-col gap-4 w-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Label
              htmlFor="full_name"
              className="block text-sm font-normal text-left text-gray-700"
            >
              Họ và tên
            </Label>
            <Input
              type="text"
              className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
                errors.full_name ? "border-red-500" : "border-gray-400"
              }`}
              placeholder="Nguyễn Văn A"
              aria-label="Full Name"
              id="full_name"
              {...register("full_name")}
              autoComplete="name"
            />
            <div className="h-4">
              {errors.full_name && (
                <div className="text-sm text-red-500 text-left">
                  {errors.full_name.message}
                </div>
              )}
            </div>

            <Label
              htmlFor="email"
              className="block text-sm font-normal text-left text-gray-700"
            >
              Địa chỉ Email
            </Label>
            <Input
              type="email"
              className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
                errors.email ? "border-red-500" : "border-gray-400"
              }`}
              placeholder="example@gmail.com"
              aria-label="Email"
              id="email"
              maxLength={320}
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

            <div className="flex items-center">
              <Label
                htmlFor="password"
                className="block flex-1 text-sm font-normal text-left text-gray-700"
              >
                Mật khẩu
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#5985d8] p-0 rounded focus:outline-none ml-2 h-auto w-auto"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              className={`w-full rounded-md border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5985d8] h-auto ${
                errors.password ? "border-red-500" : "border-gray-400"
              }`}
              placeholder="Nhập mật khẩu"
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

            <div className="flex items-center">
              <Label
                htmlFor="confirm_password"
                className="block flex-1 text-sm font-normal text-left text-gray-700"
              >
                Xác nhận Mật khẩu
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#5985d8] p-0 rounded focus:outline-none ml-2 h-auto w-auto"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
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
              placeholder="Xác nhận mật khẩu"
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
            <Button
              asChild
              disabled={isLoading}
              className="w-full bg-[#5985d8] text-white rounded-full  font-semibold text-lg hover:bg-[#466bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-7 "
            >
              <button type="submit" className="inherit">
                {isLoading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </Button>

            <div className="mt-2 text-xs text-center text-gray-500">
              Bằng cách tạo tài khoản, bạn đồng ý với{" "}
              <a href="#" className="underline">
                Điều khoản sử dụng
              </a>{" "}
              và{" "}
              <a href="#" className="underline">
                Chính sách Bảo mật
              </a>
              .
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
