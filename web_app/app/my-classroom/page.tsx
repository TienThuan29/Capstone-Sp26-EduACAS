"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Spinner,
  TextInput,
  Select,
  Button,
  Badge,
} from "flowbite-react";
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useClassroom, Classroom } from "@/hooks/classroom/useClassroom";
import Link from "next/link";

export default function ListClassroomPage() {
  const { getStudentClassrooms } = useClassroom();
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"joining" | "left">("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const studentId = user?.id;

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        const data = await getStudentClassrooms(studentId);
        setClassrooms(data);
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [getStudentClassrooms, studentId]);

  const filteredClassrooms = useMemo(() => {
    let result = classrooms.filter((c) =>
      activeTab === "joining"
        ? c.enrollment?.isJoining
        : !c.enrollment?.isJoining,
    );

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.className.toLowerCase().includes(lowerTerm) ||
          c.classCode.toLowerCase().includes(lowerTerm),
      );
    }

    if (selectedSemester !== "All") {
      result = result.filter((c) => c.semesterName === selectedSemester);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdDate).getTime() -
            new Date(b.createdDate).getTime()
          );
        case "name_asc":
          return a.className.localeCompare(b.className);
        case "name_desc":
          return b.className.localeCompare(a.className);
        default:
          return 0;
      }
    });

    return result;
  }, [classrooms, searchTerm, selectedSemester, sortBy, activeTab]);

  const semesters = useMemo(() => {
    const unique = new Set(classrooms.map((c) => c.semesterName));
    return ["All", ...Array.from(unique)];
  }, [classrooms]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 pb-12">
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
              onClick={() => setActiveTab("joining")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-all bg-transparent border-0 ${
                activeTab === "joining"
                  ? "bg-white text-[#1F4E79] dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Joining
            </Button>
            <Button
              onClick={() => setActiveTab("left")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-all bg-transparent border-0 ${
                activeTab === "left"
                  ? "bg-white text-[#1F4E79] dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Moved Out
            </Button>
          </div>
        </div>

        {/* Search and filter */}
        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Search by class name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={() => (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                )}
              />
            </div>

            <div>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem === "All" ? "All semesters" : sem}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="xl" color="info" />
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 text-gray-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {classrooms.length === 0
                ? "You are not enrolled in any classes."
                : "No classes found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredClassrooms.map((c) => (
              <Card
                key={c.id}
                className="group relative overflow-hidden border-l-[#1F4E79] border-gray-200 bg-white hover:shadow-lg dark:border-gray-700 dark:border-l-[#C9A24D] dark:bg-gray-800"
              >
                {/* Subtle gradient accent at top */}
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
                        {c.lecturer.lecturerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Lecturer
                        </p>
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {c.lecturer.lecturerName}
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
                        {new Date(c.createdDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(c.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    {c.enrollment?.isJoining ? (
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
                    ) : (
                      <Button
                        disabled
                        color="gray"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500 cursor-not-allowed"
                      >
                        Moved Out
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
