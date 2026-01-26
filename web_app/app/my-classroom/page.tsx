"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Spinner, TextInput, Select, Button } from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import HomeNavbar from "@/components/home-navbar";
import Footer from "@/components/Footer";
import { useClassroom, Classroom } from "@/hooks/useClassroom";
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
              Lớp học của tôi
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Danh sách các lớp học của bạn.
            </p>
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab("joining")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "joining"
                  ? "bg-white text-[#1F4E79] shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Đang học
            </button>
            <button
              onClick={() => setActiveTab("left")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "left"
                  ? "bg-white text-[#1F4E79] shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Đã rời lớp
            </button>
          </div>
        </div>

        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={() => (
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
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
                    {sem === "All" ? "Tất cả học kỳ" : sem}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
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
                ? "Bạn chưa tham gia lớp học nào."
                : "Không tìm thấy lớp học phù hợp."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredClassrooms.map((c) => (
              <Card
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-linear-to-r from-[#1F4E79] to-[#C9A24D] px-3 py-1 text-xs font-semibold tracking-wide text-white shadow">
                      {c.classCode}
                    </span>

                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {c.semesterName}
                    </span>
                  </div>

                  <h3 className="mb-3 text-lg leading-snug font-bold text-gray-900 dark:text-white">
                    {c.className}
                  </h3>

                  <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D]">
                        GV:
                      </span>
                      <span>{c.lecturer.lecturerName}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D]">
                        Môn:
                      </span>
                      <span>{c.subject.subjectName}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D]">
                        📅
                      </span>
                      <span>
                        {new Date(c.createdDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(c.endDate).toLocaleDateString("vi-VN")}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto">
                    {c.enrollment?.isJoining ? (
                      <Link
                        href={`/my-classroom/${c.id}`}
                        className="block w-full"
                      >
                        <Button
                          color="gray"
                          outline
                          className="w-full rounded-xl border-gray-300 font-semibold hover:bg-[#1F4E79] hover:text-white dark:border-gray-600 dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
                        >
                          Truy cập
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        disabled
                        color="gray"
                        className="w-full rounded-xl border-gray-200 bg-gray-50 font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500"
                      >
                        Đã rời lớp
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
