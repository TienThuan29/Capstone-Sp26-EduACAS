"use client";

import { useCallback, useEffect, useState, Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  TextInput,
  Select,
  Checkbox,
} from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom, SubjectOption } from "@/hooks/classroom/useClassroom";
import type { Classroom as ClassroomDetail } from "@/types/classroom";
import { useExamination } from "@/hooks/exam/useExamination";
import type { Examination } from "@/types/examination";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import Sidebar from "@/components/sidebar";
import {
  DefaultCustomButton,
  DefaultOutlineCustomButton,
} from "@/components/ui/custom-button";
import { useToast } from "@/hooks/useToast";
import { PageUrl } from "@/configs/page.url";
import {
  OverviewTab,
  ExamsTab,
  MaterialsTab,
  StudentTab,
} from "@/app/manage-classroom/tabs";
import { DashboardTab } from "../tabs/dashboard-tab";
import { SlotsTab } from "../tabs/slot-tab";

type UpdateClassroomFormData = {
  classCode: string;
  className: string;
  subjectId: string;
  semesterName: string;
  enrolKey: string;
  dateEnd: string;
  maxSlot: number | "";
};

function ClassroomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getClassroomById,
    getSubjects,
    updateClassroom,
    softDeleteClassroom,
  } = useClassroom();
  const { getExaminationsByClassId } = useExamination();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const activeTab = searchParams.get("tab") || "overview";

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);

  // -- Update & Delete States --
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [showEnrolKey, setShowEnrolKey] = useState(false);

  const classId = params.id as string;

  const [formData, setFormData] = useState<UpdateClassroomFormData>({
    classCode: "",
    className: "",
    subjectId: "",
    semesterName: "",
    enrolKey: "",
    dateEnd: "",
    maxSlot: "",
  });

  const SEMESTERS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    const seasons = ["Spring", "Summer", "Fall"];
    const result: { id: string; semesterName: string }[] = [];
    years.forEach((year) => {
      seasons.forEach((season) => {
        result.push({
          id: `${season.toLowerCase()}-${year}`,
          semesterName: `${season} ${year}`,
        });
      });
    });
    return result;
  }, []);

  const fetchClassroomDetail = async () => {
    try {
      setLoading(true);
      const data = await getClassroomById(classId);
      if (data) {
        setClassroom(data);
        setFormData({
          classCode: data.classCode,
          className: data.className,
          subjectId: data.subject.subjectId,
          semesterName: data.semesterName,
          enrolKey: data.enrolKey || "",
          dateEnd: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          maxSlot: data.maxSlot || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClassroomDetail();
    }
  }, [getClassroomById, classId]);

  const fetchExaminations = useCallback(async () => {
    if (!classId) return;
    try {
      setExamsLoading(true);
      const data = await getExaminationsByClassId(classId);
      setExaminations(data);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    } finally {
      setExamsLoading(false);
    }
  }, [getExaminationsByClassId, classId]);

  useEffect(() => {
    if ((activeTab === "exams" || activeTab === "practise-ex") && classId) {
      fetchExaminations();
    }
  }, [activeTab, classId, fetchExaminations]);

  useEffect(() => {
    if (openUpdateModal) {
      const fetchSubjects = async () => {
        try {
          const activeSubjects = await getSubjects();
          setSubjects(activeSubjects);
        } catch (error) {
          console.error("Failed to fetch subjects", error);
          showError("Failed to fetch subjects");
        }
      };
      fetchSubjects();
    }
  }, [openUpdateModal, getSubjects, showError]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom) return;

    const slotVal = Number(formData.maxSlot);
    if (!formData.maxSlot || isNaN(slotVal) || slotVal <= 1) {
      showError("Số lượng chỗ (Max Slot) phải từ 2 trở lên.");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        id: classroom.id,
        classCode: formData.classCode,
        className: formData.className,
        lecturerId: user?.id,
        subjectId: formData.subjectId,
        semesterName: formData.semesterName,
        enrolKey: formData.enrolKey,
        endDate: formData.dateEnd,
        maxSlot: slotVal,
      };

      await updateClassroom(classroom.id, payload);
      showSuccess("Updated classroom successfully");
      setOpenUpdateModal(false);
      fetchClassroomDetail();
    } catch (error) {
      console.error("Update failed", error);
      showError("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!classroom) return;
    try {
      setActionLoading(true);
      await softDeleteClassroom(classroom.id);
      showSuccess("Deleted classroom successfully");
      router.push(PageUrl.MANAGE_CLASSROOM_PAGE);
    } catch (error) {
      console.error("Delete failed", error);
      showError("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNavbar />
        <div className="flex flex-grow items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Spinner size="xl" color="info" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNavbar />
        <div className="container mx-auto flex flex-grow flex-col items-center justify-center bg-gray-50 px-4 pt-24 pb-8 dark:bg-gray-900">
          <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">
            Classroom not found
          </h2>
          <Button color="gray" onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "materials":
        return <MaterialsTab />;
      case "exams":
        return (
          <ExamsTab
            classId={classId}
            examinations={examinations}
            loading={examsLoading}
            onRefetch={fetchExaminations}
          />
        );
      case "students":
        return <StudentTab />;
      case "dashboard":
        return <DashboardTab />;
      case "slots":
        return <SlotsTab maxSlot={classroom.maxSlot} />;
      default:
        return (
          <OverviewTab
            classroom={classroom}
            onOpenUpdateModal={() => setOpenUpdateModal(true)}
            onOpenDeleteModal={() => setOpenDeleteModal(true)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-20 flex-grow p-4 transition-all duration-300 lg:ml-64 lg:p-8">
        <div className="mb-5">
          <DefaultOutlineCustomButton
            label="Manage classrooms"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push(PageUrl.MANAGE_CLASSROOM_PAGE)}
          />
        </div>

        {renderTabContent()}
      </main>

      <UpdateClassroomModal
        show={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateSubmit}
        actionLoading={actionLoading}
        subjects={subjects}
        semesters={SEMESTERS}
        showEnrolKey={showEnrolKey}
        setShowEnrolKey={setShowEnrolKey}
      />

      <DeleteClassroomModal
        show={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        classroom={classroom}
        onConfirm={handleSoftDelete}
        actionLoading={actionLoading}
      />
    </div>
  );
}

// -----------------------------------------------------------------

type UpdateClassroomModalProps = {
  show: boolean;
  onClose: () => void;
  formData: UpdateClassroomFormData;
  setFormData: React.Dispatch<React.SetStateAction<UpdateClassroomFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  actionLoading: boolean;
  subjects: SubjectOption[];
  semesters: { id: string; semesterName: string }[];
  showEnrolKey: boolean;
  setShowEnrolKey: (value: boolean) => void;
};

function UpdateClassroomModal({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  actionLoading,
  subjects,
  semesters,
  showEnrolKey,
  setShowEnrolKey,
}: UpdateClassroomModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Update classroom information</ModalHeader>
      <ModalBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="classCode">
                Classroom code <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="classCode"
              required
              value={formData.classCode}
              onChange={(e) =>
                setFormData({ ...formData, classCode: e.target.value })
              }
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="className">
                Classroom name <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="className"
              required
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
              maxLength={100}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
            </div>
            <Select
              id="subject"
              required
              value={formData.subjectId}
              onChange={(e) =>
                setFormData({ ...formData, subjectId: e.target.value })
              }
            >
              <option value="" disabled>
                Select subject
              </option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectCode} - {sub.subjectName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="semester">
                  Semester <span className="text-red-500">*</span>
                </Label>
              </div>
              <Select
                id="semester"
                required
                value={formData.semesterName}
                onChange={(e) =>
                  setFormData({ ...formData, semesterName: e.target.value })
                }
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.semesterName}>
                    {sem.semesterName}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="maxSlot">
                  Max Slot <span className="text-red-500">*</span>
                </Label>
              </div>
              <TextInput
                id="maxSlot"
                type="number"
                placeholder="Enter max slot (e.g. 30)"
                required
                value={formData.maxSlot}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxSlot:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                min={2}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="enrolKey">Enrol key</Label>
            </div>
            <TextInput
              id="enrolKey"
              type={showEnrolKey ? "text" : "password"}
              value={formData.enrolKey}
              onChange={(e) =>
                setFormData({ ...formData, enrolKey: e.target.value })
              }
              pattern="^(?=.*[^a-zA-Z0-9])\S{6,20}$"
              title="EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces"
            />
            <div className="mt-2 flex items-center gap-2">
              <Checkbox
                id="showEnrolKey"
                checked={showEnrolKey}
                onChange={(e) => setShowEnrolKey(e.target.checked)}
              />
              <Label
                htmlFor="showEnrolKey"
                className="cursor-pointer font-normal"
              >
                Show enrol key
              </Label>
            </div>
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="dateEnd">
                End date <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="dateEnd"
              type="date"
              required
              value={formData.dateEnd}
              onChange={(e) =>
                setFormData({ ...formData, dateEnd: e.target.value })
              }
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button color="gray" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="cursor-pointer bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]"
            >
              {actionLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}

type DeleteClassroomModalProps = {
  show: boolean;
  onClose: () => void;
  classroom: ClassroomDetail | null;
  onConfirm: () => void;
  actionLoading: boolean;
};

function DeleteClassroomModal({
  show,
  onClose,
  classroom,
  onConfirm,
  actionLoading,
}: DeleteClassroomModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <ModalHeader />
      <ModalBody>
        <div>
          <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Confirm delete
          </h3>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Are you sure you want to delete the classroom{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              &quot;{classroom?.className}&quot;
            </span>{" "}
            ?
          </p>
          <div className="flex justify-end gap-4">
            <Button
              color="red"
              onClick={onConfirm}
              disabled={actionLoading}
              className="cursor-pointer px-4"
            >
              {actionLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                "Delete classroom"
              )}
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              className="cursor-pointer px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default function LecturerClassroomDetailPage() {
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
