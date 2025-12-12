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
    label: "Residents",
    path: path.adminResidents,
    icon: <Users size={20} />,
  },
  {
    label: "Staff",
    path: path.adminStaff,
    icon: <UserCog size={20} />,
  },
];
