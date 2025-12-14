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
    label: "Bảng điều khiển",
    path: path.adminDashboard,
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Cư dân",
    path: path.adminResidents,
    icon: <Users size={20} />,
  },
  {
    label: "Nhân viên",
    path: path.adminStaff,
    icon: <UserCog size={20} />,
  },
];
