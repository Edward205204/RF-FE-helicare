import React, { useState, useEffect, createContext, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  User,
  Activity,
  Pill,
  Calendar,
  Plus,
  Eye,
  QrCode,
  MessageSquare,
  Utensils,
  ChefHat,
  Bed,
  Wrench,
  AlertTriangle,
  FileText,
  BarChart3,
  UserCircle,
  Cog,
  LogOut,
} from "lucide-react";
import path from "@/constants/path";
import { removeLocalStorage } from "@/utils/local-storage";

export type CareEvent = {
  id: string;
  priority: string;
  resident?: string;
  datetimeISO: string;
  dateISO: string;
  datetimeLabel: string;
  staffName: string;
  location: string;
  type?: string;
  eventName: string;
  quantity: number;
  notes?: string;
  status?: "upcoming" | "ongoing" | "done" | "cancelled";
  staffId?: string;
};

export type FamilyVisit = {
  id: string;
  priority: string;
  resident: string;
  date: string;
  family: string;
  qr: boolean;
  datetime?: string;
  datetimeISO?: string;
  endDatetime?: string;
  notes?: string;
};

type StaffLayoutContextType = {
  care: CareEvent[];
  visits: FamilyVisit[];
  setCare: React.Dispatch<React.SetStateAction<CareEvent[]>>;
  setVisits: React.Dispatch<React.SetStateAction<FamilyVisit[]>>;
  addNotification?: (
    type: "new" | "update" | "delete",
    message: string
  ) => void;
};

const StaffLayoutContext = createContext<StaffLayoutContextType | null>(null);

export function useStaffLayoutContext() {
  const context = useContext(StaffLayoutContext);
  if (!context) {
    throw new Error("useStaffLayoutContext must be used within StaffLayout");
  }
  return context;
}

// Type cho menu item
type StaffMenuItem = {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: StaffMenuItem[];
};

const staffMenu: StaffMenuItem[] = [
  {
    label: "Resident & Health Records",
    children: [
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
      // {
      //   label: "Medication & Care Plan",
      //   // path: path.carePlanForm,
      //   path: "#",
      //   icon: <Pill size={20} />,
      // },
    ],
  },
  {
    label: "Schedule & Activities",
    children: [
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
      // { label: "Manage Events", path: "/setting-event", icon: <Settings size={20} /> },
    ],
  },
  {
    label: "Visits & Family",
    children: [
      // { label: "Visit Requests", path: "/staff/visits", icon: <Eye size={20} /> },
      // {
      //   label: "QR Check-in",
      //   path: "#",
      //   icon: <QrCode size={20} />,
      // },
      {
        label: "Family Communication",
        path: path.newsFeed,
        icon: <MessageSquare size={20} />,
      },
    ],
  },
  {
    label: "Team & Access",
    children: [
      {
        label: "Staff Onboarding",
        path: path.staffOnboard,
        icon: <UserCircle size={20} />,
      },
    ],
  },
  // {
  //   label: "Nutrition & Diet",
  //   children: [
  //     {
  //       label: "Diet Plans",
  //       path: "/staff/diet-plans",
  //       icon: <Utensils size={20} />,
  //     },
  //     {
  //       label: "Meal Tracking",
  //       path: "/staff/meal-tracking",
  //       icon: <ChefHat size={20} />,
  //     },
  //   ],
  // },
  {
    label: "Rooms & Beds",
    children: [
      {
        label: "Room Allocation",
        path: path.roomManagement,
        icon: <Bed size={20} />,
      },
      // {
      //   label: "Maintenance Tickets",
      //   path: "/staff/maintenance",
      //   icon: <Wrench size={20} />,
      // },
    ],
  },
  // {
  //   label: "SOS & Incidents",
  //   children: [
  //     {
  //       label: "Live SOS Alerts",
  //       path: "/staff/sos-alerts",
  //       icon: <AlertTriangle size={20} />,
  //     },
  //     {
  //       label: "Incident Reports",
  //       path: "/staff/incidents",
  //       icon: <FileText size={20} />,
  //     },
  //   ],
  // },
  // {
  //   label: "Reports & Analytics",
  //   children: [
  //     {
  //       label: "Resident Reports",
  //       path: "/staff/resident-reports",
  //       icon: <BarChart3 size={20} />,
  //     },
  //     {
  //       label: "Operations Dashboard",
  //       path: "/staff/operations-dashboard",
  //       icon: <BarChart3 size={20} />,
  //     },
  //   ],
  // },
  // {
  //   label: "Account & Settings",
  //   children: [
  //     {
  //       label: "My Profile",
  //       path: "/staff/profile",
  //       icon: <UserCircle size={20} />,
  //     },
  //     { label: "Settings", path: "/staff/settings", icon: <Cog size={20} /> },
  //   ],
  // },
];

