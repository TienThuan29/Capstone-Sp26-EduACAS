"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Spinner,
  Button,
  Select,
  TextInput,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
} from "flowbite-react";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import { useSubject } from "@/hooks/subject/useSubject";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { CustomPagination } from "@/components/custom-pagination";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface LecturerLite {
  lecturerId: string;
  fullname: string;
  email: string;
  avatarUrl: string;
}

interface SubjectLite {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
}

interface Classroom {
  id: string;
  classCode: string;
  className: string;
  lecturer: LecturerLite;
  subject: SubjectLite;
  semesterName: string;
  createdDate: string;
  endDate: string;
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  isDeleted: boolean;
}

interface Semester {
  id: string;
  semesterName: string;
  startDate: string;
  endDate: string;
}

export default function ManageClassroomPage() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const axiosInstance = useAxios();
  const { getActiveSubjects } = useSubject();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const semesters = useMemo(() => {
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 9;
  const [openModal, setOpenModal] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    classCode: "", // Added classCode
    className: "",
    subjectId: "",
    semesterName: semesters[0].semesterName,
    enrolKey: "", // Added enrolKey
    dateEnd: "", // Added dateEnd
  });

  const { getLecturerClassrooms } = useClassroom();

  const fetchClassrooms = async () => {
    let currentUserId = user?.id;

    if (!currentUserId) {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          currentUserId = parsed.id;
        } catch (e) {
          console.error("Error parsing user profile from local storage", e);
        }
      }
    }

    if (!currentUserId) return;

    try {
      setLoading(true);
      const data = await getLecturerClassrooms(
        currentUserId,
        currentPage,
        PAGE_SIZE,
      );
      setClassrooms(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch classrooms failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user?.id, currentPage]);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (openModal) {
      const fetchData = async () => {
        try {
          const activeSubjects = await getActiveSubjects();
          setSubjects(activeSubjects);

          if (activeSubjects.length > 0) {
            setFormData((prev) => ({
              ...prev,
              subjectId: activeSubjects[0].id,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch form data", error);
          showError("Không thể tải danh sách môn học");
        }
      };
      fetchData();
    }
  }, [openModal, getActiveSubjects, showError]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      let currentUserId = user?.id;
      if (!currentUserId) {
        const storedUser = localStorage.getItem("userProfile");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            currentUserId = parsed.id;
          } catch (e) {
            console.error("Error parsing user profile", e);
          }
        }
      }

      if (!currentUserId) {
        showError(
          "Không tìm thấy thông tin giảng viên. Vui lòng đăng nhập lại.",
        );
        setModalLoading(false);
        return;
      }

      if (formData.className.length > 100) {
        showError("Tên lớp học không được quá 100 ký tự.");
        setModalLoading(false);
        return;
      }
      if (new Date(formData.dateEnd) <= new Date()) {
        showError("Ngày kết thúc phải là ngày trong tương lai.");
        setModalLoading(false);
        return;
      }

      const payload = {
        classCode: formData.classCode,
        className: formData.className,
        lecturerId: currentUserId,
        subjectId: formData.subjectId,
        semesterName: formData.semesterName,
        enrolKey: formData.enrolKey,
        endDate: formData.dateEnd,
      };

      await axiosInstance.post(Api.Classroom.CREATE_CLASSROOM, payload);
      showSuccess("Tạo lớp học thành công!");
      setOpenModal(false);
      fetchClassrooms();

      setFormData({
        classCode: "",
        className: "",
        subjectId: subjects[0]?.id || "",
        semesterName: semesters[0].semesterName,
        enrolKey: "",
        dateEnd: "",
      });
    } catch (error) {
      console.error("Create classroom failed", error);
      showError("Tạo lớp học thất bại. Vui lòng thử lại.");
    } finally {
      setModalLoading(false);
    }
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

    if (selectedSemesterFilter !== "All") {
      result = result.filter((c) => c.semesterName === selectedSemesterFilter);
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
  }, [classrooms, searchTerm, selectedSemesterFilter, sortBy]);

  const semestersForFilter = useMemo(() => {
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
        {/* Header */}  
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Classroom Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              List of classrooms you are responsible for
            </p>
          </div>
          <Button
            className="cursor-pointer bg-[#1F4E79] text-white hover:bg-[#1F4E79]/90"
            onClick={() => setOpenModal(true)}
          >
            + Create new classroom
          </Button>
        </div>

        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Search by classroom name or code..."
                required
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={() => (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                )}
              />
            </div>

            <div>
              <Select
                value={selectedSemesterFilter}
                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              >
                {semestersForFilter.map((sem) => (
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

        <div className="overflow-hidden rounded-sm border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {filteredClassrooms.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No classroom found.
            </div>
          ) : (
            <>
              {/* List header (desktop) */}
              <div className="hidden grid-cols-5 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 md:grid">
                <div>Mã lớp / Lớp</div>
                <div>Môn học</div>
                <div>Học kỳ</div>
                <div>Thời gian</div>
                <div className="text-right">Thao tác</div>
              </div>
              {/* List rows */}
              {filteredClassrooms.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 md:grid-cols-5 md:items-center md:gap-4"
                >
                  <div className="grid grid-cols-2 gap-2 md:items-center">
                    <span className="w-fit rounded-full bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {c.classCode}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white md:font-semibold">
                      {c.className}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="md:hidden">Môn: </span>
                    {c.subject.subjectName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="md:hidden">Học kỳ: </span>
                    {c.semesterName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="md:hidden">Thời gian: </span>
                    {new Date(c.createdDate).toLocaleDateString("vi-VN")} –{" "}
                    {new Date(c.endDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex justify-end pt-2 md:pt-0">
                    <Link href={`/manage-classroom/${c.id}`}>
                      <Button
                        color="gray"
                        size="sm"
                        outline
                        className="rounded-lg border-gray-300 font-semibold hover:!border-[#1F4E79] hover:!bg-[#1F4E79] hover:!text-white dark:border-gray-600 dark:hover:!border-[#C9A24D] dark:hover:!bg-[#C9A24D] dark:hover:!text-white cursor-pointer"
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      <div className="mb-12 flex justify-center">
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <Footer />

      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <ModalHeader>Create new classroom</ModalHeader>
        <ModalBody>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="classCode">
                  Classroom code <span className="text-red-500">*</span>
                </Label>
              </div>
              <TextInput
                id="classCode"
                placeholder="Enter classroom code (e.g. SE123)"
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
                placeholder="Enter classroom name (e.g. Software Engineering)"
                required
                value={formData.className}
                onChange={(e) =>
                  setFormData({ ...formData, className: e.target.value })
                }
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">Maximum 100 characters.</p>
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
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subjectCode} - {sub.subjectName}
                  </option>
                ))}
              </Select>
            </div>

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
                <Label htmlFor="enrolKey">Enrol key</Label>
              </div>
              <TextInput
                id="enrolKey"
                placeholder="6-20 ký tự, phải có ký tự đặc biệt, không khoảng trắng"
                type="password"
                value={formData.enrolKey}
                onChange={(e) =>
                  setFormData({ ...formData, enrolKey: e.target.value })
                }
                pattern="^(?=.*[^a-zA-Z0-9])\S{6,20}$"
                title="EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces"
              />
              <p className="mt-1 text-xs text-gray-500">
                6-20 ký tự, bao gồm ít nhất 1 ký tự đặc biệt, không có khoảng
                trắng.
              </p>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="dateEnd">
                  Ngày kết thúc <span className="text-red-500">*</span>
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
              <Button color="gray" onClick={() => setOpenModal(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={modalLoading}
                className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]"
              >
                {modalLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  "Tạo lớp học"
                )}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}
