"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { PageUrl } from "@/configs/page.url";
import { Button, Modal, ModalHeader, ModalBody } from "flowbite-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  AcademicCapIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  UsersIcon,
  CodeBracketSquareIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Constant } from "@/configs/constant";
import { useRoleValidator } from "@/hooks/authorization/useRoleValidation";

type LogoutConfirmModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
};

const Sidebar = () => {
  const pathname = usePathname();
  const { isExpanded, toggleExpanded } = useSidebar();
  const { user } = useAuth();
  const { isAdmin, isLecturer, isStudent } = useRoleValidator(user);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isDark: isDarkMode, toggleTheme } = useThemeContext();
  const { logout, isLoggingOut } = useAuth();

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Check if we are in a classroom detail page or related classroom subpage
  const isClassroomRoute = pathname.includes("/my-classroom/") || pathname.includes("/manage-classroom/");

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const studentMenuItems = [
    { icon: Squares2X2Icon, label: "Dashboard", href: PageUrl.DASHBOARD_PAGE },
    { icon: AcademicCapIcon, label: "Classrooms", href: PageUrl.MY_CLASSROOM_PAGE },
    // { icon: DocumentTextIcon, label: "Assignments", href: PageUrl.ASSIGNMENTS_PAGE },
    { icon: MegaphoneIcon, label: "Announcements", href: PageUrl.ANNOUNCEMENTS_PAGE },
  ];

  const lecturerMenuItems = [
    { icon: AcademicCapIcon, label: "Overview", href: "#" },
    { icon: Squares2X2Icon, label: "Dashboard", href: PageUrl.DASHBOARD_PAGE },
    { icon: AcademicCapIcon, label: "Manage Students", href: PageUrl.MANAGE_CLASSROOM_PAGE },
    { icon: DocumentTextIcon, label: "Manage Assignments", href: PageUrl.ASSIGNMENTS_PAGE },
  ];

  const adminMenuItems = [
    { icon: Squares2X2Icon, label: "Admin Dashboard", href: PageUrl.ADMIN_PAGE },
    { icon: AcademicCapIcon, label: "Manage Classrooms", href: PageUrl.ADMIN_CLASSES_PAGE },
    { icon: BookOpenIcon, label: "Manage Subjects", href: PageUrl.ADMIN_SUBJECTS_PAGE },
    { icon: CodeBracketSquareIcon, label: "Manage Programming Languages", href: PageUrl.ADMIN_PROGRAMMING_LANGUAGES_PAGE },
    { icon: UsersIcon, label: "Manage Users", href: PageUrl.ADMIN_USERS_PAGE },
  ];

  const classroomMenuItems = [
    { icon: AcademicCapIcon, label: "Overview", href: `${pathname}?tab=overview` },
    { icon: ClipboardDocumentListIcon, label: "Exams", href: `${pathname}?tab=exams` },
    { icon: BookOpenIcon, label: "Materials", href: `${pathname}?tab=materials` },
    { icon: PencilSquareIcon, label: "Assignments", href: `${pathname}?tab=assignments` },
  ];

  const settingsItems = [
    { icon: UsersIcon, label: "Profile", href: "#" },
      { icon: BellIcon, label: "Notifications", href: "#" },
      { icon: Cog6ToothIcon, label: "Settings", href: "#" },
  ];

  // Determine which menu to show based on role and route. All roles have settingsItems.
  let menuItems = studentMenuItems;
  if (isAdmin) {
    menuItems = adminMenuItems;
  }
  else if (isLecturer) {
    menuItems = lecturerMenuItems;
  }
  else if (isStudent) {
    menuItems = isClassroomRoute ? classroomMenuItems : studentMenuItems;
  }
  else {
    menuItems = isClassroomRoute ? classroomMenuItems : studentMenuItems;
  }

  return (
    <aside
      className={`fixed top-0 left-0 flex h-screen flex-col transition-all duration-300 ${isExpanded ? "w-64" : "w-20"
        } ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} border-r`}
    >
      {/* Logo */}
      <div
        className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex items-center p-4 ${isExpanded ? "justify-between" : "justify-center"}`}
      >
        {isExpanded ? (
          <>
            <div className="flex flex-1 justify-center">
              <Link href={PageUrl.HOME_PAGE} className="block" prefetch={false}>
                <Image
                  src="/images/EduACAS-2-trans.png"
                  alt="Edu-ACAS Logo"
                  width={142}
                  height={64}
                  className="object-contain cursor-pointer"
                />
              </Link>
            </div>
            <button
              onClick={toggleExpanded}
              className={`rounded p-1 transition-colors ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className={`flex w-full flex-col items-center gap-2`}>
            <Link href={PageUrl.HOME_PAGE} className="block" prefetch={false}>
              <Image
                src="/images/EduACAS-single.png"
                alt="Edu-ACAS Logo"
                width={64}
                height={64}
                className="object-contain cursor-pointer"
              />
            </Link>
            <button
              onClick={toggleExpanded}
              className={`rounded p-1 transition-colors ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        {isExpanded && (
          <p
            className={`mb-3 text-xs font-semibold tracking-wider uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Main Menu
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
                <IconComponent className="h-5 w-5 shrink-0" />
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
                <IconComponent className="h-5 w-5 shrink-0" />
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
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer ${isDarkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          {isDarkMode ? <MoonIcon className="h-5 w-5 shrink-0" /> : <SunIcon className="h-5 w-5 shrink-0" />}
          {isExpanded && (
            <span className="text-sm">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        {/* Logout Button */}
        {isExpanded ? (
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className={`w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer ${
              isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"
            } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ArrowRightEndOnRectangleIcon className="h-5 w-5 shrink-0" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className={`w-full flex justify-center p-2 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"
            } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ArrowRightEndOnRectangleIcon className="h-5 w-5 shrink-0" />
          </button>
        )}
      </div>

      <LogoutConfirmModal
        show={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isLoggingOut={isLoggingOut}
      />
    </aside>
  );
};

export default Sidebar;


const LogoutConfirmModal = ({ show, onClose, onConfirm, isLoggingOut }: LogoutConfirmModalProps) => (
  <Modal show={show} size="md" onClose={onClose} popup>
    <ModalHeader />
    <ModalBody>
      <div className="text-center">
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end gap-4">
          <Button color="red" onClick={onConfirm} disabled={isLoggingOut} className="px-4 cursor-pointer">
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
          <Button color="failure" onClick={onClose} className="px-4 cursor-pointer">
            Cancel
          </Button>
        </div>
      </div>
    </ModalBody>
  </Modal>
);
