import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/index";
import { toast } from "react-toastify";
import { verifyForgotPassword } from "@/apis/auth.api";
import path from "@/constants/path";

export default function VerifyForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("Invalid or expired token");
        return;
      }

      try {
        const result = await verifyForgotPassword(token);
        setVerificationStatus("success");
        toast.success(result.message || "Verification successful!");
      } catch (error: any) {
        setVerificationStatus("error");
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "An error occurred while verifying";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    handleVerification();
  }, [token]);

  const handleGoToResetPassword = () => {
    if (token) {
      navigate(`${path.resetPassword}?token=${encodeURIComponent(token)}`);
    }
  };

  const handleGoToSignin = () => {
    navigate(path.signin);
  };

  const handleGoToForgotPassword = () => {
    navigate(path.forgotPasswordEmail);
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
              Verifying your request...
            </h2>
            <p className="text-center text-gray-600">Please wait a moment</p>
          </>
        );

      case "success":
        return (
          <>
            <div className="mb-6 p-4 bg-green-50 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center text-green-600">
              Verification successful!
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Your request has been verified successfully.
              </p>
              <p className="text-sm text-gray-500">
                You can now reset your password.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleGoToResetPassword}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Reset password
              </Button>
              <Button
                onClick={handleGoToSignin}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Back to sign in
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
              Verification failed
            </h2>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <p className="text-sm text-gray-500">
                The link may have expired or is invalid. Please try again.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleGoToForgotPassword}
                className="w-full bg-[#5985d8] text-white rounded-md py-3 font-semibold text-base hover:bg-[#466bb3] transition-colors"
              >
                Try again
              </Button>
              <Button
                onClick={handleGoToSignin}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Back to sign in
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-white">
      <div className="w-full max-w-md flex flex-col items-center px-4">
        <h1 className="text-3xl font-bold text-[#5985d8] mb-4 text-center">
          HeLiCare
        </h1>
        {renderContent()}
      </div>
    </div>
  );
}
