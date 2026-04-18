"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { TextInput, Button } from "flowbite-react"
import { Skeleton } from "@/components/ui/skeletons"
import {
  IconAssignment,
  IconDue,
  IconGraded,
  IconNotification,
  IconSearch,
} from "@/components/svg-icons"
import { useAuth } from "@/contexts/AuthContext"
import type { Classroom } from "@/types/classroom"
import { useClassroom } from "@/hooks/classroom/useClassroom"
import { useNotification } from "@/hooks/notification/useNotification"
import { PageUrl } from "@/configs/page.url"
import { useRouter } from "next/navigation"
import { NotificationsSectionSkeleton, ClassroomListSkeleton } from "@/components/ui/skeletons"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const { user } = useAuth()
  const { getStudentClassrooms, getLecturerClassrooms, getRecentClassroomIds } = useClassroom()

  const {
    notifications,
    loading: loadingNotifications,
    error: notificationError,
    markAsRead,
  } = useNotification({ pageIndex: 1, pageSize: 10 })

  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const [classroomsError, setClassroomsError] = useState<string | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  const role = user?.role?.toUpperCase() ?? ""
  const isStudent = role === "STUDENT"
  const isLecturer = role === "LECTURER"
  const supportsRecentClassrooms = isStudent || isLecturer

  const classroomEntryBase = isLecturer
    ? PageUrl.MANAGE_CLASSROOM_PAGE
    : PageUrl.MY_CLASSROOM_PAGE

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoadingClassrooms(true)
      setClassroomsError(null)

      try {
        if (isStudent) {
          const result = await getStudentClassrooms(user.id)
          setClassrooms((result ?? []) as Classroom[])
        } else if (isLecturer) {
          const paged = await getLecturerClassrooms(user.id, 1, 100)
          setClassrooms((paged?.items ?? []) as Classroom[])
        } else {
          setClassrooms([])
        }
      } catch (e) {
        const err = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Failed to load classrooms"
        setClassroomsError(msg)
      } finally {
        setLoadingClassrooms(false)
      }
    }

    void load()
  }, [getStudentClassrooms, getLecturerClassrooms, user?.id, isStudent, isLecturer])

  useEffect(() => {
    const loadRecent = async () => {
      if (!user?.id || !supportsRecentClassrooms) return
      setLoadingRecent(true)
      try {
        const ids = await getRecentClassroomIds(user.id, 5)
        setRecentIds(ids ?? [])
      } catch {
        setRecentIds([])
      } finally {
        setLoadingRecent(false)
      }
    }
    void loadRecent()
  }, [getRecentClassroomIds, user?.id, supportsRecentClassrooms])

  const recentClassrooms = useMemo(() => {
    if (!recentIds.length || !classrooms.length) return []
    const byId = new Map(classrooms.map((c) => [c.id, c]))
    return recentIds
      .map((id) => byId.get(id))
      .filter((c): c is Classroom => c != null)
  }, [recentIds, classrooms])

  const filteredClassrooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return classrooms
    return classrooms.filter(
      (c) =>
        c.className?.toLowerCase().includes(q) ||
        c.classCode?.toLowerCase().includes(q) ||
        c.lecturer?.fullname?.toLowerCase().includes(q),
    )
  }, [classrooms, searchQuery])

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const base = isRead ? "text-gray-500" : "text-blue-600"
    switch (type) {
      case "NEW_PRACTICE":
        return <IconAssignment className={`w-5 h-5 ${base}`} />
      case "NEW_MATERIAL":
        return <IconDue className={`w-5 h-5 ${base}`} />
      case "NEW_EXAMINATION":
        return <IconGraded className={`w-5 h-5 ${base}`} />
      default:
        return <IconNotification className={`w-5 h-5 ${base}`} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header with Greeting */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hi, {user?.fullname ?? "there"}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back to the Edu-ACAS platform</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Notifications */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New notifications</h2>
            {loadingNotifications ? (
              <NotificationsSectionSkeleton />
            ) : notificationError ? (
              <div className="text-red-600 dark:text-red-400">{notificationError}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">You have no notifications.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (!notification.isRead) void markAsRead(notification.id)
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.isRead)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {!notification.isRead && (
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            Unread
                          </p>
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(notification.sentDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent classrooms</h2>
              <Button
                color="gray"
                className="px-4 py-2 font-medium text-sm"
                onClick={() => router.push(PageUrl.MY_CLASSROOM_PAGE)}
              >
                All classroom
              </Button>
            </div>

            {supportsRecentClassrooms &&
              (loadingRecent || recentClassrooms.length > 0) && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recently accessed
                </h3>
                {loadingRecent ? (
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-40 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {recentClassrooms.map((c) => (
                      <Link
                        key={c.id}
                        href={`${classroomEntryBase}/${c.id}`}
                        className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-[#1F4E79] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="truncate max-w-[12rem]">{c.className}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                          {c.classCode}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <TextInput
                placeholder="Search classes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button style={{ backgroundColor: "#1F4E79" }} className="!p-0 !px-4">
                <IconSearch className="w-5 h-5" />
              </Button>
            </div>

            {loadingClassrooms ? (
              <ClassroomListSkeleton />
            ) : classroomsError ? (
              <div className="text-red-600 dark:text-red-400">{classroomsError}</div>
            ) : filteredClassrooms.length > 0 ? (
              <div className="space-y-4">
                {filteredClassrooms.map((classroom, idx) => (
                  <div
                    key={classroom.id}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex h-32">
                      <div
                        className={[
                          "bg-indigo-600",
                          "bg-teal-600",
                          "bg-emerald-600",
                          "bg-orange-600",
                          "bg-sky-600",
                          "bg-purple-600",
                        ][idx % 6] + " w-32 flex-shrink-0 relative"
                        }
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold">
                            {classroom.classCode}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {classroom.className}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {classroom.lecturer?.fullname ?? ""}
                          </p>
                        </div>
                        <Link
                          href={`${classroomEntryBase}/${classroom.id}`}
                          className="inline-flex w-fit items-center justify-center rounded-lg px-6 py-2 text-sm font-medium text-white"
                          style={{ backgroundColor: "#1F4E79" }}
                        >
                          Enter class
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No matching classes found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
