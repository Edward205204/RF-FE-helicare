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
    label: "Danh sách cư dân",
    path: path.residentList,
    icon: <Users size={20} />,
  },
  {
    label: "Hồ sơ cư dân",
    path: path.residentInformation,
    icon: <User size={20} />,
  },
  {
    label: "Nhập chỉ số sức khỏe",
    path: path.vitalSignForm,
    icon: <Activity size={20} />,
  },
  {
    label: "Thuốc",
    path: path.staffMedicationCareplan,
    icon: <Pill size={20} />,
  },
  {
    label: "Lịch trình hàng ngày",
    path: path.staffManageEvent,
    icon: <Calendar size={20} />,
  },
  {
    label: "Tạo sự kiện",
    path: path.staffCreateEvent,
    icon: <Plus size={20} />,
  },
  {
    label: "Cộng đồng",
    path: path.newsFeed,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Danh sách nhân viên",
    path: path.staffList,
    icon: <Users size={20} />,
  },
  {
    label: "Tiếp nhận nhân viên",
    path: path.staffOnboard,
    icon: <UserCircle size={20} />,
  },
  {
    label: "Kế hoạch dinh dưỡng",
    path: path.staffNutrition,
    icon: <Utensils size={20} />,
  },
  {
    label: "Kho thực phẩm",
    path: path.staffFoodBankManagement,
    icon: <CookingPot size={20} />,
  },
  {
    label: "Phân bổ phòng",
    path: path.roomManagement,
    icon: <Bed size={20} />,
  },
  {
    label: "Báo cáo sự cố",
    path: path.staffIncidents,
    icon: <AlertTriangle size={20} />,
  },
  {
    label: "Thanh toán",
    path: path.staffServiceRequests,
    icon: <CreditCard size={20} />,
  },
  {
    label: "Quản lý phản hồi",
    path: path.staffFeedbackManagement,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Tài khoản cư dân",
    path: path.staffResidentPasswordManagement,
    icon: <Lock size={20} />,
  },
];
