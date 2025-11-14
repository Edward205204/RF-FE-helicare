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

  residentList: "/resident/list",
  residentInformation: "/resident/information",
  residentDetail: "/resident/detail/:resident_id",
  vitalSignForm: "/vital-sign-form",

  staffCreateEvent: "/event/create-event",
  staffManageEvent: "/event/manage-event",

  roomManagement: "/room/management",

  staffOnboard: "/staff/onboard",
  verifyStaffInvite: "/verify-staff-invite",
  invite: "/invite",

  newsFeed: "/post/newsfeed",
  createPost: "/post/createPost",

  familyNewsFeed: "/family/newsfeed",
  familyResidents: "/family/residents",
} as const;

export default path;
