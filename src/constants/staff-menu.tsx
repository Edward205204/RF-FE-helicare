import { StaffMenuItem } from "@/layouts/staff-layout";
import {
  Users,
  User,
  Activity,
  Calendar,
  Plus,
  MessageSquare,
  Bed,
  UserCircle,
  Pill,
  Utensils,
  AlertTriangle,
  CreditCard,
  Lock,
  CookingPot,
} from "lucide-react";
import path from "./path";

export const staffMenu: StaffMenuItem[] = [
  {
    label: "Danh sách Cư dân",
    path: path.residentList,
    icon: <Users size={20} />,
  },
  {
    label: "Hồ sơ Cư dân",
    path: path.residentInformation,
    icon: <User size={20} />,
  },
  {
    label: "Nhập Dấu hiệu Sinh tồn",
    path: path.vitalSignForm,
    icon: <Activity size={20} />,
  },
  {
    label: "Thuốc & Kế hoạch Chăm sóc",
    path: path.staffMedicationCareplan,
    icon: <Pill size={20} />,
  },
  {
    label: "Lịch trình Hàng ngày",
    path: path.staffManageEvent,
    icon: <Calendar size={20} />,
  },
  {
    label: "Tạo Sự kiện",
    path: path.staffCreateEvent,
    icon: <Plus size={20} />,
  },
  {
    label: "Giao tiếp Gia đình",
    path: path.newsFeed,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Danh sách Nhân viên",
    path: path.staffList,
    icon: <Users size={20} />,
  },
  {
    label: "Tuyển dụng Nhân viên",
    path: path.staffOnboard,
    icon: <UserCircle size={20} />,
  },
  {
    label: "Kế hoạch Dinh dưỡng",
    path: path.staffNutrition,
    icon: <Utensils size={20} />,
  },
  {
    label: "Kho Thực phẩm",
    path: path.staffFoodBankManagement,
    icon: <CookingPot size={20} />,
  },
  {
    label: "Phân bổ Phòng",
    path: path.roomManagement,
    icon: <Bed size={20} />,
  },
  {
    label: "SOS & Sự cố",
    path: path.staffIncidents,
    icon: <AlertTriangle size={20} />,
  },
  {
    label: "Yêu cầu Dịch vụ",
    path: path.staffServiceRequests,
    icon: <CreditCard size={20} />,
  },
  {
    label: "Quản lý Phản hồi",
    path: path.staffFeedbackManagement,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Quản lý Mật khẩu Cư dân",
    path: path.staffResidentPasswordManagement,
    icon: <Lock size={20} />,
  },
];
