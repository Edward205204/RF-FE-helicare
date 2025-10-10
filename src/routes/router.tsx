import path from "@/constants/path";
import { useRoutes } from "react-router";
import Signin from "@/pages/auth/signin/signin";
import { ProtectedRoute, RejectedRoute } from "./guard";
import Home from "@/pages/home";
import Signup from "@/pages/auth/signup/signup";
import WaitToVerify from "@/pages/auth/signup/wait-to-verify";
import VerifyEmail from "@/pages/auth/signup/verify-email";
import ForgotPasswordEmail from "@/pages/auth/forgot-password/forgot-password-email";
import WaitToVerifyForgotPassword from "@/pages/auth/forgot-password/wait-to-verify-forgot-password";
import VerifyForgotPassword from "@/pages/auth/forgot-password/verify-forgot-password";
import ResetPassword from "@/pages/auth/forgot-password/reset-password";

export default function useReactRouter() {
  const routeElements = useRoutes([
    {
      path: "",
      element: <ProtectedRoute />,
      children: [
        {
          path: path.home,
          element: <Home />,
        },
      ],
    },

    {
      path: "",
      element: <RejectedRoute />,
      children: [
        {
          path: path.signin,
          element: <Signin />,
        },
        {
          path: path.signup,
          element: <Signup />,
        },
        {
          path: path.waitToVerify,
          element: <WaitToVerify />,
        },
        {
          path: path.verifyEmail,
          element: <VerifyEmail />,
        },
        {
          path: path.forgotPasswordEmail,
          element: <ForgotPasswordEmail />,
        },
        {
          path: path.waitToVerifyForgotPassword,
          element: <WaitToVerifyForgotPassword />,
        },
        {
          path: path.verifyForgotPassword,
          element: <VerifyForgotPassword />,
        },
        {
          path: path.resetPassword,
          element: <ResetPassword />,
        },
      ],
    },

    {
      path: "*",
      element: <></>,
    },
  ]);
  return routeElements;
}
