"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Pagination,
  Avatar,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Select,
  Label,
} from "flowbite-react";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import type { ClassroomStudentResponse } from "@/types/classroom";
import { formatDateOnly } from "@/utils/datetime-utils";
import { useToast } from "@/hooks/useToast";
import { TrashIcon } from "@heroicons/react/24/solid";
import { StudentTabSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 10;

type StatusFilter = "enrolling" | "left" | "all";

type StudentTabProps = {
  classId: string;
};

export function StudentTab({ classId }: StudentTabProps) {
  const { getStudentsByClassId, forceLeaveStudent } = useStudentClassroom();
  const { showSuccess, showError } = useToast();
  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<ClassroomStudentResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("enrolling");

  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const data = await getStudentsByClassId(classId);
      setStudents(data);
      setCurrentPage(1);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [classId, getStudentsByClassId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const enrollingCount = useMemo(
    () => students.filter((s) => s.isJoining).length,
    [students],
  );

  const filteredStudents = useMemo(() => {
    if (statusFilter === "enrolling") return students.filter((s) => s.isJoining);
    if (statusFilter === "left") return students.filter((s) => !s.isJoining);
    return students;
  }, [students, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE)),
    [filteredStudents.length],
  );

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const onPageChange = (page: number) => setCurrentPage(page);

  const handleForceLeave = useCallback(
    async (studentId: string) => {
      try {
        setRemovingStudentId(studentId);
        await forceLeaveStudent(classId, studentId);
        showSuccess("Student removed from class successfully");
        await fetchStudents();
        setStudentToRemove(null);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to remove student from class";
        showError(message);
      } finally {
        setRemovingStudentId(null);
      }
    },
    [classId, forceLeaveStudent, fetchStudents, showSuccess, showError],
  );

  const handleConfirmForceLeave = useCallback(
    async (studentId: string) => {
      await handleForceLeave(studentId);
    },
    [handleForceLeave],
  );

  if (loading) {
    return <StudentTabSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Manage Students
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="sr-only">
              Filter by status
            </Label>
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="min-w-32"
            >
              <option value="enrolling">Enrolled</option>
              <option value="left">Left</option>
              <option value="all">All</option>
            </Select>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {enrollingCount} student{enrollingCount !== 1 ? "s" : ""} enrolled
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === "enrolling"
                ? "No students enrolled in this classroom yet."
                : statusFilter === "left"
                  ? "No students have left this class."
                  : "No students in this classroom."}
            </p>
          </div>
        ) : (
          <>
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>Student</TableHeadCell>
                  <TableHeadCell>Role number</TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Joined date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student, index) => (
                  <TableRow key={student.enrollmentId}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          img={student.avatarUrl || undefined}
                          alt={student.fullname}
                          rounded
                          size="sm"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {student.fullname || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {student.roleNumber || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {student.email || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {formatDateOnly(student.joinedDate) || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={student.isJoining ? "success" : "gray"}
                        className="w-fit"
                      >
                        {student.isJoining ? "Active" : "Left"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        color="red"
                        className="cursor-pointer"
                        disabled={!student.isJoining || !!studentToRemove}
                        onClick={() => setStudentToRemove(student)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex overflow-x-auto border-t border-gray-200 py-4 sm:justify-center dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  showIcons
                />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmForceLeaveModal
        show={!!studentToRemove}
        student={studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmForceLeave}
        loading={!!studentToRemove && removingStudentId === studentToRemove.studentId}
      />
    </div>
  );
}

type ConfirmForceLeaveModalProps = {
  show: boolean;
  student: ClassroomStudentResponse | null;
  onClose: () => void;
  onConfirm: (studentId: string) => Promise<void>;
  loading: boolean;
};

function ConfirmForceLeaveModal({
  show,
  student,
  onClose,
  onConfirm,
  loading,
}: ConfirmForceLeaveModalProps) {
  const handleConfirm = () => {
    if (!student) return;
    onConfirm(student.studentId);
  };

  return (
    <Modal show={show} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Remove student from class
          </h3>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Are you sure you want to remove{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {student?.fullname || student?.email || "this student"}
            </span>{" "}
            from this classroom? They will no longer have access to the class.
          </p>
          <div className="flex justify-center gap-3">
            <Button color="gray" onClick={onClose} disabled={loading} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirm}
              disabled={loading}
              className="cursor-pointer"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}