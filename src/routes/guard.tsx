import { useContext, useEffect, useState } from "react";
import { AppContext } from "../contexts/app.context";
import path from "../constants/path";
import { Navigate, Outlet, useLocation } from "react-router";
import { UserRole } from "@/constants/user-role";
import {
  hasInstitutionAccess,
  checkInstitutionAccessViaAPI,
} from "@/utils/family-utils";

export function ProtectedRoute() {
  const { isAuthenticated, profile } = useContext(AppContext);
  const location = useLocation();
  const [hasInstitutionAccessState, setHasInstitutionAccessState] = useState<
    boolean | null
  >(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check institution access for family users
  useEffect(() => {
    const checkAccess = async () => {
      if (!profile) {
        setIsChecking(false);
        return;
      }

      const userRole = (profile as any).role;
      if (userRole !== UserRole.Family) {
        setIsChecking(false);
        return;
      }

      // First check profile
      const profileAccess = hasInstitutionAccess(profile);
      if (profileAccess) {
        setHasInstitutionAccessState(true);
        setIsChecking(false);
        return;
      }

      // If no institution_id in profile, check via API (resident links)
      try {
        const apiAccess = await checkInstitutionAccessViaAPI();
        setHasInstitutionAccessState(apiAccess);
      } catch (error) {
        console.error("Failed to check institution access:", error);
        setHasInstitutionAccessState(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (isAuthenticated && profile) {
      checkAccess();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, profile]);

  if (!isAuthenticated) {
    return <Navigate to={path.signin} />;
  }

  // Wait for institution access check to complete
  if (isChecking) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  // Check if family user is trying to access a route that requires institution
  if (profile) {
    const userRole = (profile as any).role;
    if (userRole === UserRole.Family) {
      // List of routes that require institution access
      const routesRequiringInstitution = [
        path.familyNewsFeed,
        path.familyHealthCare,
        path.familySchedule,
        path.familyMealAndNutrition,
        path.familyRoomAndFacility,
        path.familyNotification,
        path.familyFeedbackAndSupport,
        path.familyBillingAndPayment,
      ];

      // If accessing a route that requires institution but doesn't have access
      if (
        routesRequiringInstitution.includes(location.pathname as any) &&
        !hasInstitutionAccessState
      ) {
        return <Navigate to={path.familyResidents} replace />;
      }

      // If at home page, stay there (it's safe)
      if (location.pathname === path.familyHome) {
        return <Outlet />;
      }
    }

    // Staff/Admin redirect logic
    if (
      (userRole === UserRole.Staff ||
        userRole === UserRole.Admin ||
        userRole === UserRole.RootAdmin) &&
      location.pathname === path.familyHome
    ) {
      return <Navigate to={path.residentList} replace />;
    }

    // Resident routes guard - only allow resident role
    const residentRoutes = [
      path.residentHome,
      path.residentSchedule,
      path.residentMealNutrition,
      path.residentPosts,
      path.residentVitalSigns,
      path.residentRoom,
      path.residentNotification,
      path.residentChangePassword,
    ];

    if (residentRoutes.includes(location.pathname as any)) {
      if (userRole !== UserRole.Resident) {
        return <Navigate to={path.signin} replace />;
      }
    }

    // Redirect resident users away from non-resident pages
    if (userRole === UserRole.Resident) {
      if (!residentRoutes.includes(location.pathname as any)) {
        return <Navigate to={path.residentHome} replace />;
      }
    }
  }

  return <Outlet />;
}

export function RejectedRoute() {
  const { isAuthenticated, profile } = useContext(AppContext);
  const [hasInstitutionAccessState, setHasInstitutionAccessState] = useState<
    boolean | null
  >(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check institution access for family users
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !profile) {
        return;
      }

      const userRole = (profile as any).role;
      if (userRole !== UserRole.Family) {
        return;
      }

      setIsChecking(true);

      // First check profile
      const profileAccess = hasInstitutionAccess(profile);
      if (profileAccess) {
        setHasInstitutionAccessState(true);
        setIsChecking(false);
        return;
      }

      // If no institution_id in profile, check via API (resident links)
      try {
        const apiAccess = await checkInstitutionAccessViaAPI();
        setHasInstitutionAccessState(apiAccess);
      } catch (error) {
        console.error("Failed to check institution access:", error);
        setHasInstitutionAccessState(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (isAuthenticated && profile) {
      checkAccess();
    }
  }, [isAuthenticated, profile]);

  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Wait for institution access check to complete for family users
  if (isChecking && profile && (profile as any).role === UserRole.Family) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  // Đã authenticated - redirect dựa theo role
  if (profile) {
    const userRole = (profile as any).role;
    if (
      userRole === UserRole.Staff ||
      userRole === UserRole.Admin ||
      userRole === UserRole.RootAdmin
    ) {
      return <Navigate to={path.residentList} replace />;
    }
    if (userRole === UserRole.Family) {
      // Redirect to home (safe page) instead of newsfeed
      // Newsfeed requires institution access
      return <Navigate to={path.familyHome} replace />;
    }
    if (userRole === UserRole.Resident) {
      return <Navigate to={path.residentHome} replace />;
    }
  }

  return <Navigate to={path.familyHome} replace />;
}
