import path from "@/constants/path";
import { useRoutes } from "react-router";
import Signin from "@/pages/auth/signin/signin";
import ResidentSignin from "@/pages/auth/resident-signin/resident-signin";
import { ProtectedRoute, RejectedRoute } from "./guard";
import Signup from "@/pages/auth/signup/signup";
import WaitToVerify from "@/pages/auth/signup/wait-to-verify";
import VerifyEmail from "@/pages/auth/signup/verify-email";
import ForgotPasswordEmail from "@/pages/auth/forgot-password/forgot-password-email";
import WaitToVerifyForgotPassword from "@/pages/auth/forgot-password/wait-to-verify-forgot-password";
import VerifyForgotPassword from "@/pages/auth/forgot-password/verify-forgot-password";
import ResetPassword from "@/pages/auth/forgot-password/reset-password";
import ListResident from "@/pages/resident/list-resident";
import ResidentInformation from "@/pages/resident/resident-information";
import ResidentDetail from "@/pages/resident/resident-detail";
import ResidentAssignedStaff from "@/pages/resident/resident-assigned-staff";
import VitalSignForm from "@/pages/vital-sign/vital-sign-form";
import StaffCreateEvent from "@/pages/event/staff-create-event";
import StaffManageEvent from "@/pages/event/staff-manage-event";
import RoomManagement from "@/pages/room/room-management";
import StaffLayout from "@/layouts/staff-layout";
import NewsFeed from "@/pages/posts/newsfeed";
import Post from "@/pages/posts/post";
import StaffOnboard from "@/pages/staff/staff-onboard";
import StaffList from "@/pages/staff/staff-list";
import StaffDetail from "@/pages/staff/staff-detail";
import StaffPerformance from "@/pages/staff/staff-performance";
import VerifyStaffInvite from "@/pages/auth/staff/verify-staff-invite";
import InviteRedirect from "@/pages/auth/invite-redirect";
import FamilyLayout from "@/layouts/family-layout";
import FamilyNewsFeed from "@/pages/posts/family-newsfeed";
import FamilyResidents from "@/pages/resident/family-residents";
import MedicationCarePlan from "@/pages/event/staff-medication-careplan";
import NutritionPage from "@/pages/nutrition/nutrition-staff";
import FoodBankManagementPage from "@/pages/staff/food-bank-management";
import StaffPayment from "@/pages/payment/staff-payment";
import StaffSOSIncidentManagement from "@/pages/staff/sos";
import StaffFeedbackManagement from "@/pages/staff/feedback-management";
import ResidentPasswordManagement from "@/pages/staff/resident-password-management";
import FamilyHealthCare from "@/pages/family/health-care";
import WeeklyDailyCalendar from "@/pages/family/family-schedule";
import NutritionAllergyPage from "@/pages/nutrition/nutrition-family";
import { RoomBedFamilyPage } from "@/pages/room/family-get-room";
import FamilyNotifications from "@/pages/family/notification";
import FamilyFeedbackSupport from "@/pages/family/feedback";
import PaymentModuleFamily from "@/pages/payment/family-payment";
import FamilyOverview from "@/pages/family/overview";
import ResidentLayout from "@/layouts/resident-layout";
import ResidentHome from "@/pages/resident/resident-home";
import ResidentSchedule from "@/pages/resident/resident-schedule";
import ResidentMealNutrition from "@/pages/resident/resident-meal-nutrition";
import ResidentPosts from "@/pages/resident/resident-posts";
import ResidentVitalSigns from "@/pages/resident/resident-vital-signs";
import ResidentRoom from "@/pages/resident/resident-room";
import ResidentNotifications from "@/pages/resident/resident-notifications";
import ResidentChangePassword from "@/pages/resident/resident-change-password";

