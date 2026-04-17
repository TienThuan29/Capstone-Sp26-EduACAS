"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
} from "flowbite-react";
import { EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import type {
  StudentExamSessionDto,
  StudentExamSessionPhase,
} from "@/types/student-exam-session";
import { useExamSessionManagement } from "@/hooks/examination/useExamSessionManagement";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/datetime-utils";
import { CheckCircle } from "lucide-react";

const PHASE_LABELS: Record<
  StudentExamSessionPhase,
  { text: string; color: string }
> = {
  NOTSTARTED: { text: "NOT STARTED", color: "warning" },
  ACTIVE: { text: "ACTIVE", color: "success" },
  COMPLETED: { text: "COMPLETED", color: "gray" },
  LOCKED: { text: "LOCKED", color: "failure" },
};

type ExamSessionTabContentProps = {
  examination: {
    id: string;
  };
};

export function ExamSessionTabContent({
  examination,
}: ExamSessionTabContentProps) {
  const { getSessionsByExamId, hardDeleteSession } = useExamSessionManagement();
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<StudentExamSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [retakeModalOpen, setRetakeModalOpen] = useState(false);
  const [sessionToRetake, setSessionToRetake] =
    useState<StudentExamSessionDto | null>(null);
  const [retakeLoading, setRetakeLoading] = useState(false);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deletedSessionName, setDeletedSessionName] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSessionsByExamId(examination.id);
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch exam sessions:", error);
      showError("Failed to load exam sessions");
    } finally {
      setLoading(false);
    }
  }, [examination.id, getSessionsByExamId, showError]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const openRetakeConfirm = (session: StudentExamSessionDto) => {
    setSessionToRetake(session);
    setRetakeModalOpen(true);
  };

  const handleRetake = async () => {
    if (!sessionToRetake) return;
    try {
      setRetakeLoading(true);
      await hardDeleteSession(
        sessionToRetake.examId,
        sessionToRetake.studentId,
      );
      setRetakeModalOpen(false);
      setDeletedSessionName(sessionToRetake.studentName);
      setSuccessModalOpen(true);
      await fetchSessions();
    } catch (error) {
      console.error("Failed to retake session:", error);
      showError("Failed to retake session");
    } finally {
      setRetakeLoading(false);
    }
  };

  const handleViewDetail = (session: StudentExamSessionDto) => {
    console.log("View detail for session:", session);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Student Name</TableHeadCell>
            <TableHeadCell>Role Number</TableHeadCell>
            <TableHeadCell>Phase</TableHeadCell>
            <TableHeadCell>Active Problem</TableHeadCell>
            <TableHeadCell>Lock Reason</TableHeadCell>
            <TableHeadCell>Created Date</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </TableHead>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 dark:text-gray-400"
                >
                  No exam sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const phaseInfo = PHASE_LABELS[session.phase] ?? {
                  text: session.phase,
                  color: "gray",
                };
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {session.studentName}
                    </TableCell>
                    <TableCell>{session.studentRoleNumber}</TableCell>
                    <TableCell>
                      <Badge color={phaseInfo.color}>{phaseInfo.text}</Badge>
                    </TableCell>
                    <TableCell>{session.activeProblemId || "—"}</TableCell>
                    <TableCell>{session.lockReason || "—"}</TableCell>
                    <TableCell>{formatDate(session.createdDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          color="blue"
                          size="xs"
                          onClick={() => handleViewDetail(session)}
                          className="cursor-pointer"
                          title="View Detail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          color="red"
                          size="xs"
                          onClick={() => openRetakeConfirm(session)}
                          className="cursor-pointer"
                          title="Retake"
                        >
                          {/* <ArrowPathIcon className="h-4 w-4" /> */}
                          Retake
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Retake Confirmation Modal */}
      <Modal
        show={retakeModalOpen}
        onClose={() => setRetakeModalOpen(false)}
        popup
      >
        <ModalHeader />
        <ModalBody>
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Confirm Retake
            </h3>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to allow{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {sessionToRetake?.studentName}
              </span>{" "}
              to retake this exam?
            </p>
            <p className="text-xs text-red-500">
              This action will permanently delete the student's current exam
              session.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="gray"
            onClick={() => setRetakeModalOpen(false)}
            disabled={retakeLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => void handleRetake()}
            disabled={retakeLoading}
            className="cursor-pointer"
          >
            {retakeLoading ? "Processing..." : "Confirm Retake"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Success Modal */}
      <Modal
        show={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        popup
      >
        <ModalHeader />
        <ModalBody>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              Retake Successful
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">
                {deletedSessionName}
              </span>{" "}
              has been granted a retake for this exam.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className="cursor-pointer" color="gray" onClick={() => setSuccessModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
