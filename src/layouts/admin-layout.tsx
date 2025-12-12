import React, { createContext, useContext } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import path from "@/constants/path";
import { removeLocalStorage } from "@/utils/local-storage";
import { adminMenu } from "@/constants/admin-menu";

export type AdminMenuItem = {
  path?: string;
  icon?: React.ReactNode;
  label?: string;
};

const MenuItem: React.FC<{ item: AdminMenuItem }> = ({ item }) => {
  const location = useLocation();

  const isExactActive = (pathToCheck: string | undefined) => {
    if (!pathToCheck) return false;
    const currentPath = location.pathname;

    if (pathToCheck.includes(":")) {
      const pattern = pathToCheck.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }

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

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      removeLocalStorage();
      navigate(path.adminLogin);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-white">
      {/* Sidebar FIXED */}
      <aside className="fixed left-0 top-0 rounded-lg w-64 bg-white/70 backdrop-blur border-r border-gray-300 h-screen overflow-y-auto pb-16">
        {/* Branding */}
        <div className="flex items-center justify-center px-4 py-6 border-b border-gray-300">
          <div className="text-3xl font-bold text-[#5985d8]">HeLiCare</div>
        </div>

        {/* Menu */}
        <nav className="mt-4">
          {adminMenu.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-300 bg-white">
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
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
