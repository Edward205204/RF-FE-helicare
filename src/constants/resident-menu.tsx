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
  { path: path.residentHome, label: "Home", icon: Home },
  { path: path.residentSchedule, label: "My Schedule", icon: Calendar },
  {
    path: path.residentMealNutrition,
    label: "Meal Nutrition",
    icon: Utensils,
  },
  { path: path.residentPosts, label: "Posts", icon: MessageSquare },
  {
    path: path.residentVitalSigns,
    label: "Vital Signs History",
    icon: Heart,
  },
  { path: path.residentRoom, label: "My Room", icon: Building },
  { path: path.residentNotification, label: "Notifications", icon: Bell },
];

