import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/index";
import { AppContext } from "@/contexts/app.context";
import { forgotPassword } from "@/apis/auth.api";
import { toast } from "react-toastify";
import path from "@/constants/path";

export default function WaitToVerifyForgotPassword() {
  const { emailToVerify, setEmailToVerify } = useContext(AppContext);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    if (emailToVerify) {
      await forgotPassword(emailToVerify);
      toast.success("Verification link sent successfully!");
    }
  };

  const handleGoBack = () => {
    navigate(path.forgotPasswordEmail);
  };

  const handleGoToSignin = () => {
    setEmailToVerify(null);
    navigate(path.signin);
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-white">
      <div className="w-full max-w-md flex flex-col items-center px-4">
        <h1 className="text-3xl font-bold text-[#5985d8] mb-4 text-center">
          HeLiCare
        </h1>

        <div className="mb-6 p-4 bg-blue-50 rounded-full">
          <Mail className="w-12 h-12 text-[#5985d8]" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center text-[#5985d8]">
            Check your email
          </h2>
          <p className="text-base text-gray-700 mb-2">
            We have sent a password reset link to your email address.
          </p>
          <p className="text-sm text-gray-500">
            Please check your inbox and click the link to reset your password.
          </p>
        </div>

        <div className="w-full mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Next steps:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your email inbox</li>
            <li>• Look for an email from HeLiCare</li>
            <li>• Click the verification link in the email</li>
            <li>• Follow the instructions to reset your password</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full border-[#5985d8] text-[#5985d8] rounded-md py-3 font-semibold text-base hover:bg-[#5985d8] hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend verification link
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to forgot password
          </Button>

          <Button
            onClick={handleGoToSignin}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 rounded-md py-3 font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
