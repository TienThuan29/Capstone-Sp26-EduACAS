"use client"

import { useEffect, useState } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import Link from "next/link"
import { Api } from "@/configs/api"
import { Constant } from "@/configs/constant"
import useAxios from "@/hooks/useAxios"
import { useToast } from "@/hooks/useToast"
import { Card, Badge } from "flowbite-react"
import {
  AcademicCapIcon,
  BellIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  UsersIcon,
  UserGroupIcon,
  UserPlusIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid"
import { PageUrl } from "@/configs/page.url"

type AccentKey = "blue" | "purple" | "green" | "orange" | "pink" | "gray"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  accent: AccentKey
}

const accentStyles: Record<AccentKey, { border: string; iconBg: string; iconColor: string }> = {
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  green: {
    border: "border-l-green-500",
    iconBg: "bg-green-50 dark:bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
  },
  orange: {
    border: "border-l-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  pink: {
    border: "border-l-pink-500",
    iconBg: "bg-pink-50 dark:bg-pink-500/10",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  gray: {
    border: "border-l-gray-500",
    iconBg: "bg-gray-50 dark:bg-gray-500/10",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
}

const StatCard = ({ title, value, icon, accent }: StatCardProps) => {
  const { isDark } = useThemeContext()
  const style = accentStyles[accent] ?? accentStyles.gray

  return (
    <div
      className={`
        overflow-hidden rounded-xl border border-gray-200 bg-white
        dark:border-gray-700 dark:bg-gray-800
        border-l-4 ${style.border}
        transition-colors
      `}
    >
      <div className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {title}
          </p>
          <p
            className={`mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { isDark } = useThemeContext()
  const axiosInstance = useAxios()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    classrooms: 0,
    subjects: 0,
    programmingLanguages: 0,
    students: 0,
    teachers: 0
  })

  useEffect(() => {
    setMounted(true)
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [classroomsRes, subjectsRes, languagesRes, usersRes] = await Promise.all([
        axiosInstance.get(Api.Classroom.GET_ALL_CLASSROOMS),
        axiosInstance.get(Api.Subject.GET_ALL),
        axiosInstance.get(Api.ProgrammingLanguage.GET_ALL),
        axiosInstance.get(Api.User.GET_ALL)
      ])

      type UserWithRole = { role: string }
      const users: UserWithRole[] = usersRes.data?.dataResponse ?? []
      const students = users.filter((u) => u.role === Constant.ROLES.STUDENT).length
      const teachers = users.filter((u) => u.role === Constant.ROLES.LECTURER).length

      setStats({
        classrooms: classroomsRes.data?.dataResponse?.length || 0,
        subjects: subjectsRes.data?.dataResponse?.length || 0,
        programmingLanguages: languagesRes.data?.dataResponse?.length || 0,
        students,
        teachers
      })
    } catch {
      toast.showError('Không thể tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const statsData = [
    {
      title: "Tổng số lớp học",
      value: loading ? "..." : stats.classrooms.toString(),
      icon: <AcademicCapIcon className="h-6 w-6" />,
      accent: "blue" as const,
    },
    {
      title: "Tổng số môn học",
      value: loading ? "..." : stats.subjects.toString(),
      icon: <BookOpenIcon className="h-6 w-6" />,
      accent: "purple" as const,
    },
    {
      title: "Ngôn ngữ lập trình",
      value: loading ? "..." : stats.programmingLanguages.toString(),
      icon: <CodeBracketIcon className="h-6 w-6" />,
      accent: "green" as const,
    },
    {
      title: "Tổng số sinh viên",
      value: loading ? "..." : stats.students.toLocaleString("vi-VN"),
      icon: <UserGroupIcon className="h-6 w-6" />,
      accent: "orange" as const,
    },
    {
      title: "Tổng số giảng viên",
      value: loading ? "..." : stats.teachers.toLocaleString("vi-VN"),
      icon: <UserPlusIcon className="h-6 w-6" />,
      accent: "pink" as const,
    },
  ]

  const quickActions = [
    {
      title: "Manage Classrooms",
      description: "Add, edit, delete classroom",
      icon: <AcademicCapIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_CLASSES_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Subjects",
      description: "Add, edit, delete subject",
      icon: <BookOpenIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_SUBJECTS_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Programming Languages",
      description: "Add, edit, delete programming language",
      icon: <CodeBracketIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_PROGRAMMING_LANGUAGES_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: <UsersIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_USERS_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Notifications",
      description: "Create and manage notifications",
      icon: <BellIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_NOTIFICATIONS_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Discussions",
      description: "Review and moderate discussions",
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_DISCUSSIONS_PAGE,
      accent: "gray" as const,
    },
    {
      title: "Manage Materials",
      description: "Manage learning materials",
      icon: <BookOpenIcon className="h-5 w-5" />,
      href: PageUrl.ADMIN_MATERIALS_PAGE,
      accent: "gray" as const,
    },
  ]

  const recentActivities = [
    { action: "Add new classroom", detail: "SE1801 - Software Engineering", time: "2 minutes ago", type: "class" },
    { action: "Update subject", detail: "PRJ301 - Java Web Application", time: "15 minutes ago", type: "subject" },
    { action: "Add new programming language", detail: "Rust Programming", time: "1 hour ago", type: "language" },
    { action: "Delete classroom", detail: "SE1701 - Expired", time: "2 hours ago", type: "class" },
  ]

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Dashboard
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome to the admin dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Overview
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statsData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action, index) => {
              const style = accentStyles[action.accent] ?? accentStyles.gray
              return (
                <Link key={index} href={action.href}>
                  <div
                    className={`
                      group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4
                      transition-colors hover:border-gray-300
                      dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600
                      border-l-4 ${style.border}
                    `}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconColor}`}>
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {action.title}
                      </h3>
                      <p className={`mt-0.5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {action.description}
                      </p>
                    </div>
                    <ArrowRightIcon className={`h-5 w-5 shrink-0 ${isDark ? "text-gray-500 group-hover:text-gray-400" : "text-gray-400 group-hover:text-gray-600"}`} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent Activities */}
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Activities
          </h2>
          <Card className="rounded-xl">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentActivities.map((activity, index) => (
                <div key={index} className={`p-4 hover:bg-opacity-50 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-2 ${
                        activity.type === 'class' ? 'bg-blue-100 dark:bg-blue-900' :
                        activity.type === 'subject' ? 'bg-purple-100 dark:bg-purple-900' :
                        'bg-green-100 dark:bg-green-900'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'class' ? 'bg-blue-500' :
                          activity.type === 'subject' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`}></div>
                      </div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {activity.action}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.detail}
                        </p>
                      </div>
                    </div>
                    <Badge color="gray" className="text-sm">
                      {activity.time}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
