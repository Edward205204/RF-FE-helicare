const path = {
  home: "/",
  signin: "/login",
  signup: "/register",
  waitToVerify: "/wait-to-verify",
  verifyEmail: "/verify-email",
  forgotPasswordEmail: "/forgot-password-email",
  waitToVerifyForgotPassword: "/wait-to-verify-forgot-password",
  verifyForgotPassword: "/verify-forgot-password",
  resetPassword: "/reset-password",
} as const;

export default path;
