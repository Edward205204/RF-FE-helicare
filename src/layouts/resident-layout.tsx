import React, { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LucideIcon, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui";
import { Separator } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppContext } from "@/contexts/app.context";
import pathConst from "@/constants/path";
import { removeLocalStorage } from "@/utils/local-storage";
import { residentMenu } from "@/constants/resident-menu";

export type ResidentMenuItem = {
  path: string;
  icon: LucideIcon;
  label: string;
};

const ResidentLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);
  const { profile } = useContext(AppContext);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      removeLocalStorage();
      navigate(pathConst.signin);
    }
  };

  // Lấy tên từ profile
  const residentName =
    (profile as any)?.resident?.full_name ||
    (profile as any)?.email?.split("@")[0] ||
    "Resident";

  // Lấy initials từ tên
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-sm border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 text-center">
          <h1 className="text-lg font-bold text-[#5985d8] mb-4">HeLiCare</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center space-x-4 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(residentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {residentName}
                  </p>
                  <p className="text-xs text-gray-500">Resident</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 border-gray-200">
              <DropdownMenuItem
                onClick={() => navigate(pathConst.residentChangePassword)}
                className="cursor-pointer"
              >
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {residentMenu.map(({ path, label, icon: Icon }) => {
            const isNotification = path === pathConst.residentNotification;
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 p-4">
          <Button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">HeLiCare</h1>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Routed pages */}
        <section className="flex-1 overflow-y-auto">{children}</section>
      </main>
    </div>
  );
};

export default ResidentLayout;
