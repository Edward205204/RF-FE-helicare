import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import bgImage from "../../../assets/signup_background.jpg";
import path from "@/constants/path";
import { Button } from "@/components/ui/index";
import { toast } from "react-toastify";
import {
  validateFamilyLinkToken,
  confirmFamilyLink,
  resendFamilyLink,
} from "@/apis/auth.api";

export default function VerifyFamilyLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "validating" | "success" | "error" | "expired"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const handleValidation = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("Token không hợp lệ hoặc đã hết hạn");
        return;
      }

      try {
        // Validate token trước
        await validateFamilyLinkToken(token);
        setVerificationStatus("validating");

        // Nếu token hợp lệ, tự động confirm
        await confirmFamilyLink(token);
        setVerificationStatus("success");
        toast.success("Liên kết với người thân thành công!");
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi xác thực liên kết";

        // Kiểm tra nếu token hết hạn
        if (
          errorMsg.includes("expired") ||
          errorMsg.includes("hết hạn") ||
          errorMsg.includes("Invalid")
        ) {
          setVerificationStatus("expired");
        } else {
          setVerificationStatus("error");
        }
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    handleValidation();
  }, [token]);

  const handleResendLink = async () => {
    setIsResending(true);
    try {
      await resendFamilyLink();
      toast.success("Đã gửi lại email xác thực liên kết!");
      setVerificationStatus("loading");
      setErrorMessage("");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi lại email";
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToSignin = () => {
    navigate(path.signin);
  };

  const handleGoToHome = () => {
    navigate(path.familyHome);
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
      case "validating":
        return (
          <>
            <div className="mb-6 p-4 bg-blue-50 rounded-full">
              <Loader2 className="w-12 h-12 text-[#5985d8] animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-[#5985d8]">
              {verificationStatus === "loading"
                ? "Đang kiểm tra..."
                : "Đang xác thực liên kết..."}
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
              Liên kết thành công!
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Bạn đã xác thực liên kết với người thân thành công.
              </p>
              <p className="text-sm text-gray-500">
                Bây giờ bạn có thể xem và tương tác với thông tin của người
                thân.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleGoToHome}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Đi đến trang chủ
              </Button>
              <Button
                onClick={handleGoToSignin}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Đăng nhập
              </Button>
            </div>
          </>
        );

      case "expired":
        return (
          <>
            <div className="mb-6 p-4 bg-yellow-50 rounded-full">
              <XCircle className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-600">
              Link đã hết hạn
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Link xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác
                thực.
              </p>
              <p className="text-sm text-gray-500">
                Chúng tôi sẽ gửi email mới đến địa chỉ email của bạn.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleResendLink}
                disabled={isResending}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2 inline" />
                    Gửi lại email xác thực
                  </>
                )}
              </Button>
              <Button
                onClick={handleGoToSignin}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Đăng nhập
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
              Xác thực thất bại
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <p className="text-sm text-gray-500">
                Token có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleResendLink}
                disabled={isResending}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2 inline" />
                    Gửi lại email xác thực
                  </>
                )}
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
