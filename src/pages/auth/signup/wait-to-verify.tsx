import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import bgImage from "../../../assets/signup_background.jpg";
import path from "@/constants/path";
import { Button } from "@/components/ui/index";
import { AppContext } from "@/contexts/app.context";
import { resendEmailVerify } from "@/apis/auth.api";
import { toast } from "react-toastify";

export default function WaitToVerify() {
  const { emailToVerify } = useContext(AppContext);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    await resendEmailVerify(emailToVerify as string);
    toast.success("Đã gửi email xác minh thành công!");
  };

  const handleGoBack = () => {
    navigate(path.signup);
  };

  const handleGoToSignin = () => {
    navigate(path.signin);
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
            className="underline hover:text-[#5985d8] transition-colors"
            onClick={handleGoToSignin}
          >
            Đăng nhập
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md mx-auto p-10 flex flex-col items-center justify-center">
          <div className="mb-6 p-4 bg-[#5985d8]/10 rounded-full">
            <Mail className="w-12 h-12 text-[#5985d8]" />
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-center text-[#5985d8]">
            Kiểm tra email của bạn
          </h2>

          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              Chúng tôi đã gửi liên kết xác minh đến địa chỉ email của bạn.
            </p>
            <p className="text-sm text-gray-500">
              Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết để kích hoạt tài khoản của bạn.
            </p>
          </div>

          <div className="w-full mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Hướng dẫn:
            </h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 mr-2 text-xs bg-[#5985d8] text-white rounded-full flex items-center justify-center">
                  1
                </span>
                Mở ứng dụng Gmail hoặc email client của bạn
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 mr-2 text-xs bg-[#5985d8] text-white rounded-full flex items-center justify-center">
                  2
                </span>
                Tìm email từ HeLiCare (kiểm tra thư mục Spam)
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 mr-2 text-xs bg-[#5985d8] text-white rounded-full flex items-center justify-center">
                  3
                </span>
                Nhấp vào liên kết "Xác minh Tài khoản" trong email
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <Button
              onClick={handleResendEmail}
              className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Gửi lại email xác minh
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Đăng ký
            </Button>
          </div>

          <div className="mt-8 text-xs text-center text-gray-500">
            <p>
              Không nhận được email? Kiểm tra thư mục Spam hoặc{" "}
              <button
                type="button"
                className="underline hover:text-[#5985d8] transition-colors"
                onClick={handleResendEmail}
              >
                gửi lại
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
