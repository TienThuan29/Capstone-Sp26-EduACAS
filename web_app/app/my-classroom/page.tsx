"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Card,
  TextInput,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
} from "flowbite-react";
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import type { Classroom } from "@/types/classroom";
import { formatDateOnly } from "@/utils/datetime-utils";
import Link from "next/link";
import { FileIcon } from "lucide-react";
import { ClassroomListSkeleton } from "@/components/ui/skeletons";
import { CustomPagination } from "@/components/custom-pagination";

export default function ListClassroomPage() {
  const { getStudentClassrooms, getAllClassrooms, enrollClassroom } =
    useClassroom();
  const { user } = useAuth();
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const [activeTab, setActiveTab] = useState<"all" | "joining" | "left">("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [joiningPage, setJoiningPage] = useState(1);
  const [leftPage, setLeftPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [joiningTotalPages, setJoiningTotalPages] = useState(1);
  const [leftTotalPages, setLeftTotalPages] = useState(1);
  const [allTotalPages, setAllTotalPages] = useState(1);

  const [enrollModalClassroom, setEnrollModalClassroom] =
    useState<Classroom | null>(null);
  const [enrollKeyInput, setEnrollKeyInput] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const studentId = user?.id;
  const PAGE_SIZE = 9;

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        if (isInitialLoad.current) {
          setLoading(true);
          isInitialLoad.current = false;
        }
        if (activeTab === "all") {
          if (!studentId) return;
          const result = await getAllClassrooms(studentId, searchQuery, undefined, allPage, PAGE_SIZE);
          setAllClassrooms(result.items ?? []);
          setAllTotalPages(result.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && activeTab === "all") {
      fetchClassrooms();
    }
  }, [activeTab, getAllClassrooms, studentId, searchQuery, allPage]);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!studentId || activeTab === "all") return;
      try {
        if (isInitialLoad.current) {
          setLoading(true);
          isInitialLoad.current = false;
        }
        const page = activeTab === "joining" ? joiningPage : leftPage;
        const status = activeTab === "joining" ? "joining" : "movedout";
        const result = await getStudentClassrooms(studentId, status, searchQuery, page, PAGE_SIZE);
        setAllClassrooms(result.items ?? []);
        if (activeTab === "joining") {
          setJoiningTotalPages(result.totalPages);
        } else {
          setLeftTotalPages(result.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, getStudentClassrooms, studentId, searchQuery, joiningPage, leftPage]);

  const isJoining = (c: Classroom) => c.enrollment?.isJoining === true;
  const isMovedOut = (c: Classroom) =>
    c.enrollment != null &&
    c.enrollment.isJoining === false &&
    c.enrollment.joinedDate != null;

  const filteredClassrooms = useMemo(() => {
    let result =
      activeTab === "all"
        ? [...allClassrooms]
        : activeTab === "joining"
          ? allClassrooms.filter(isJoining)
          : allClassrooms.filter(isMovedOut);

    return result;
  }, [allClassrooms, activeTab]);

  const handleTabChange = (tab: "all" | "joining" | "left") => {
    setActiveTab(tab);
    if (tab === "joining") setJoiningPage(1);
    else if (tab === "left") setLeftPage(1);
    else if (tab === "all") setAllPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm);
    if (activeTab === "joining") setJoiningPage(1);
    else if (activeTab === "left") setLeftPage(1);
    else if (activeTab === "all") setAllPage(1);
  };

  const openEnrollModal = (classroom: Classroom) => {
    setEnrollModalClassroom(classroom);
    setEnrollKeyInput("");
    setEnrollError(null);
  };

  const closeEnrollModal = () => {
    setEnrollModalClassroom(null);
    setEnrollKeyInput("");
    setEnrollError(null);
  };

  const handleEnrollSubmit = async () => {
    if (!enrollModalClassroom || !studentId || !enrollKeyInput.trim()) {
      setEnrollError("Please enter the enrollment key.");
      return;
    }
    setEnrollSubmitting(true);
    setEnrollError(null);
    try {
      await enrollClassroom({
        classId: enrollModalClassroom.id,
        studentId,
        enrolKey: enrollKeyInput.trim(),
      });
      closeEnrollModal();
      if (activeTab === "all") {
        const result = await getAllClassrooms(studentId, searchQuery, undefined, allPage, PAGE_SIZE);
        setAllClassrooms(result.items ?? []);
        setAllTotalPages(result.totalPages);
      } else {
        const status = activeTab === "joining" ? "joining" : "movedout";
        const page = activeTab === "joining" ? joiningPage : leftPage;
        const result = await getStudentClassrooms(studentId, status, searchQuery, page, PAGE_SIZE);
        setAllClassrooms(result.items ?? []);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setEnrollError(
        message || "Failed to join class. Check the enrollment key and try again.",
      );
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const currentTotalPages = activeTab === "joining" ? joiningTotalPages : activeTab === "left" ? leftTotalPages : allTotalPages;
  const currentPage = activeTab === "joining" ? joiningPage : activeTab === "left" ? leftPage : allPage;
  const handlePageChange = (page: number) => {
    if (activeTab === "joining") setJoiningPage(page);
    else if (activeTab === "left") setLeftPage(page);
    else if (activeTab === "all") setAllPage(page);
  };

  const tabBtnClass = (tab: "all" | "joining" | "left") =>
    `rounded-md px-4 py-2 text-sm font-bold transition-all bg-transparent border-0 ${
      activeTab === tab
        ? "bg-white text-[#1F4E79] dark:bg-gray-700 dark:text-white"
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`;

  const classroomContent = useMemo(() => {
    if (loading) {
      return <ClassroomListSkeleton />;
    }
    if (filteredClassrooms.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-gray-400">
            <FileIcon className="mx-auto h-16 w-16" />
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {allClassrooms.length === 0
              ? "You are not enrolled in any classes."
              : "No classes found."}
          </p>
        </div>
      );
    }
    return (
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredClassrooms.map((c) => (
            <Card
              key={c.id}
              className="group relative overflow-hidden border-l-[#1F4E79] border-gray-200 bg-white hover:shadow-lg dark:border-gray-700 dark:border-l-[#C9A24D] dark:bg-gray-800"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-linear-to-bl from-[#1F4E79]/5 to-transparent dark:from-[#C9A24D]/10" />

              <div className="relative flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <Badge
                    color="success"
                    className="px-3 py-1 text-xs font-bold tracking-wider text-black border-0"
                  >
                    {c.classCode}
                  </Badge>
                  <Badge
                    color="gray"
                    className="px-2.5 py-1 text-xs font-medium"
                  >
                    {c.semesterName}
                  </Badge>
                </div>

                <h3 className="mb-4 line-clamp-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                  {c.className}
                </h3>

                <div className="mb-3 space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-sm font-bold text-[#1F4E79] dark:bg-[#C9A24D]/20 dark:text-[#C9A24D]">
                      {c.lecturer.fullname.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Lecturer
                      </p>
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {c.lecturer.fullname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 dark:bg-[#C9A24D]/20">
                      <BookOpenIcon className="h-4 w-4 text-[#1F4E79] dark:text-[#C9A24D]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Subject
                      </p>
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {c.subject.subjectName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-gray-200 pt-3 dark:border-gray-600">
                    <CalendarIcon className="h-5 w-5 shrink-0 text-[#1F4E79] dark:text-[#C9A24D]" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateOnly(c.createdDate)} –{" "}
                      {formatDateOnly(c.endDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  {isJoining(c) ? (
                    <Link
                      href={`/my-classroom/${c.id}`}
                      className="block w-full"
                    >
                      <Button
                        color="gray"
                        outline
                        className="w-full rounded-xl border-2 border-gray-300 font-semibold transition-colors hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-600 dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900 cursor-pointer"
                      >
                        Access
                      </Button>
                    </Link>
                  ) : isMovedOut(c) ? (
                    <Button
                      disabled
                      color="gray"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500 cursor-not-allowed"
                    >
                      Moved Out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openEnrollModal(c)}
                      color="gray"
                      outline
                      className="w-full rounded-xl border-2 border-gray-300 font-semibold transition-colors hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-600 dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900 cursor-pointer"
                    >
                      Join class
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {currentTotalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <CustomPagination
              currentPage={currentPage}
              totalPages={currentTotalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  }, [loading, filteredClassrooms, allClassrooms, isJoining, isMovedOut, activeTab, currentTotalPages, currentPage, handlePageChange]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto max-w-7xl grow px-4 pt-24 pb-12 min-h-[600px]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Classes
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              List of classes you are enrolled in.
            </p>
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <Button
              onClick={() => handleTabChange("all")}
              className={tabBtnClass("all")}
            >
              All
            </Button>
            <Button
              onClick={() => handleTabChange("joining")}
              className={tabBtnClass("joining")}
            >
              Joining
            </Button>
            <Button
              onClick={() => handleTabChange("left")}
              className={tabBtnClass("left")}
            >
              Moved Out
            </Button>
          </div>
        </div>

        {/* Search and filter */}
        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex gap-2 md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Search by class name, code, or lecturer..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                icon={() => (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                )}
                className="flex-1"
              />
              <Button
                onClick={handleSearchSubmit}
                className="cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {classroomContent}
      </main>

      <Modal
        show={enrollModalClassroom != null}
        onClose={closeEnrollModal}
        size="md"
      >
        <ModalHeader>
          Join class: {enrollModalClassroom?.className}
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the enrollment key provided by your lecturer to join this
            class.
          </p>
          <div>
            <Label htmlFor="enrolKey">Enrollment key</Label>
            <TextInput
              id="enrolKey"
              type="text"
              placeholder="e.g. @2b12ff"
              value={enrollKeyInput}
              onChange={(e) => setEnrollKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnrollSubmit()}
              className="mt-1"
              autoFocus
            />
          </div>
          {enrollError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {enrollError}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={closeEnrollModal} outline>
            Cancel
          </Button>
          <Button
            onClick={handleEnrollSubmit}
            disabled={enrollSubmitting || !enrollKeyInput.trim()}
            className="bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
          >
            {enrollSubmitting ? "Joining…" : "Join class"}
          </Button>
        </ModalFooter>
      </Modal>

      <Footer />
    </div>
  );
}
