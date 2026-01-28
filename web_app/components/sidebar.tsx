"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { isDark: isDarkMode, toggleTheme } = useThemeContext();
  const { logout, isLoggingOut } = useAuth();

  // Check if we are in a classroom detail page or related classroom subpage
  const isClassroomRoute = pathname.includes("/my-classroom/") || pathname.includes("/manage-room/");

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const DashboardIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );

  const ClassesIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );

  const AssignmentsIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
      <polyline
        points="14 2 14 8 20 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="11"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="9"
        y1="16"
        x2="15"
        y2="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const AnnouncementsIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 9h-2v2h2V9zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2zm8-15H3a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3zm0 17H3V3h18v17z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  const NotificationIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.34c.15-.12.19-.34.1-.51l-1.63-2.82c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.86-.58-1.35-.78L14.4 2.23c-.04-.25-.25-.43-.5-.43h-3.26c-.25 0-.46.18-.49.43l-.3 2.15c-.49.2-.93.47-1.35.78l-2.03-.81c-.23-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.44.1.51l1.72 1.34c-.05.3-.07.62-.07.94s.02.64.07.94L2.84 14.28c-.15.12-.19.34-.1.51l1.63 2.82c.12.22.37.29.59.22l2.03-.81c.42.32.86.58 1.35.78l.3 2.15c.03.25.24.43.49.43h3.26c.25 0 .46-.18.49-.43l.3-2.15c.49-.2.93-.47 1.35-.78l2.03.81c.23.09.47 0 .59-.22l1.63-2.82c.12-.22.07-.44-.1-.51l-1.72-1.34zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );

  const SunIcon = () => (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="5" />
      <line
        x1="12"
        y1="1"
        x2="12"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="12"
        y1="21"
        x2="12"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="4.22"
        y1="4.22"
        x2="5.64"
        y2="5.64"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="18.36"
        y1="18.36"
        x2="19.78"
        y2="19.78"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="1"
        y1="12"
        x2="3"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="21"
        y1="12"
        x2="23"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="4.22"
        y1="19.78"
        x2="5.64"
        y2="18.36"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="18.36"
        y1="5.64"
        x2="19.78"
        y2="4.22"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );

  const MoonIcon = () => (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  const defaultMenuItems = [
    { icon: DashboardIcon, label: "Dashboard", href: "/dashboard" },
    { icon: ClassesIcon, label: "Lớp học", href: "/my-classroom" },
    { icon: AssignmentsIcon, label: "Bài tập", href: "/assignments" },
    { icon: AnnouncementsIcon, label: "Thông báo", href: "/announcements" },
    { icon: UsersIcon, label: "Người dùng", href: "/users" },
  ];

  const classroomMenuItems = [
    {
      icon: ClassesIcon,
      label: "Tổng quan",
      href: `${pathname}?tab=overview`,
    },
    {
      icon: AssignmentsIcon,
      label: "Bài Kiểm Tra",
      href: `${pathname}?tab=exams`,
    },
    {
      icon: AssignmentsIcon,
      label: "Tài Liệu",
      href: `${pathname}?tab=materials`,
    },
    {
      icon: AssignmentsIcon,
      label: "Bài Tập",
      href: `${pathname}?tab=assignments`,
    },
  ];

  const adminMenuItems = [
    { icon: DashboardIcon, label: "Trang quản trị", href: "/admin" },
    { icon: ClassesIcon, label: "Quản lý lớp học", href: "/admin/classes" },
    { icon: AssignmentsIcon, label: "Quản lý môn học", href: "/admin/subjects" },
    { icon: () => (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>
    ), label: "Ngôn ngữ lập trình", href: "/admin/programming-languages" },
    { icon: UsersIcon, label: "Quản lý người dùng", href: "/admin/users" },
  ];

  // Determine which menu to show based on route
  const isAdminRoute = pathname.startsWith("/admin");
  const menuItems = isClassroomRoute ? classroomMenuItems : isAdminRoute ? adminMenuItems : defaultMenuItems;

  const settingsItems = [
    { icon: NotificationIcon, label: "Thông báo", href: "/notifications" },
    { icon: SettingsIcon, label: "Cài đặt", href: "/settings" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 flex h-screen flex-col transition-all duration-300 ${isExpanded ? "w-64" : "w-20"
        } ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"} border-r`}
    >
      {/* Logo */}
      <div
        className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex items-center p-4 ${isExpanded ? "justify-between" : "justify-center"}`}
      >
        {isExpanded ? (
          <>
            <div className="flex flex-1 justify-center">
              <img
                src="/images/Edu-ACAS logo.png"
                alt="Edu-ACAS Logo"
                className="h-16 w-20 object-contain"
              />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded p-1 transition-colors ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {"<<"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex w-full flex-col items-center gap-2`}
          >
            <img
              src="/images/Edu-ACAS logo.png"
              alt="Edu-ACAS Logo"
              className="h-16 w-16 object-contain"
            />
            <span
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {">>"}
            </span>
          </button>
        )}
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        {isExpanded && (
          <p
            className={`mb-3 text-xs font-semibold tracking-wider uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Main
          </p>
        )}
        <div className="mb-6 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isDarkMode
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <IconComponent />
                {isExpanded && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* SETTINGS Section */}
        {isExpanded && (
          <p
            className={`mb-3 text-xs font-semibold tracking-wider uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Settings
          </p>
        )}
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isDarkMode
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <IconComponent />
                {isExpanded && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Dark Mode Toggle & Logout */}
      <div
        className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} space-y-2 p-4`}
      >
        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isDarkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          {isDarkMode ? <MoonIcon /> : <SunIcon />}
          {isExpanded && (
            <span className="text-sm">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        {/* Logout Button */}
        {isExpanded ? (
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className={`w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              isDarkMode ? "text-gray-300 hover:bg-red-900/20" : "text-gray-700 hover:bg-red-50"
            } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <LogoutIcon />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        ) : (
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
              isDarkMode ? "text-gray-300 hover:bg-red-900/20" : "text-gray-700 hover:bg-red-50"
            } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <LogoutIcon />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
