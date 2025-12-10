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
  { path: path.residentSchedule, label: "Lịch trình của tôi", icon: Calendar },
  {
    path: path.residentMealNutrition,
    label: "Bữa ăn & Dinh dưỡng",
    icon: Utensils,
  },
  { path: path.residentPosts, label: "Bài viết", icon: MessageSquare },
  {
    path: path.residentVitalSigns,
    label: "Lịch sử Dấu hiệu Sinh tồn",
    icon: Heart,
  },
  { path: path.residentRoom, label: "Phòng của tôi", icon: Building },
  { path: path.residentNotification, label: "Thông báo", icon: Bell },
];

