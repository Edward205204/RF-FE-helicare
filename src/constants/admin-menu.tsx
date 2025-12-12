import { AdminMenuItem } from "@/layouts/admin-layout";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  FileText,
  Settings,
} from "lucide-react";
import path from "./path";

export const adminMenu: AdminMenuItem[] = [
  {
    label: "Dashboard",
    path: path.adminDashboard,
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Quản lý Cư dân",
    path: path.adminResidents,
    icon: <Users size={20} />,
  },
  {
    label: "Quản lý Nhân viên",
    path: path.adminStaff,
    icon: <UserCog size={20} />,
  },
  {
    label: "Nhiệm vụ & Báo cáo",
    path: path.adminTasks,
    icon: <ClipboardList size={20} />,
  },
  {
    label: "Cài đặt",
    path: path.adminSettings,
    icon: <Settings size={20} />,
  },
];
