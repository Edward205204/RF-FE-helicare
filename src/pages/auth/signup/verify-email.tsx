import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import bgImage from "../../../assets/signup_background.jpg";
import path from "@/constants/path";
import { Button } from "@/components/ui/index";
import { toast } from "react-toastify";
import { verifyEmailToken } from "@/apis/auth.api";
import { AppContext } from "@/contexts/app.context";
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "already_verified"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const token = searchParams.get("token");
  const { setEmailToVerify } = useContext(AppContext);
  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("Token không hợp lệ hoặc đã hết hạn");
        return;
      }

      try {
        const result = await verifyEmailToken(token);

        if (result.message === "Email is verified before") {
          setVerificationStatus("already_verified");
        } else {
          setVerificationStatus("success");
          toast.success("Xác minh email thành công!");
          setEmailToVerify(null);
        }
      } catch (error: any) {
        setVerificationStatus("error");
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi xác minh email";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    handleVerification();
  }, [token]);

  const handleGoToSignin = () => {
    navigate(path.signin);
  };

  const handleGoToHome = () => {
    navigate(path.familyHome);
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <>
            <div className="mb-6 p-4 bg-blue-50 rounded-full">
              <Loader2 className="w-12 h-12 text-[#5985d8] animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-[#5985d8]">
              Đang xác minh email...
            </h2>
            <p className="text-center text-gray-600">Vui lòng đợi một chút</p>
          </>
        );

      case "success":
        return (
          <>
            <div className="mb-6 p-4 bg-green-50 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-green-600">
              Xác minh thành công!
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Email của bạn đã được xác minh thành công.
              </p>
              <p className="text-sm text-gray-500">
                Bây giờ bạn có thể đăng nhập vào tài khoản của mình.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleGoToSignin}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Đăng nhập ngay
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Về trang chủ
              </Button>
            </div>
          </>
        );

      case "already_verified":
        return (
          <>
            <div className="mb-6 p-4 bg-blue-50 rounded-full">
              <CheckCircle className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-blue-600">
              Email đã được xác minh
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Email này đã được xác minh trước đó.
              </p>
              <p className="text-sm text-gray-500">
                Bạn có thể đăng nhập vào tài khoản của mình.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleGoToSignin}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Đăng nhập
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Về trang chủ
              </Button>
            </div>
          </>
        );

      case "error":
        return (
          <>
            <div className="mb-6 p-4 bg-red-50 rounded-full">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-red-600">
              Xác minh thất bại
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <p className="text-sm text-gray-500">
                Token có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => navigate(path.signup)}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Đăng ký lại
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Về trang chủ
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="fixed inset-0 z-0 w-full h-full bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>
      <div className="flex fixed inset-0 z-10 justify-center items-center">
        {/* Link đăng nhập góc phải */}
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
