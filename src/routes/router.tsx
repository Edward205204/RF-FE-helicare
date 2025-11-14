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
import ListResident from "@/pages/resident/list-resident";
import ResidentInformation from "@/pages/resident/resident-information";
import ResidentDetail from "@/pages/resident/resident-detail";
import VitalSignForm from "@/pages/vital-sign/vital-sign-form";
import StaffCreateEvent from "@/pages/event/staff-create-event";
import StaffManageEvent from "@/pages/event/staff-manage-event";
import RoomManagement from "@/pages/room/room-management";
import StaffLayout from "@/layouts/staff-layout";
import NewsFeed from "@/pages/posts/newsfeed";
import Post from "@/pages/posts/post";
import StaffOnboard from "@/pages/staff/staff-onboard";
import VerifyStaffInvite from "@/pages/auth/staff/verify-staff-invite";
import InviteRedirect from "@/pages/auth/invite-redirect";
import FamilyLayout from "@/layouts/family-layout";
import FamilyNewsFeed from "@/pages/posts/family-newsfeed";
import FamilyResidents from "@/pages/resident/family-residents";

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
