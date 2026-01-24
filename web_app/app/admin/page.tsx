"use client"

import { useEffect, useState } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"
import Link from "next/link"
import { Api } from "@/configs/api"
import useAxios from "@/hooks/useAxios"
import { useToast } from "@/hooks/useToast"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  bgColor: string
}

const StatCard = ({ title, value, icon, trend, bgColor }: StatCardProps) => {
  const { isDark } = useThemeContext()
  
  return (
    <div className={`rounded-xl p-6 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <h3 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>vs tháng trước</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg p-3 ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { isDark } = useThemeContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const stats = [
    {
      title: "Tổng số lớp học",
      value: "48",
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
        </svg>
      ),
      trend: { value: "12%", isPositive: true },
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Tổng số môn học",
      value: "24",
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      trend: { value: "8%", isPositive: true },
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Ngôn ngữ lập trình",
      value: "12",
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      ),
      trend: { value: "4%", isPositive: true },
      bgColor: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "Tổng số sinh viên",
      value: "1,234",
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      trend: { value: "18%", isPositive: true },
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
  ]

  const quickActions = [
    {
      title: "Quản lý lớp học",
      description: "Thêm, sửa, xóa lớp học",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
        </svg>
      ),
      href: "/admin/classes",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Quản lý môn học",
      description: "Thêm, sửa, xóa môn học",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      href: "/admin/subjects",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Quản lý ngôn ngữ",
      description: "Thêm, sửa, xóa ngôn ngữ lập trình",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      ),
      href: "/admin/programming-languages",
      color: "from-green-500 to-green-600"
    },
  ]

  const recentActivities = [
    { action: "Thêm lớp học mới", detail: "SE1801 - Software Engineering", time: "2 phút trước", type: "class" },
    { action: "Cập nhật môn học", detail: "PRJ301 - Java Web Application", time: "15 phút trước", type: "subject" },
    { action: "Thêm ngôn ngữ lập trình", detail: "Rust Programming", time: "1 giờ trước", type: "language" },
    { action: "Xóa lớp học", detail: "SE1701 - Expired", time: "2 giờ trước", type: "class" },
  ]

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Trang quản trị
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Chào mừng bạn đến với bảng điều khiển quản lý hệ thống
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`group relative overflow-hidden rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                }`}
              >
                <div className={`absolute inset-0 bg-linear-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className={`relative rounded-lg p-3 w-fit mb-4 bg-linear-to-br ${action.color}`}>
                  <div className="text-white">{action.icon}</div>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {action.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {action.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-500">
                  Truy cập
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Hoạt động gần đây
          </h2>
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