const MenuItem: React.FC<{ item: StaffMenuItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors"
        >
          {item.icon && <span className="mr-3">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          <span className="ml-2 text-gray-500">{isOpen ? "▼" : "▶"}</span>
        </button>
        {isOpen && (
          <div className="ml-6">
            {item.children.map((child, index) => (
              <NavLink
                key={index}
                to={child.path || "#"}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 hover:bg-gray-100 transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700"
                  }`
                }
              >
                {child.icon && <span className="mr-3">{child.icon}</span>}
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || "#"}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 hover:bg-gray-100 transition-colors ${
          isActive ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700"
        }`
      }
    >
      {item.icon && <span className="mr-3">{item.icon}</span>}
      <span>{item.label}</span>
    </NavLink>
  );
};

// Main component
const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [care, setCare] = useState<CareEvent[]>([]);
  const [visits, setVisits] = useState<FamilyVisit[]>([]);
  const navigate = useNavigate();
  const role = "staff";

  // Handle logout
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      removeLocalStorage();
      navigate(path.signin);
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const storedCare = localStorage.getItem("careEvents");
    const storedVisits = localStorage.getItem("familyVisits");
    if (storedCare) setCare(JSON.parse(storedCare));
    if (storedVisits) setVisits(JSON.parse(storedVisits));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("careEvents", JSON.stringify(care));
    localStorage.setItem("familyVisits", JSON.stringify(visits));
  }, [care, visits]);

  // Simple helper to allow child routes to add notifications via Outlet context.
  // Replace console.log with real notification/toast logic as needed.
  const addNotification = (message: string) => {
    console.log("Notification:", message);
  };

  const contextValue: StaffLayoutContextType = {
    care,
    visits,
    setCare,
    setVisits,
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-white">
      {/* Sidebar FIXED */}
      <aside className="fixed left-0 top-0 rounded-lg w-64 bg-white/70 backdrop-blur border-r border-gray-300 h-screen overflow-y-auto pb-16">
        {/* Branding */}
        <div className="flex items-center justify-center px-4 py-6 border-b border-gray-200">
          <div className="text-3xl font-bold text-[#5985d8]">HeLiCare</div>
        </div>

        {/* Menu */}
        <nav className="mt-4">
          {staffMenu.map((section, index) => (
            <div key={index} className="mb-4">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section.label}
              </h3>
              {section.children ? (
                <div>
                  {section.children.map((item, idx) => (
                    <MenuItem key={idx} item={item} />
                  ))}
                </div>
              ) : (
                <MenuItem item={section} />
              )}
            </div>
          ))}
        </nav>

        {/* Profile Information Display */}
        {role !== "staff" && (
          <div className="profile-info">{/* Profile details here */}</div>
        )}

        {/* Logout Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content pushed right */}
      <main className="ml-64 w-[calc(100vw-16rem)] max-w-[calc(100vw-16rem)] min-w-0 p-0 overflow-x-hidden h-screen overflow-y-auto">
        <StaffLayoutContext.Provider value={contextValue}>
          {children}
        </StaffLayoutContext.Provider>
      </main>
    </div>
  );
};

export default StaffLayout;
