"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, Spinner, Button } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import useAxios from "@/hooks/useAxios"
import { Api } from "@/configs/api"
import Link from "next/link"

interface ClassroomDetail {
  id: string;
  classCode: string;
  className: string;
  lecturerId: string;
  subjectId: string;
  semesterName: string;
  enrolKey: string;
  createdDate: string;
  updatedDate: string | null;
  endDate: string;
  isDeleted: boolean;
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const axiosInstance = useAxios();
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder Student ID (as requested)
  const studentId = "6208c99e-601a-4550-a1d7-da3413fe852b";
  const classId = params.id as string;

  useEffect(() => {
    const fetchClassroomDetail = async () => {
      try {
        setLoading(true);
        // API: /api/acas/v1/classrooms/student/{studentid}/class/{classid}
        // Utilizing the existing base endpoint constant if possible, or constructing the full path
        const response = await axiosInstance.get(`${Api.Classroom.GET_STUDENT_CLASSROOMS}/${studentId}/class/${classId}`);
        
        if (response.data && response.data.dataResponse) {
          setClassroom(response.data.dataResponse);
        }
      } catch (error) {
        console.error("Failed to fetch classroom detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && classId) {
      fetchClassroomDetail();
    }
  }, [axiosInstance, studentId, classId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <HomeNavbar />
        <div className="flex-grow flex justify-center items-center">
          <Spinner size="xl" color="info" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex flex-col">
        <HomeNavbar />
        <div className="flex-grow container mx-auto px-4 pt-24 pb-8 flex flex-col items-center justify-center">
             <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Không tìm thấy lớp học</h2>
             <Button color="gray" onClick={() => router.back()}>Quay lại</Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <HomeNavbar />

      <main className="flex-grow container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Breadcrumb / Back Button */}
        <div className="mb-6">
            <Link href="/list-myclassroom" className="text-[#1F4E79] dark:text-[#C9A24D] hover:underline flex items-center gap-2 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại danh sách
            </Link>
        </div>

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] p-8 flex items-end">
                <h1 className="text-4xl font-bold text-white shadow-sm">{classroom.className}</h1>
            </div>
            <div className="p-8">
                <div className="flex flex-wrap gap-4 items-center text-sm mb-6">
                    <span className="px-3 py-1 bg-[#F5F7FA] dark:bg-gray-700 rounded-full font-bold text-[#1F4E79] dark:text-[#C9A24D] border border-gray-200 dark:border-gray-600">
                        {classroom.classCode}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {classroom.semesterName}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        GV: {classroom.lecturerId}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Info Card column 1 */}
                    <div className="space-y-4">
                         <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Môn học</h3>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">{classroom.subjectId}</p>
                         </div>
                    </div>

                    {/* Info Card column 2 */}
                    <div className="space-y-4">
                         <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu</h3>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {new Date(classroom.createdDate).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                         </div>
                         <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngày kết thúc</h3>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {new Date(classroom.endDate).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                         </div>
                    </div>
                </div>

                {/* Additional Actions */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                    <Button color="blue" className="bg-[#1F4E79] enabled:hover:bg-[#163A5C]">
                        Truy cập bài tập
                    </Button>
                    <Button color="gray" outline>
                        Xem danh sách thành viên
                    </Button>
                </div>
            </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