export default function useReactRouter() {
  const routeElements = useRoutes([
    {
      path: "",
      element: <ProtectedRoute />,
      children: [
        {
          path: path.residentList,
          element: (
            <StaffLayout>
              <ListResident />
            </StaffLayout>
          ),
        },
        {
          path: path.residentInformation,
          element: (
            <StaffLayout>
              <ResidentInformation />
            </StaffLayout>
          ),
        },
        {
          path: path.residentDetail,
          element: (
            <StaffLayout>
              <ResidentDetail />
            </StaffLayout>
          ),
        },
        {
          path: path.residentAssignedStaff,
          element: (
            <StaffLayout>
              <ResidentAssignedStaff />
            </StaffLayout>
          ),
        },
        {
          path: path.vitalSignForm,
          element: (
            <StaffLayout>
              <VitalSignForm />
            </StaffLayout>
          ),
        },

        {
          path: path.staffCreateEvent,
          element: (
            <StaffLayout>
              <StaffCreateEvent />
            </StaffLayout>
          ),
        },

        {
          path: path.staffManageEvent,
          element: (
            <StaffLayout>
              <StaffManageEvent />
            </StaffLayout>
          ),
        },
        {
          path: path.roomManagement,
          element: (
            <StaffLayout>
              <RoomManagement />
            </StaffLayout>
          ),
        },

        {
          path: path.newsFeed,
          element: (
            <StaffLayout>
              <NewsFeed />
            </StaffLayout>
          ),
        },

        {
          path: path.createPost,
          element: (
            <StaffLayout>
              <Post />
            </StaffLayout>
          ),
        },
        {
          path: path.staffOnboard,
          element: (
            <StaffLayout>
              <StaffOnboard />
            </StaffLayout>
          ),
        },
        {
          path: path.staffList,
          element: (
            <StaffLayout>
              <StaffList />
            </StaffLayout>
          ),
        },
        {
          path: path.staffDetail,
          element: (
            <StaffLayout>
              <StaffDetail />
            </StaffLayout>
          ),
        },
        {
          path: path.staffPerformance,
          element: (
            <StaffLayout>
              <StaffPerformance />
            </StaffLayout>
          ),
        },
        {
          path: path.staffServiceRequests,
          element: (
            <StaffLayout>
              <StaffPayment />
            </StaffLayout>
          ),
        },
        {
          path: path.staffMedicationCareplan,
          element: (
            <StaffLayout>
              <MedicationCarePlan />
            </StaffLayout>
          ),
        },
        {
          path: path.staffIncidents,
          element: (
            <StaffLayout>
              <StaffSOSIncidentManagement />
            </StaffLayout>
          ),
        },
        {
          path: path.staffFeedbackManagement,
          element: (
            <StaffLayout>
              <StaffFeedbackManagement />
            </StaffLayout>
          ),
        },
        {
          path: path.staffResidentPasswordManagement,
          element: (
            <StaffLayout>
              <ResidentPasswordManagement />
            </StaffLayout>
          ),
        },
        {
          path: path.staffNutrition,
          element: (
            <StaffLayout>
              <NutritionPage />
            </StaffLayout>
          ),
        },
        {
          path: path.staffFoodBankManagement,
          element: (
            <StaffLayout>
              <FoodBankManagementPage />
            </StaffLayout>
          ),
        },
        {
          path: path.familyNewsFeed,
          element: (
            <FamilyLayout>
              <FamilyNewsFeed />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyResidents,
          element: (
            <FamilyLayout>
              <FamilyResidents />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyHealthCare,
          element: (
            <FamilyLayout>
              <FamilyHealthCare />
            </FamilyLayout>
          ),
        },
        {
          path: path.familySchedule,
          element: (
            <FamilyLayout>
              <WeeklyDailyCalendar />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyMealAndNutrition,
          element: (
            <FamilyLayout>
              <NutritionAllergyPage />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyRoomAndFacility,
          element: (
            <FamilyLayout>
              <RoomBedFamilyPage />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyNotification,
          element: (
            <FamilyLayout>
              <FamilyNotifications />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyFeedbackAndSupport,
          element: (
            <FamilyLayout>
              <FamilyFeedbackSupport />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyHome,
          element: (
            <FamilyLayout>
              <FamilyOverview />
            </FamilyLayout>
          ),
        },
        {
          path: path.familyBillingAndPayment,
          element: (
            <FamilyLayout>
              <PaymentModuleFamily />
            </FamilyLayout>
          ),
        },
        // Resident pages
        {
          path: path.residentHome,
          element: (
            <ResidentLayout>
              <ResidentHome />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentSchedule,
          element: (
            <ResidentLayout>
              <ResidentSchedule />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentMealNutrition,
          element: (
            <ResidentLayout>
              <ResidentMealNutrition />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentPosts,
          element: (
            <ResidentLayout>
              <ResidentPosts />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentVitalSigns,
          element: (
            <ResidentLayout>
              <ResidentVitalSigns />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentRoom,
          element: (
            <ResidentLayout>
              <ResidentRoom />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentNotification,
          element: (
            <ResidentLayout>
              <ResidentNotifications />
            </ResidentLayout>
          ),
        },
        {
          path: path.residentChangePassword,
          element: (
            <ResidentLayout>
              <ResidentChangePassword />
            </ResidentLayout>
          ),
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
          path: path.residentSignin,
          element: <ResidentSignin />,
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
        {
          path: path.invite,
          element: <InviteRedirect />,
        },
        {
          path: path.verifyStaffInvite,
          element: <VerifyStaffInvite />,
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
