"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Spinner, Button } from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import type { Classroom as ClassroomDetail } from "@/types/classroom";
import { useExamination } from "@/hooks/exam/useExamination";
import type { Examination } from "@/types/exam";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/sidebar";
import { PageUrl } from "@/configs/page.url";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import {
  ExamsTab,
  MaterialsTab,
  AssignmentsTab,
  PractiseTab,
  OverviewTab,
} from "@/app/my-classroom/tabs";

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
          <ExamsTab
            examinations={examinations}
            examsLoading={examsLoading}
          />
        );
      case "materials":
        return <MaterialsTab />;
      case "assignments":
        return <AssignmentsTab />;
      case "practise":
        return <PractiseTab />;
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 flex-grow p-4 lg:ml-64 lg:p-8">
        <div className="mb-10">
          <DefaultOutlineCustomButton
            label="All classes"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push(PageUrl.MY_CLASSROOM_PAGE)}
            className="group inline-flex w-fit items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:bg-[#1F4E79] hover:text-white hover:border-[#1F4E79] dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900 dark:hover:border-[#C9A24D] cursor-pointer"
          />
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