"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, Spinner, TextInput, Select, Button } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import useAxios from "@/hooks/useAxios"
import { Api } from "@/configs/api"
import Link from "next/link"

// Define interface based on the JSON provided by user
interface Classroom {
  id: string;
  classCode: string;
  className: string;
  lecturerId: string;
  subjectId: string;
  subjectName: string;
  semesterName: string;
  enrolKey: string;
  createdDate: string;
  updatedDate: string | null;
  endDate: string;
  isDeleted: boolean;
}

export default function ListClassroomPage() {
  const axiosInstance = useAxios();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  
  // -- Filter States --
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name_asc, name_desc

  // Placeholder ID (Replace with real logic later)
  const studentId = "6208c99e-601a-4550-a1d7-da3413fe852b";

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${Api.Classroom.GET_STUDENT_CLASSROOMS}/${studentId}`);
        if (response.data && response.data.dataResponse) {
          setClassrooms(response.data.dataResponse);
        }
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
        fetchClassrooms();
    }
  }, [axiosInstance, studentId]);

  // -- Logic Filter & Sort --
  const filteredClassrooms = useMemo(() => {
    let result = [...classrooms];

    // 1. Search (Class Code or Class Name)
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.className.toLowerCase().includes(lowerTerm) || 
            c.classCode.toLowerCase().includes(lowerTerm)
        );
    }

    // 2. Filter by Semester
    if (selectedSemester !== "All") {
        result = result.filter(c => c.semesterName === selectedSemester);
    }

    // 3. Sort
    result.sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
            case "oldest":
                return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
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

  // Get unique semesters for filter dropdown
  const semesters = useMemo(() => {
      const unique = new Set(classrooms.map(c => c.semesterName));
      return ["All", ...Array.from(unique)];
  }, [classrooms]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <HomeNavbar />

      <main className="flex-grow container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Lớp học của tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Danh sách các lớp học bạn đang tham gia.
          </p>
        </div>

        {/* --- Toolbar: Search & Filters --- */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sticky top-20 z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <TextInput 
                        id="search" 
                        type="text" 
                        placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..." 
                        required 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={() => (
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    />
                </div>

                {/* Filter Semester */}
                <div>
                    <Select 
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                        {semesters.map(sem => (
                            <option key={sem} value={sem}>
                                {sem === "All" ? "Tất cả học kỳ" : sem}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Sort */}
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

        {/* --- List Content --- */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" color="info" />
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
             <p className="text-lg text-gray-500 dark:text-gray-400">
                 {classrooms.length === 0 ? "Bạn chưa tham gia lớp học nào." : "Không tìm thấy lớp học phù hợp."}
             </p>
          </div>
        ) : (
        // Grid matched to all-classroom: xl:grid-cols-3
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClassrooms.map((c) => (
            <Card
                key={c.id}
                className="
                rounded-2xl
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-800
                shadow-sm
                transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl
                "
            >
                <div className="flex flex-col h-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <span className="
                    px-3 py-1
                    rounded-full
                    text-xs font-semibold tracking-wide
                    bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]
                    text-white
                    shadow
                    ">
                    {c.classCode}
                    </span>

                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {c.semesterName}
                    </span>
                </div>

                {/* Title */}
                <h3 className="
                    text-lg font-bold
                    text-gray-900 dark:text-white
                    leading-snug
                    mb-3
                ">
                    {c.className}
                </h3>

                {/* Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                    <p className="flex items-center gap-2">
                    <span className="text-[#1F4E79] dark:text-[#C9A24D]">GV:</span>
                    <span>{c.lecturerId}</span>
                    </p>
                    <p className="flex items-center gap-2">
                    <span className="text-[#1F4E79] dark:text-[#C9A24D]">Môn:</span>
                    <span>{c.subjectName}</span>
                    </p>  
                    <p className="flex items-center gap-2">
                    <span className="text-[#1F4E79] dark:text-[#C9A24D]">📅</span>
                    <span>
                        {new Date(c.createdDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(c.endDate).toLocaleDateString("vi-VN")}
                    </span>
                    </p>
                </div>

                {/* Action */}
                <div className="mt-auto">
                    <Link href={`/my-classroom/${c.id}`} className="block w-full">
                        <Button
                            color="gray"
                            outline
                            className="
                            w-full
                            rounded-xl
                            border-gray-300 dark:border-gray-600
                            hover:bg-[#1F4E79]/5
                            dark:hover:bg-[#C9A24D]/10
                            font-semibold
                            "
                        >
                            Truy cập
                        </Button>
                    </Link>
                </div>

                </div>
            </Card>
            
            ))}
        </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
