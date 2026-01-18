"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, Spinner, TextInput, Select } from "flowbite-react"
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

      <main className="flex-grow container mx-auto px-4 pt-24 pb-12 max-w-[1400px]"> {/* Tăng max-w để fit 4 cột */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#1F4E79] dark:text-[#C9A24D]">
                Lớp học của tôi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                Danh sách các lớp học bạn đang tham gia.
                </p>
            </div>
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
        // Grid 4 columns: lg:grid-cols-4
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredClassrooms.map((classroom) => (
              <div 
                key={classroom.id} 
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-[#C9A24D] transition-all duration-300 flex flex-col h-full relative"
              >
                {/* Decorative Top Line */}
                <div className="h-1 w-full bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]"></div>

                {/* Card Content */}
                <div className="p-5 flex flex-col h-full">
                    {/* Header: Code & Semester */}
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-gray-100 dark:bg-gray-700 text-[#1F4E79] dark:text-[#C9A24D] text-xs font-bold px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                            {classroom.classCode}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-full">
                            {classroom.semesterName}
                        </span>
                    </div>

                    {/* Class Name */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-[#1F4E79] dark:group-hover:text-[#C9A24D] transition-colors" title={classroom.className}>
                        {classroom.className}
                    </h3>

                    {/* Lecturer Info */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 text-xs font-bold text-gray-500">
                           {classroom.lecturerId.substring(0,2).toUpperCase()}
                        </div>
                        <span className="truncate">{classroom.lecturerId}</span>
                    </div>
                
                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-auto"></div>

                    {/* Footer: Date & Button */}
                    <div className="pt-4 flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-400" title="Created Date">
                            {new Date(classroom.createdDate).toLocaleDateString("vi-VN")}
                        </span>
                        
                        <Link href={`/list-myclassroom/${classroom.id}`} className="block">
                            <div className="text-xs font-bold text-white bg-[#1F4E79] hover:bg-[#163A5C] px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center cursor-pointer">
                                Truy cập 
                                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
