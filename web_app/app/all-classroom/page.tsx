"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Spinner, TextInput, Select, Card, Button } from "flowbite-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom, Classroom } from "@/hooks/classroom/useClassroom";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { CustomPagination } from "@/components/custom-pagination";

export default function ListAllClassroomPage() {
  const { user } = useAuth();
  const { getAllClassrooms } = useClassroom();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);


  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 9;


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const data = await getAllClassrooms(user?.id, currentPage, PAGE_SIZE);
        setClassrooms(data.items);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Fetch classrooms failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [getAllClassrooms, user?.id, currentPage]);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };



  const filteredClassrooms = useMemo(() => {
    let result = [...classrooms];

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
  }, [classrooms, searchTerm, selectedSemester, sortBy]);

  const semesters = useMemo(() => {
    const unique = new Set(classrooms.map((c) => c.semesterName));
    return ["All", ...Array.from(unique)];
  }, [classrooms]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNavbar />
        <div className="flex flex-grow items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tất cả lớp học
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Danh sách toàn bộ lớp học đang mở trong hệ thống
          </p>
        </div>

        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
                required
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredClassrooms.map((c) => (
            <Card
              key={c.id}
              className="rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] px-3 py-1 text-xs font-semibold tracking-wide text-white shadow">
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
                    <span className="font-semibold text-[#1F4E79] dark:text-[#C9A24D]">
                      Giảng viên:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {c.lecturer.lecturerName}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F4E79] dark:text-[#C9A24D]">
                      Môn:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {c.subject.subjectName}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F4E79] dark:text-[#C9A24D]">
                      Thời gian:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
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
                        className="w-full rounded-xl border-gray-300 font-bold !text-[#1F4E79] dark:!text-[#C9A24D] transition-all hover:-translate-y-0.5 hover:!border-green-600 hover:!bg-green-600 hover:!text-white hover:shadow-lg focus:ring-4 focus:ring-green-300 dark:border-gray-600 dark:hover:!border-green-600 dark:hover:!bg-green-600 dark:focus:ring-green-800"
                      >
                        Truy cập
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/all-classroom/${c.id}`}
                      className="block w-full"
                    >
                      <Button
                        color="gray"
                        outline
                        className="w-full rounded-xl border-gray-300 font-semibold text-[#1F4E79] dark:text-[#C9A24D] hover:border-[#1F4E79]! hover:!bg-[#1F4E79] hover:!text-white dark:border-gray-600 dark:hover:border-[#C9A24D]! dark:hover:!bg-[#C9A24D] dark:hover:!text-white"
                      >
                        Tham gia
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>

      </main>

      <Footer />
    </div>
  );
}
