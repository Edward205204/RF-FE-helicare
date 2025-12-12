import { FamilyMenuItem } from "@/layouts/family-layout";
import path from "./path";
import {
  Bell,
  BookOpen,
  Building,
  Calendar,
  CreditCard,
  Heart,
  Home,
  MessageSquare,
  Users,
  Utensils,
} from "lucide-react";

export const familyMenu: FamilyMenuItem[] = [
  { path: path.familyHome, label: "Tổng quan", icon: Home },
  {
    path: path.familyResidents,
    label: "Người thân của tôi",
    icon: Users,
    requiresInstitution: false,
  }, // Always show - this is where they link
  {
    path: path.familyNewsFeed,
    label: "Bảng tin gia đình",
    icon: BookOpen,
    requiresInstitution: true,
  },
  {
    path: path.familyHealthCare,
    label: "Sức khỏe & Chăm sóc",
    icon: Heart,
    requiresInstitution: true,
  },
  {
    path: path.familySchedule,
    label: "Lịch trình & Hoạt động",
    icon: Calendar,
    requiresInstitution: true,
  },
  {
    path: path.familyMealAndNutrition,
    label: "Bữa ăn & Dinh dưỡng",
    icon: Utensils,
    requiresInstitution: true,
  },
  {
    path: path.familyRoomAndFacility,
    label: "Phòng & Tiện ích",
    icon: Building,
    requiresInstitution: true,
  },
  {
    path: path.familyNotification,
    label: "Thông báo",
    icon: Bell,
    requiresInstitution: true,
  },
  {
    path: path.familyFeedbackAndSupport,
    label: "Phản hồi & Hỗ trợ",
    icon: MessageSquare,
    requiresInstitution: true,
  },
  {
    path: path.familyBillingAndPayment,
    label: "Thanh toán & Hóa đơn",
    icon: CreditCard,
    requiresInstitution: true,
  },
];
