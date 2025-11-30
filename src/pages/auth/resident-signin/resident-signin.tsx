import { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bgImage from "@/assets/signin_background.jpg";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, Button } from "@/components/ui/index";
import { residentSigninSchema, ResidentSigninFormData } from "@/utils/zod";
import path from "@/constants/path";
import { residentLogin } from "@/apis/auth.api";
import { toast } from "react-toastify";
import { AppContext } from "@/contexts/app.context";
import { HTTP_STATUS } from "@/constants/http-status";
import { UserRole } from "@/constants/user-role";

const ResidentSignin = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setProfile } = useContext(AppContext);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResidentSigninFormData>({
    resolver: zodResolver(residentSigninSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: ResidentSigninFormData) => {
    setIsLoading(true);

    residentLogin(data)
      .then((res) => {
        console.log("Resident login success, full response:", res);
        toast.success(res.message);
        const userData = res.data.user;
        console.log("User data:", userData);

        // SET STATE cho AppContext
        setProfile(userData);
        setIsAuthenticated(true);
        console.log("Set context state done");

        // Redirect to resident home
        const userRole = (userData as any).role;
        if (userRole === UserRole.Resident) {
          navigate(path.residentHome, { replace: true });
        } else {
          toast.error(
            "Invalid account type. Please use the correct login page."
          );
          navigate(path.signin, { replace: true });
        }
      })
      .catch((err) => {
        console.error("Resident login error:", err);

        if (err.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          const formErrors = err.response.data?.errors;
          console.log(formErrors);
          if (formErrors) {
            Object.keys(formErrors).forEach((key) => {
              setError(key as keyof ResidentSigninFormData, {
                type: "server",
                message: formErrors[key]?.msg?.message || "",
              });
            });
          }
        } else {
          toast.error(err.response?.data?.message || "Đăng nhập thất bại");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="grid overflow-hidden fixed inset-0 grid-cols-2">
      <div className="overflow-hidden relative w-full h-full">
        <img
          src={bgImage}
          alt="HeLiCare"
          className="w-full h-full object-cover object-[20%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t to-transparent from-black/60">
          <div className="absolute bottom-0 left-0 z-10 p-8 w-full text-left">
            <h1 className="mb-4 text-3xl font-bold text-white">HeLiCare</h1>
            <p className="max-w-xl text-lg leading-relaxed text-white">
              Đăng nhập để xem thông tin sức khỏe, lịch trình và các hoạt động
              của bạn tại viện dưỡng lão.
            </p>
          </div>
        </div>
      </div>

      <div className="flex overflow-hidden justify-center items-center p-8 w-full h-full bg-white">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 w-full max-w-md bg-white rounded-lg shadow-lg"
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-gray-800">
            Đăng nhập Cư dân
          </h2>

          <div className="mb-4">
            <Label
              htmlFor="username"
              className="block mb-2 font-medium text-left text-gray-700"
            >
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Nhập username của bạn"
              autoComplete="username"
              {...register("username")}
              className={
                errors.username
                  ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
                  : "border-blue-600 focus:border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
              }
            />
            <p className="mt-2 text-sm text-left text-red-500 min-h-5">
              {errors.username?.message || ""}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="password"
                className="font-medium text-left text-gray-700"
              >
                Mật khẩu
              </Label>
              <Button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1 text-blue-600 bg-transparent border-none shadow-none cursor-pointer focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              {...register("password")}
              className={
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
                  : "border-blue-600 focus:border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
              }
            />
            <p className="mt-2 text-sm text-left text-red-500 min-h-5">
              {errors.password?.message || ""}
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <Button
              type="button"
              onClick={() => navigate(path.forgotPasswordEmail)}
              className="text-sm text-blue-600 shadow-none cursor-pointer hover:underline focus:outline-none"
            >
              Quên mật khẩu?
            </Button>
          </div>

          <button
            type="submit"
            className="py-3 mb-4 w-full font-semibold text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="text-sm text-center text-gray-500">
            Bạn không phải cư dân?{" "}
            <button
              type="button"
              onClick={() => navigate(path.signin)}
              className="font-medium text-blue-600 cursor-pointer hover:underline focus:outline-none"
            >
              Đăng nhập với tư cách khác
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentSignin;
