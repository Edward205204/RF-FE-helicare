import { ResidentMenuItem } from "@/layouts/resident-layout";
import path from "./path";
import {
  Bell,
  Calendar,
  Home,
  MessageSquare,
  Utensils,
  Heart,
  Building,
} from "lucide-react";

export const residentMenu: ResidentMenuItem[] = [
  { path: path.residentHome, label: "Trang chủ", icon: Home },
  { path: path.residentSchedule, label: "Lịch trình", icon: Calendar },
  {
    path: path.residentMealNutrition,
    label: "Dinh dưỡng & Thực đơn",
    icon: Utensils,
  },
  { path: path.residentPosts, label: "Tin tức", icon: MessageSquare },
  {
    path: path.residentVitalSigns,
    label: "Chỉ số sức khỏe",
    icon: Heart,
  },
  { path: path.residentRoom, label: "Phòng của tôi", icon: Building },
  { path: path.residentNotification, label: "Thông báo", icon: Bell },
];
