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
  { path: path.familyHome, label: "Overview", icon: Home },
  {
    path: path.familyResidents,
    label: "My Residents",
    icon: Users,
    requiresInstitution: false,
  }, // Always show - this is where they link
  {
    path: path.familyNewsFeed,
    label: "Resident Journal",
    icon: BookOpen,
    requiresInstitution: true,
  },
  {
    path: path.familyHealthCare,
    label: "Health & Care",
    icon: Heart,
    requiresInstitution: true,
  },
  {
    path: path.familySchedule,
    label: "Schedule & Activities",
    icon: Calendar,
    requiresInstitution: true,
  },
  {
    path: path.familyMealAndNutrition,
    label: "Meals & Nutrition",
    icon: Utensils,
    requiresInstitution: true,
  },
  {
    path: path.familyRoomAndFacility,
    label: "Room & Facilities",
    icon: Building,
    requiresInstitution: true,
  },
  {
    path: path.familyNotification,
    label: "Notifications",
    icon: Bell,
    requiresInstitution: true,
  },
  {
    path: path.familyFeedbackAndSupport,
    label: "Feedback & Support",
    icon: MessageSquare,
    requiresInstitution: true,
  },
  {
    path: path.familyBillingAndPayment,
    label: "Billing & Payment",
    icon: CreditCard,
    requiresInstitution: true,
  },
];
