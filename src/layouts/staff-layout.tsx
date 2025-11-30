import React, { useState, useEffect, createContext, useContext } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import path from "@/constants/path";
import { removeLocalStorage } from "@/utils/local-storage";
import { staffMenu } from "@/constants/staff-menu";
export type CareEvent = {
  id: string;
  name: string;
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

export type StaffMenuItem = {
  path?: string;
  icon?: React.ReactNode;
  label?: string;
};

const MenuItem: React.FC<{ item: StaffMenuItem }> = ({ item }) => {
  // const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Check if path is exactly active (not just prefix match)
  const isExactActive = (pathToCheck: string | undefined) => {
    if (!pathToCheck) return false;
    const currentPath = location.pathname;

    // For /staff, only match exactly (not /staff/onboard, /staff/:id, etc.)
    if (pathToCheck === path.staffList) {
      return currentPath === path.staffList;
    }

    // For paths with params like /staff/:staff_id, check pattern match
    if (pathToCheck.includes(":")) {
      // Convert /staff/:staff_id to regex pattern
      const pattern = pathToCheck.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }

    // For exact paths, match exactly
    return currentPath === pathToCheck;
  };

  const isActive = isExactActive(item.path);
  return (
    <NavLink
      to={item.path || "#"}
      className={`flex items-center px-4 py-2 hover:bg-gray-100 transition-colors ${
        isActive ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700"
      }`}
    >
      {item.icon && <span className="mr-3">{item.icon}</span>}
      <span>{item.label}</span>
    </NavLink>
  );
};

const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [care, setCare] = useState<CareEvent[]>([]);
  const [visits, setVisits] = useState<FamilyVisit[]>([]);
  const navigate = useNavigate();
  const role = "staff";

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      removeLocalStorage();
      navigate(path.signin);
    }
  };

  useEffect(() => {
    const storedCare = localStorage.getItem("careEvents");
    const storedVisits = localStorage.getItem("familyVisits");
    if (storedCare) setCare(JSON.parse(storedCare));
    if (storedVisits) setVisits(JSON.parse(storedVisits));
  }, []);

  useEffect(() => {
    localStorage.setItem("careEvents", JSON.stringify(care));
    localStorage.setItem("familyVisits", JSON.stringify(visits));
  }, [care, visits]);

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
          {staffMenu.map((item, index) => (
            <MenuItem key={index} item={item} />
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
