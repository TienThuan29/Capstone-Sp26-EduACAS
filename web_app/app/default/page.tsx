"use client"

import { useState } from "react"
import { TextInput, Button } from "flowbite-react"
import { IconAssignment, IconDue, IconGraded, IconNotification, IconSearch } from "@/components/svg-icons"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data - các lớp học
  const courses = [
    {
      id: 1,
      code: "SWC101",
      name: "Microservices với Spring Cloud",
      instructor: "Nguyễn Ngọc Lâm",
      color: "bg-gradient-to-br from-gray-400 to-gray-600",
      badge: "SWC101",
    },
    {
      id: 2,
      code: "SWA201",
      name: "Integrate single-page-application với Spring Boot",
      instructor: "Nguyễn Ngọc Lâm",
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      badge: "SWA201",
    },
    {
      id: 3,
      code: "SWH202",
      name: "Software Architecture and Design",
      instructor: "Nguyễn Ngọc Lâm",
      color: "bg-gradient-to-br from-red-400 to-red-600",
      badge: "SWH202",
    },
  ]

  // Updated mock data - thông báo
  const notifications = [
    {
      id: 1,
      course: "SWC101 - Microservices với Spring Cloud",
      title: "Cập nhật bài tập: REST API Design",
      time: "2 giờ trước",
      type: "assignment",
    },
    {
      id: 2,
      course: "SWA201 - Integrate single-page-application",
      title: "Cập nhật bài tập: Angular Forms",
      time: "4 giờ trước",
      type: "assignment",
    },
    {
      id: 3,
      course: "SWH202 - Software Architecture and Design",
      title: "Cập nhật bài tập: Design Patterns",
      time: "1 ngày trước",
      type: "assignment",
    },
    {
      id: 4,
      course: "SWC101 - Microservices với Spring Cloud",
      title: "Có bài tập mới cần nộp",
      time: "3 giờ trước",
      type: "due",
    },
    {
      id: 5,
      course: "SWA201 - Integrate single-page-application",
      title: "Bạn được chấm điểm cho bài tập: Component Lifecycle",
      time: "5 giờ trước",
      type: "graded",
    },
  ]

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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Greeting */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Hi, Khoi!</h1>
          <p className="text-gray-600 mt-1">Chào mừng bạn trở lại nền tảng Edu-ACAS</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Notifications */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông báo mới</h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="text-xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{notification.course}</p>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</h4>
                      <p className="text-xs text-gray-400">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lớp học của tôi</h2>
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm">
                Tất cả lớp học
              </button>
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
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600">{course.instructor}</p>
                        </div>
                        <button
                          className="w-fit px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90 text-sm"
                          style={{ backgroundColor: "#1F4E79" }}
                        >
                          Vào lớp học
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 text-lg">Không tìm thấy lớp học phù hợp</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
