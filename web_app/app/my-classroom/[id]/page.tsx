"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import type { Classroom as ClassroomDetail } from "@/types/classroom";
import { useExamination } from "@/hooks/examination/useExamination";
import type { Examination } from "@/types/examination";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/sidebar";
import { PageUrl } from "@/configs/page.url";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import {
  ExamsTab,
  MaterialsTab,
  // AssignmentsTab,
  PractiseTab,
  OverviewTab,
  SlotTab,
  DiscussionTab,
  StudentDashboardTab,
  QuizzesTab,
} from "@/app/my-classroom/tabs";
import { ClassroomDetailPageSkeleton } from "@/components/ui/skeletons";

function ClassroomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getClassroomById, leaveClassroom, recordClassroomAccess } = useClassroom();
  const { getExaminationsByClassIdAndMode } = useExamination();
  const { user } = useAuth();

  const activeTab = searchParams.get("tab") || "overview";

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [practiseExaminations, setPractiseExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);
  const [practiseLoading, setPractiseLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [quizDetailBack, setQuizDetailBack] = useState<(() => void) | null>(null);

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
      alert("Failed to leave class. Please try again later.");
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

  // useEffect(() => {
  //   if (!studentId || !classId || !classroom?.id) return;
  //   if (user?.role?.toUpperCase() !== "STUDENT") return;
  //   void recordClassroomAccess(studentId, classId).catch(() => {
  //     /* non-blocking; Redis may be unavailable */
  //   });
  // }, [studentId, classId, classroom?.id, user?.role, recordClassroomAccess]);

  useEffect(() => {
    const fetchExaminations = async () => {
      if (activeTab === "exams" && classId) {
        try {
          setExamsLoading(true);
          const data = await getExaminationsByClassIdAndMode(classId, "EXAMINATION");
          setExaminations(data);
        } catch (error) {
          console.error("Failed to fetch examinations:", error);
        } finally {
          setExamsLoading(false);
        }
      }

      if (activeTab === "practise" && classId) {
        try {
          setPractiseLoading(true);
          const data = await getExaminationsByClassIdAndMode(classId, "PRACTICAL");
          setPractiseExaminations(data);
        } catch (error) {
          console.error("Failed to fetch practise examinations:", error);
        } finally {
          setPractiseLoading(false);
        }
      }
    };

    fetchExaminations();
  }, [getExaminationsByClassIdAndMode, activeTab, classId]);

  if (loading) {
    return <ClassroomDetailPageSkeleton />;
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
          <ExamsTab
            examinations={examinations}
            examsLoading={examsLoading}
            classId={classId}
          />
        );
      case "materials":
        return <MaterialsTab classId={classId} />;
      // case "assignments":
      //   return <AssignmentsTab />;
      case "practise":
        return (
          <PractiseTab
            examinations={practiseExaminations}
            practiseLoading={practiseLoading}
            classId={classId}
          />
        );
      case "slots":
        return <SlotTab />;
      case "quizzes":
        return (
          <QuizzesTab
            classId={classId}
            setQuizDetailBack={setQuizDetailBack}
          />
        );
      case "discussion":
        return (
          <DiscussionTab
            classId={classId}
            hideBackButton={!!searchParams.get("issue")}
          />
        );
      case "dashboard":
        return (
          <StudentDashboardTab
            classroomId={classId}
            classroomName={classroom.className}
            studentId={studentId}
          />
        );
      default:
        return (
          <OverviewTab
            classroom={classroom}
            showLeaveModal={showLeaveModal}
            onOpenLeaveModal={() => setShowLeaveModal(true)}
            onCloseLeaveModal={() => setShowLeaveModal(false)}
            onConfirmLeave={handleLeaveClass}
            isLeaving={leaveLoading}
          />
        );
    }
  };

  const isDiscussionDetail =
    activeTab === "discussion" && searchParams.get("issue");

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 flex-grow p-4 lg:ml-64 lg:p-8">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <DefaultOutlineCustomButton
            label="All classes"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push(PageUrl.MY_CLASSROOM_PAGE)}
            className="group inline-flex w-fit cursor-pointer items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
          />
          {isDiscussionDetail && (
            <DefaultOutlineCustomButton
              label="Back to list"
              icon={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={() =>
                router.replace(`/my-classroom/${classId}?tab=discussion`, {
                  scroll: false,
                })
              }
              className="group inline-flex w-fit cursor-pointer items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
            />
          )}
          {activeTab === "quizzes" && quizDetailBack && (
            <DefaultOutlineCustomButton
              label="Back to list"
              icon={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={quizDetailBack}
              className="group inline-flex w-fit cursor-pointer items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
            />
          )}
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}

export default function ClassroomDetailPage() {
  return (
    <Suspense
      fallback={<ClassroomDetailPageSkeleton />}
    >
      <ClassroomContent />
    </Suspense>
  );
}
