import { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import googleIcon from "@/assets/google-icon.png";
import bgImage from "@/assets/signin_background.jpg";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, Button } from "@/components/ui/index";
import { signinSchema, SigninFormData } from "@/utils/zod";
import path from "@/constants/path";
import { login } from "@/apis/auth.api";
import { toast } from "react-toastify";
import { AppContext } from "@/contexts/app.context";
import { HTTP_STATUS } from "@/constants/http-status";

const Signin = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AppContext);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: SigninFormData) => {
    setIsLoading(true);

    login(data)
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        // setProfile(res.data.data.user);
        navigate(path.home);
      })
      .catch((err) => {
        if (err.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          const formErrors = err.response.data?.errors;
          console.log(formErrors);
          if (formErrors) {
            Object.keys(formErrors).forEach((key) => {
              setError(key as keyof SigninFormData, {
                type: "server",
                message: formErrors[key]?.msg?.message || "",
              });
            });
          }
        } else {
          toast.error(err.response?.data?.message);
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
              Helps you keep track of and stay connected with your loved ones in
              the nursing home anytime, no matter where you are.
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
            Sign in
          </h2>

          <div className="mb-4">
            <Label
              htmlFor="email"
              className="block mb-2 font-medium text-left text-gray-700"
            >
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              {...register("email")}
              className={
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
                  : "border-blue-600 focus:border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
              }
            />
            <p className="mt-2 text-sm text-left text-red-500 min-h-5">
              {errors.email?.message || ""}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="password"
                className="font-medium text-left text-gray-700"
              >
                Your password
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
              placeholder="Password"
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
              Forgot your password?
            </Button>
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="mx-4 text-sm font-medium text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <button
            type="button"
            className="flex gap-3 justify-center items-center px-4 py-3 mb-4 w-full font-medium text-gray-800 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            type="submit"
            className="py-3 mb-4 w-full font-semibold text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Sign in
          </button>

          <div className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate(path.signup)}
              className="font-medium text-blue-600 cursor-pointer hover:underline focus:outline-none"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signin;
