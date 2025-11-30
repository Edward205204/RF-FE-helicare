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
    label: "Resident List",
    path: path.residentList,
    icon: <Users size={20} />,
  },
  {
    label: "Resident Profile",
    path: path.residentInformation,
    icon: <User size={20} />,
  },
  {
    label: "Vital Signs Input",
    path: path.vitalSignForm,
    icon: <Activity size={20} />,
  },
  {
    label: "Medication & Care Plan",
    path: path.staffMedicationCareplan,
    icon: <Pill size={20} />,
  },
  {
    label: "Daily Schedule",
    path: path.staffManageEvent,
    icon: <Calendar size={20} />,
  },
  {
    label: "Create Event",
    path: path.staffCreateEvent,
    icon: <Plus size={20} />,
  },
  {
    label: "Family Communication",
    path: path.newsFeed,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Staff List",
    path: path.staffList,
    icon: <Users size={20} />,
  },
  {
    label: "Staff Onboarding",
    path: path.staffOnboard,
    icon: <UserCircle size={20} />,
  },
  {
    label: "Diet Plans",
    path: path.staffNutrition,
    icon: <Utensils size={20} />,
  },
  {
    label: "Food Bank",
    path: path.staffFoodBankManagement,
    icon: <CookingPot size={20} />,
  },
  {
    label: "Room Allocation",
    path: path.roomManagement,
    icon: <Bed size={20} />,
  },
  {
    label: "SOS & Incidents",
    path: path.staffIncidents,
    icon: <AlertTriangle size={20} />,
  },
  {
    label: "Service Requests",
    path: path.staffServiceRequests,
    icon: <CreditCard size={20} />,
  },
  {
    label: "Feedback Management",
    path: path.staffFeedbackManagement,
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Resident Password Management",
    path: path.staffResidentPasswordManagement,
    icon: <Lock size={20} />,
  },
];
