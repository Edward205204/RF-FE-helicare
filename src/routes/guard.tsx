import { useContext } from "react";
import { AppContext } from "../contexts/app.context";
import path from "../constants/path";
import { Navigate, Outlet, useLocation } from "react-router";
import { UserRole } from "@/constants/user-role";

export function ProtectedRoute() {
  const { isAuthenticated, profile } = useContext(AppContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={path.signin} />;
  }

  // Nếu đang ở trang home, redirect dựa theo role
  if (location.pathname === path.home && profile) {
    const userRole = (profile as any).role;
    if (
      userRole === UserRole.Staff ||
      userRole === UserRole.Admin ||
      userRole === UserRole.RootAdmin
    ) {
      return <Navigate to={path.residentList} replace />;
    }
    if (userRole === UserRole.Family) {
      return <Navigate to={path.familyNewsFeed} replace />;
    }
    // Role khác giữ nguyên ở home
  }

  return <Outlet />;
}

export function RejectedRoute() {
  const { isAuthenticated, profile } = useContext(AppContext);

  if (!isAuthenticated) {
    return <Outlet />;
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
      return <Navigate to={path.familyNewsFeed} replace />;
    }
  }

  return <Navigate to={path.home} replace />;
}
