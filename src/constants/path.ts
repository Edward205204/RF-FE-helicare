const path = {
  familyHome: "/family/home",
  signin: "/login",
  residentSignin: "/resident/login",
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
  staffMedicationCareplan: "/event/medication-careplan",

  staffNutrition: "/nutrition/nutrition-staff",
  staffFoodBankManagement: "/staff/food-bank-management",

  staffIncidents: "/staff/incidents",
  staffServiceRequests: "/staff/service-requests",
  staffFeedbackManagement: "/staff/feedback-management",
  staffResidentPasswordManagement: "/staff/resident-password-management",
  staffOnboard: "/staff/onboard",
  staffList: "/staff",
  staffDetail: "/staff/:staff_id",
  staffPerformance: "/staff/:staff_id/performance",

  verifyStaffInvite: "/verify-staff-invite",
  verifyFamilyLink: "/verify-family-link",

  invite: "/invite",

  roomManagement: "/room/management",
  roomDetail: "/room/detail/:room_id",

  residentAssignedStaff: "/resident/:id/assigned-staff",

  newsFeed: "/post/newsfeed",
  createPost: "/post/createPost",

  familyNewsFeed: "/family/newsfeed",
  familyResidents: "/family/residents",
  familyHealthCare: "/family/health-care",
  familySchedule: "/family/schedule",
  familyMealAndNutrition: "/family/meal-and-nutrition",
  familyRoomAndFacility: "/family/room-and-facility",
  familyNotification: "/family/notification",
  familyFeedbackAndSupport: "/family/feedback-and-support",
  familyBillingAndPayment: "/family/billing-and-payment",
  paymentResult: "/payment/result",

  // Resident pages
  residentHome: "/resident/home",
  residentSchedule: "/resident/schedule",
  residentMealNutrition: "/resident/meal-nutrition",
  residentPosts: "/resident/posts",
  residentVitalSigns: "/resident/vital-signs",
  residentRoom: "/resident/room",
  residentNotification: "/resident/notifications",
  residentChangePassword: "/resident/change-password",

  // Admin pages
  adminLogin: "/admin/login",
  adminRegister: "/admin/register",
  adminDashboard: "/admin/dashboard",
  adminResidents: "/admin/residents",
  adminStaff: "/admin/staff",
  adminSettings: "/admin/settings",
} as const;

export default path;
