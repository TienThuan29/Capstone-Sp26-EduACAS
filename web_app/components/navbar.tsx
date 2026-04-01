"use client"

import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  DarkThemeToggle,
  Button,
  Dropdown,
  Avatar,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { PageUrl } from "@/configs/page.url"
import {
  Squares2X2Icon,
  UserCircleIcon,
  ArrowRightEndOnRectangleIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline"
import { NotificationSection } from "@/components/notification-section"
import { useRoleValidator } from "@/hooks/authorization/useRoleValidation"

export default function HomeNavbar() {
  const pathname = usePathname()
  const { user, logout, isLoggedIn } = useAuth()
  const { showSuccess } = useToast()
  const { isAdmin, isLecturer, isStudent } = useRoleValidator(user);

  const handleLogout = () => {
    logout()
    showSuccess("Đăng xuất thành công")
  }

  const navLinks = [
    { href: PageUrl.HOME_PAGE, label: "Home" },
    { href: PageUrl.ABOUT_US_PAGE, label: "About Us" },
    { href: PageUrl.FEATURES_PAGE, label: "Features" },
    { href: PageUrl.CONTACT_PAGE, label: "Contact" },
  ]

  const studentNavLinks = [
    { href: PageUrl.HOME_PAGE, label: "My Dashboard" },
  ];

  return (
    <div className="fixed top-4 right-0 left-0 z-50 w-full px-4">
      <div className="relative mx-auto max-w-7xl overflow-visible rounded-full border border-white/30 bg-white/70 shadow-black/10 backdrop-blur-2xl backdrop-saturate-150 dark:border-gray-600/40 dark:bg-gray-800/70 dark:shadow-black/40">
        {/* Glass overlay gradient */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/20 to-transparent dark:from-gray-700/30 dark:to-transparent"></div>
        <Navbar fluid className="relative rounded-full bg-transparent px-6 py-2">
          <NavbarBrand as={Link} href="/" className="mr-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center rounded-full p-1">
                <Image
                  src="/logo-single.png"
                  alt="Edu-ACAS Logo"
                  width={28}
                  height={24}
                  className="h-full w-full"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="self-center text-lg font-bold whitespace-nowrap text-gray-900 dark:text-white">
                  Edu-ACAS
                </span>
              </div>
            </div>
          </NavbarBrand>
          <NavbarCollapse className="mt-0!">
            {navLinks.map((link) => (
              <NavbarLink
                key={link.href}
                as={Link}
                href={link.href}
                active={pathname === link.href}
                className={`rounded-full transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-[#1F4E79] px-10 py-4 font-bold text-black dark:bg-[#C9A24D]"
                    : "px-4 py-2 font-bold text-gray-700 hover:bg-gray-100 hover:text-[#1F4E79] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-[#C9A24D]"
                }`}
              >
                {link.label}
              </NavbarLink>
            ))}
            <div className="mt-4 border-t border-gray-200/50 pt-4 lg:hidden dark:border-gray-700/50">
              <DarkThemeToggle />
            </div>
          </NavbarCollapse>
          <div className="flex items-center gap-3">
            <DarkThemeToggle className="hidden lg:flex" />
            <NavbarToggle className="lg:hidden" />
            {isLoggedIn() && user ? (
              <>
                <NotificationSection />
                <Dropdown
                  inline
                  placement="bottom-end"
                  theme={{
                    floating: {
                      base: "z-[100] w-fit divide-y divide-gray-100 rounded-lg shadow focus:outline-none border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700",
                    },
                  }}
                  label={
                    <div className="flex items-center gap-2 cursor-pointer">
                    {user.avatarUrl ? (
                      <Avatar
                        rounded
                        img={user.avatarUrl}
                        alt="User avatar"
                        className="ring-2 ring-[#1F4E79]/20 dark:ring-[#C9A24D]/30"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm ring-2 ring-[#1F4E79]/20 dark:ring-[#C9A24D]/30"
                        style={{
                          background: "linear-gradient(135deg, #1F4E79 0%, #C9A24D 100%)",
                        }}
                      >
                        {user.fullname?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.fullname}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role}
                      </span>
                    </div>
                  </div>
                }
              >
                <DropdownHeader>
                  <span className="block text-sm">{user.fullname}</span>
                  <span className="block truncate text-sm font-medium">
                    {user.email}
                  </span>
                </DropdownHeader>
                {
                  isStudent && (
                    <>
                      <DropdownItem as={Link} href={PageUrl.DEFAULT_PAGE}>
                        <span className="flex items-center gap-2">
                          <Squares2X2Icon className="h-4 w-4" />
                          My Dashboard
                        </span>
                      </DropdownItem>
                      <DropdownItem as={Link} href={PageUrl.MY_CLASSROOM_PAGE}>
                        <span className="flex items-center gap-2">
                          <AcademicCapIcon className="h-4 w-4" />
                          My Classroom
                        </span>
                      </DropdownItem>
                    </>
                  )
                }
                {
                  isLecturer && (
                    <>
                      <DropdownItem as={Link} href={PageUrl.MANAGE_CLASSROOM_PAGE}>
                        <span className="flex items-center gap-2">
                          <Squares2X2Icon className="h-4 w-4" />
                          My classes
                        </span>
                      </DropdownItem>
                      <DropdownItem as={Link} href={PageUrl.QUESTION_BANKS_PAGE}>
                        <span className="flex items-center gap-2">
                          <QuestionMarkCircleIcon className="h-4 w-4" />
                          Problem Banks
                        </span>
                      </DropdownItem>
                      <DropdownItem as={Link} href={PageUrl.QUESTION_BANK_PAGE}>
                        <span className="flex items-center gap-2">
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                          Question Banks
                        </span>
                      </DropdownItem>
                      <DropdownItem as={Link} href={PageUrl.QUIZ_BANK_PAGE}>
                        <span className="flex items-center gap-2">
                          <BanknotesIcon className="h-4 w-4" />
                          Quiz Banks
                        </span>
                      </DropdownItem>
                    </>
                  )
                }
                {
                  isAdmin && (
                    <DropdownItem as={Link} href={PageUrl.ADMIN_PAGE}>
                      <span className="flex items-center gap-2">
                        <Squares2X2Icon className="h-4 w-4" />
                        Admin Dashboard
                      </span>
                    </DropdownItem>
                  )
                }
                <DropdownItem as={Link} href="/profile">
                  <span className="flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4" />
                    User profile
                  </span>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightEndOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </span>
                </DropdownItem>
              </Dropdown>
              </>
            ) : (
              <>
                <Button
                  className="hidden cursor-pointer rounded-full border-0 bg-transparent text-[#1F4E79] hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 sm:flex"
                  as={Link}
                  href="/login"
                >
                  Sign in
                </Button>
                <Button
                  className="hidden cursor-pointer rounded-full border-0 bg-linear-to-r from-[#1F4E79] to-[#C9A24D] text-white shadow-[#1F4E79]/30 hover:from-[#1F4E79]/90 hover:to-[#C9A24D]/90 sm:flex dark:shadow-[#1F4E79]/20"
                  as={Link}
                  href={PageUrl.REGISTER_PAGE}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </Navbar>
      </div>
    </div>
  )
}
