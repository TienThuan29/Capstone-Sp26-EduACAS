"use client"

import { useState } from "react"
import { TextInput, Button } from "flowbite-react"
import { IconAssignment, IconDue, IconGraded, IconNotification, IconSearch } from "@/components/svg-icons"
import { courses, notifications } from "@/MockData/defaultPageData"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <IconAssignment className="w-5 h-5 text-gray-600" />
      case "due":
        return <IconDue className="w-5 h-5 text-orange-500" />
      case "graded":
        return <IconGraded className="w-5 h-5 text-green-500" />
      default:
        return <IconNotification className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header with Greeting */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hi, Khoi!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Chào mừng bạn trở lại nền tảng Edu-ACAS</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Notifications */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Thông báo mới</h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="text-xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{notification.course}</p>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{notification.title}</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lớp học của tôi</h2>
              <Button
                color="gray"
                className="px-4 py-2 font-medium text-sm"
              >
                Tất cả lớp học
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <TextInput
                placeholder="Tìm kiếm lớp học"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button style={{ backgroundColor: "#1F4E79" }} className="!p-0 !px-4">
                <IconSearch className="w-5 h-5" />
              </Button>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex h-32">
                      <div className={`${course.color} w-32 flex-shrink-0 relative`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold">
                            {course.badge}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{course.instructor}</p>
                        </div>
                        <Button
                          className="w-fit px-6 py-2 font-medium text-sm"
                          style={{ backgroundColor: "#1F4E79" }}
                        >
                          Vào lớp học
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Không tìm thấy lớp học phù hợp</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
