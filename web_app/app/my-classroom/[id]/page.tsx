"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Spinner,
  Button,
  Badge,
  Card,
  Modal,
  ModalHeader,
  ModalBody,
  Timeline,
  TimelineBody,
  TimelineContent,
  TimelineItem,
  TimelinePoint,
  TimelineTime,
  TimelineTitle,
} from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useClassroom,
  Classroom as ClassroomDetail,
} from "@/hooks/classroom/useClassroom";
import { useExamination, Examination } from "@/hooks/exam/useExamination";
import {
  ArrowLeftIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/sidebar";
import { PageUrl } from "@/configs/page.url";

type LeaveClassConfirmModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLeaving: boolean;
};

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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const studentId = user?.id;
  const classId = params.id as string;

  const handleLeaveClass = async () => {
    try {
      setLeaveLoading(true);
      const payload = {
        classId: classId,
        studentId: studentId!,
        enrolKey: classroom?.enrolKey,
      };
      await leaveClassroom(payload);
      setShowLeaveModal(false);
      router.push("/my-classroom");
    } catch (error) {
      console.error("Failed to leave class:", error);
      alert("Rời lớp học thất bại. Vui lòng thử lại sau.");
    } finally {
      setLeaveLoading(false);
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
            No class found
          </h2>
          <Button color="gray" onClick={() => router.back()}>
            Go Back
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
              <div className="border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
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
                      className="border border-gray-100 transition-all duration-300 hover:shadow-2xl dark:border-gray-700"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="line-clamp-2 text-lg font-bold text-gray-900 dark:text-white">
                            {exam.examName}
                          </h3>
                          {isActive && (
                            <span className="bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 uppercase">
                              Đang diễn ra
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 uppercase">
                              Sắp tới
                            </span>
                          )}
                          {isExpired && (
                            <span className="bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-700 uppercase">
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
                          className={`mt-4 w-full font-bold ${isActive ? "bg-[#1F4E79]" : "bg-gray-200 text-gray-500"}`}
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
              <div className="relative overflow-hidden border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 bg-linear-to-bl from-[#1F4E79]/10 to-transparent opacity-50 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 bg-linear-to-tr from-[#C9A24D]/10 to-transparent opacity-50 blur-3xl" />

                <div className="relative p-8 md:p-10">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Badge
                      color="info"
                      className="cursor-default px-3.5 py-1 text-xs font-bold uppercase tracking-widest"
                    >
                      {classroom.classCode}
                    </Badge>
                    <Badge
                      color="warning"
                      className="cursor-default border border-[#C9A24D]/30 px-3.5 py-1 text-xs font-semibold text-[#C9A24D] dark:border-[#C9A24D]/50 dark:!text-[#C9A24D]"
                    >
                      {classroom.semesterName}
                    </Badge>
                  </div>

                  <h1 className="mb-5 text-2xl leading-tight font-bold tracking-tight text-gray-900 md:text-3xl lg:text-4xl dark:text-white">
                    {classroom.className}
                  </h1>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      <span className="font-medium text-gray-500 dark:text-gray-500">Subject:</span>{" "}
                      {classroom.subject.subjectName}
                    </span>
                    <span>
                      <span className="font-medium text-gray-500 dark:text-gray-500">Semester:</span>{" "}
                      {classroom.semesterName}
                    </span>
                  </div>

                  <div className="mt-8 flex items-center gap-5 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="flex h-12 w-12 items-center justify-center bg-linear-to-br from-[#1F4E79] to-[#2A6BA3] text-xl font-bold text-white">
                      {classroom.lecturer.fullname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="mb-1 block text-[8px] font-black tracking-[0.25em] text-[#1F4E79] uppercase dark:text-[#C9A24D]">
                        Lecturer
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {classroom.lecturer.fullname}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="relative z-10 mb-8 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-2xl bg-green-400 ring-4 ring-green-400/20" />
                  Classroom Status
                </h3>

                <Timeline className="relative z-10 border-gray-200 dark:border-gray-600">
                  <TimelineItem>
                    <TimelinePoint className="border-0 bg-[#1F4E79]" />
                    <TimelineContent>
                      <TimelineTime className="text-gray-500 dark:text-gray-400">
                        {new Date(classroom.createdDate).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </TimelineTime>
                      <TimelineTitle className="text-gray-900 dark:text-gray-100">
                        Start Date
                      </TimelineTitle>
                      <TimelineBody className="text-gray-600 dark:text-gray-300">
                        The class started on this date.
                      </TimelineBody>
                    </TimelineContent>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelinePoint className="border-0 bg-[#C9A24D]" />
                    <TimelineContent>
                      <TimelineTime className="text-gray-500 dark:text-gray-400">
                        {new Date(classroom.endDate).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </TimelineTime>
                      <TimelineTitle className="text-gray-900 dark:text-gray-100">
                        End Date
                      </TimelineTitle>
                      <TimelineBody className="text-gray-600 dark:text-gray-300">
                        The class is expected to end on this date.
                      </TimelineBody>
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>

                <div className="group relative z-10 mt-12 cursor-default border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700">
                  <p className="text-sm leading-relaxed text-gray-600 italic dark:text-gray-300">
                    &quot;Chào mừng bạn đến với học phần **{classroom.className}
                    **. Chúc bạn có một kỳ học hiệu quả và đạt kết quả
                    cao!&quot;
                  </p>
                </div>
              </div>

              <Button
                color="red"
                onClick={() => setShowLeaveModal(true)}
                className="group w-full justify-center gap-3 py-4 font-bold cursor-pointer"
              >
                <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
                Leave Class
              </Button>

              <LeaveClassConfirmModal
                show={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                onConfirm={handleLeaveClass}
                isLeaving={leaveLoading}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 flex-grow p-4 lg:ml-64 lg:p-8">
        {/* Breadcrumb / Back Button */}
        <div className="mb-10">
          <Button
            color="light"
            onClick={() => router.push(PageUrl.MY_CLASSROOM_PAGE)}
            className="group inline-flex w-fit items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:bg-[#1F4E79] hover:text-white hover:border-[#1F4E79] dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900 dark:hover:border-[#C9A24D] cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            All classes
          </Button>
        </div>

        {renderTabContent()}
      </div>
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


function LeaveClassConfirmModal({
  show,
  onClose,
  onConfirm,
  isLeaving,
}: LeaveClassConfirmModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Confirm to move out of this class!
          </p>
          <div className="flex justify-end gap-4">
            <Button
              color="red"
              onClick={onConfirm}
              disabled={isLeaving}
              className="px-4 cursor-pointer"
            >
              {isLeaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              disabled={isLeaving}
              className="px-4 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}