"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Spinner, Button, Card } from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useClassroom,
  Classroom as ClassroomDetail,
} from "@/hooks/useClassroom";
import { useExamination, Examination } from "@/hooks/useExamination";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

function ClassroomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getClassroomById, leaveClassroom } = useClassroom();
  const { getExaminationsByClassId } = useExamination();
  const { user } = useAuth();

  const activeTab = searchParams.get("tab") || "overview";

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);

  const studentId = user?.id;
  const classId = params.id as string;

  const handleLeaveClass = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn rời lớp học này không?")) {
      return;
    }

    try {
      const payload = {
        classId: classId,
        studentId: studentId!,
        enrolKey: classroom?.enrolKey,
      };
      await leaveClassroom(payload);
      router.push("/my-classroom");
    } catch (error) {
      console.error("Failed to leave class:", error);
      alert("Rời lớp học thất bại. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    const fetchClassroomDetail = async () => {
      try {
        setLoading(true);
        const data = await getClassroomById(classId);
        if (data) {
          setClassroom(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && classId) {
      fetchClassroomDetail();
    }
  }, [getClassroomById, studentId, classId]);

  useEffect(() => {
    const fetchExaminations = async () => {
      if (activeTab === "exams" && classId) {
        try {
          setExamsLoading(true);
          const data = await getExaminationsByClassId(classId);
          setExaminations(data);
        } catch (error) {
          console.error("Failed to fetch exams:", error);
        } finally {
          setExamsLoading(false);
        }
      }
    };

    fetchExaminations();
  }, [getExaminationsByClassId, activeTab, classId]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-20 flex flex-grow items-center justify-center bg-gray-50 lg:ml-64 dark:bg-gray-900">
          <Spinner size="xl" color="info" />
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="container mx-auto ml-20 flex flex-grow flex-col items-center justify-center bg-gray-50 px-4 pt-24 pb-8 lg:ml-64 dark:bg-gray-900">
          <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">
            Không tìm thấy lớp học
          </h2>
          <Button color="gray" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "exams":
        return (
          <div className="space-y-6">
            <h2 className="mb-8 border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
              Bài Kiểm Tra
            </h2>

            {examsLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size="xl" />
              </div>
            ) : examinations.length === 0 ? (
              <div className="rounded-4xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="cursor-default font-medium text-gray-500">
                  Hiện tại chưa có bài kiểm tra nào cho lớp học này.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {examinations.map((exam) => {
                  const startDate = new Date(exam.startDatetime);
                  const endDate = new Date(exam.endDatetime);
                  const durationMinutes = Math.round(
                    (endDate.getTime() - startDate.getTime()) / 60000,
                  );
                  const isUpcoming = startDate > new Date();
                  const isExpired = endDate < new Date();
                  const isActive = !isUpcoming && !isExpired;

                  return (
                    <Card
                      key={exam.id}
                      className="rounded-3xl border border-gray-100 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-gray-700"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="line-clamp-2 text-lg font-bold text-gray-900 dark:text-white">
                            {exam.examName}
                          </h3>
                          {isActive && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 uppercase">
                              Đang diễn ra
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 uppercase">
                              Sắp tới
                            </span>
                          )}
                          {isExpired && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-700 uppercase">
                              Đã kết thúc
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm text-gray-500">
                          {exam.description ||
                            "Không có mô tả cho bài kiểm tra này."}
                        </p>
                        <div className="space-y-2 border-t border-gray-50 pt-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Bắt đầu:</span>
                            <span className="font-bold">
                              {startDate.toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span className="font-bold">
                              {durationMinutes} phút
                            </span>
                          </div>
                        </div>
                        <Button
                          className={`mt-4 w-full rounded-2xl font-bold ${isActive ? "bg-[#1F4E79]" : "bg-gray-200 text-gray-500"}`}
                          disabled={!isActive}
                        >
                          {isActive
                            ? "Làm bài ngay"
                            : isUpcoming
                              ? "Chưa mở"
                              : "Xem kết quả"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "materials":
        return (
          <div className="space-y-4 py-20 text-center">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              Tài Liệu
            </h2>
            <p className="text-gray-500">
              Tính năng đang được phát triển. Vui lòng quay lại sau!
            </p>
          </div>
        );

      case "assignments":
        return (
          <div className="space-y-4 py-20 text-center">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              Bài Tập
            </h2>
            <p className="text-gray-500">
              Tính năng đang được phát triển. Vui lòng quay lại sau!
            </p>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-linear-to-bl from-[#1F4E79]/10 to-transparent opacity-50 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-linear-to-tr from-[#C9A24D]/10 to-transparent opacity-50 blur-3xl" />

                <div className="relative p-8 md:p-10">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="-rotate-1 transform cursor-default rounded-xl bg-[#1F4E79] px-3.5 py-1.5 text-xs font-bold tracking-widest text-white uppercase shadow-md shadow-[#1F4E79]/20 transition-transform hover:rotate-0">
                      {classroom.classCode}
                    </div>
                    <div className="cursor-default rounded-xl border border-[#C9A24D]/30 px-3.5 py-1.5 text-xs font-semibold text-[#C9A24D] dark:border-[#C9A24D]/50">
                      {classroom.semesterName}
                    </div>
                  </div>

                  <h1 className="mb-5 text-2xl leading-tight font-bold tracking-tight text-gray-900 md:text-3xl lg:text-4xl dark:text-white">
                    {classroom.className}
                  </h1>

                  <div className="mt-8 flex items-center gap-5 rounded-3xl border border-gray-100 bg-gray-50/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#1F4E79] to-[#2A6BA3] text-xl font-bold text-white shadow-xl">
                      {classroom.lecturer.lecturerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="mb-1 block text-[8px] font-black tracking-[0.25em] text-[#1F4E79] uppercase dark:text-[#C9A24D]">
                        Giảng viên phụ trách
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {classroom.lecturer.lecturerName}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="group rounded-4xl border border-gray-100 bg-white p-8 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1F4E79] dark:bg-blue-900/20">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h4 className="mb-2 text-xs font-black tracking-widest text-gray-400 uppercase">
                    Thông tin môn học
                  </h4>
                  <p className="text-xl leading-relaxed font-bold text-gray-900 dark:text-white">
                    {classroom.subject.subjectName}
                  </p>
                </div>

                <div className="group rounded-4xl border border-gray-100 bg-white p-8 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-[#C9A24D] dark:bg-amber-900/20">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="mb-2 text-xs font-black tracking-widest text-gray-400 uppercase">
                    Học kỳ
                  </h4>
                  <p className="text-xl leading-relaxed font-bold text-gray-900 dark:text-white">
                    {classroom.semesterName}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-gray-900 to-gray-800 p-8 text-white shadow-2xl">
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />

                <h3 className="relative z-10 mb-8 flex items-center gap-2 text-lg font-bold">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 ring-4 ring-green-400/20" />
                  Trạng thái lớp học
                </h3>

                <div className="relative z-10 space-y-8 pl-2">
                  <div className="relative border-l-2 border-gray-700/50 pl-8">
                    <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full border-4 border-gray-800 bg-[#1F4E79] shadow-lg shadow-[#1F4E79]/40" />
                    <p className="mb-1 text-xs font-black tracking-widest text-gray-500 uppercase">
                      Ngày bắt đầu
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      {new Date(classroom.createdDate).toLocaleDateString(
                        "vi-VN",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>

                  <div className="relative border-l-2 border-gray-700/50 pl-8">
                    <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full border-4 border-gray-800 bg-[#C9A24D] shadow-lg shadow-[#C9A24D]/40" />
                    <p className="mb-1 text-xs font-black tracking-widest text-gray-500 uppercase">
                      Dự kiến kết thúc
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      {new Date(classroom.endDate).toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="group relative z-10 mt-12 cursor-default rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10">
                  <p className="text-sm leading-relaxed text-gray-300 italic">
                    &quot;Chào mừng bạn đến với học phần **{classroom.className}
                    **. Chúc bạn có một kỳ học hiệu quả và đạt kết quả
                    cao!&quot;
                  </p>
                </div>
              </div>

              <div className="rounded-4xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={handleLeaveClass}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 py-4 font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white dark:bg-red-900/10 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  <svg
                    className="h-5 w-5 transition-transform group-hover:rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Rời khỏi lớp học
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-20 flex-grow p-4 transition-all duration-300 lg:ml-64 lg:p-8">
        {/* Breadcrumb / Back Button */}
        <div className="mb-10">
          <Link
            href="/my-classroom"
            className="group flex w-fit items-center gap-3 rounded-full border border-gray-100 bg-white px-6 py-2.5 text-sm font-bold text-[#1F4E79] shadow-sm transition-all hover:bg-[#1F4E79] hover:text-white hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Tất cả lớp học
          </Link>
        </div>

        {renderTabContent()}
      </main>
    </div>
  );
}

export default function ClassroomDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ClassroomContent />
    </Suspense>
  );
}
