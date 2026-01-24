"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, Spinner, Button, Select, TextInput, Modal, ModalHeader, ModalBody, Label, Textarea } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import useAxios from "@/hooks/useAxios"
import { Api } from "@/configs/api"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { useToast } from "@/hooks/useToast"

interface LecturerLite {
    lecturerId: string
    lecturerName: string
}

interface SubjectLite {
    subjectId: string
    subjectName: string
    subjectCode?: string
}

interface Classroom {
    id: string
    classCode: string
    className: string
    lecturer: LecturerLite
    subject: SubjectLite
    semesterName: string
    createdDate: string
    endDate: string
}

interface Subject {
    id: string
    subjectCode: string
    subjectName: string
    isDeleted: boolean
}

interface Semester {
    id: string
    semesterName: string
    startDate: string
    endDate: string
}

export default function ManageClassroomPage() {
    const { showSuccess, showError } = useToast()
    const axiosInstance = useAxios()
    const { user } = useAuth()
    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const [loading, setLoading] = useState(true)

    // -- Filter States --
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    // Generate Semesters (Current Year & Next Year)
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

    // -- Create Modal States --
    const [openModal, setOpenModal] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // -- Form States --
    const [formData, setFormData] = useState({
        classCode: "", // Added classCode
        className: "",
        subjectId: "",
        semesterName: SEMESTERS[0].semesterName,
        enrolKey: "", // Added enrolKey
        dateEnd: ""   // Added dateEnd
    });


    // Fetch Classrooms
    const fetchClassrooms = async () => {
        let currentUserId = user?.id;

        // Fallback to localStorage if user context is not yet ready
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
            setLoading(true)
            const url = `${Api.Classroom.GET_LECTURER_CLASSROOMS}/${currentUserId}`;
            console.log("Fetching classrooms from:", url);

            const res = await axiosInstance.get(url)
            console.log("API Response:", res.data);

            if (res.data?.dataResponse) {
                console.log("Setting classrooms state:", res.data.dataResponse);
                setClassrooms(res.data?.dataResponse || [])
            } else {
                console.warn("No dataResponse in API result");
                setClassrooms([])
            }
        } catch (err) {
            console.error("Fetch classrooms failed", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClassrooms()
    }, [axiosInstance, user?.id])


    // Fetch Subjects when Modal opens
    useEffect(() => {
        if (openModal) {
            const fetchData = async () => {
                try {
                    const subRes = await axiosInstance.get(Api.Subject.GET_ALL_SUBJECTS);
                    const allSubjects: Subject[] = subRes.data?.dataResponse || [];
                    const activeSubjects = allSubjects.filter(s => !s.isDeleted);
                    setSubjects(activeSubjects);

                    // Set default subject if available
                    if (activeSubjects.length > 0) {
                        setFormData(prev => ({ ...prev, subjectId: activeSubjects[0].id }));
                    }

                } catch (error) {
                    console.error("Failed to fetch form data", error);
                    showError("Không thể tải danh sách môn học");
                }
            };
            fetchData();
        }
    }, [openModal, axiosInstance]);


    // Handle Create Submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setModalLoading(true);
            // Get current user ID (Lecturer ID)
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
                showError("Không tìm thấy thông tin giảng viên. Vui lòng đăng nhập lại.");
                setModalLoading(false);
                return;
            }

            // Validation
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

            // Construct payload - adjust based on actual API requirements
            const payload = {
                classCode: formData.classCode,
                className: formData.className,
                lecturerId: currentUserId,
                subjectId: formData.subjectId,
                semesterName: formData.semesterName,
                enrolKey: formData.enrolKey,
                endDate: formData.dateEnd // Send as string or Date object depending on axios config, usually ISO string is safe
            };

            await axiosInstance.post(Api.Classroom.CREATE_CLASSROOM, payload);
            showSuccess("Tạo lớp học thành công!");
            setOpenModal(false);
            fetchClassrooms(); // Refresh list

            // Reset form
            setFormData({
                classCode: "",
                className: "",
                subjectId: subjects[0]?.id || "",
                semesterName: SEMESTERS[0].semesterName,
                enrolKey: "",
                dateEnd: ""
            });

        } catch (error) {
            console.error("Create classroom failed", error);
            showError("Tạo lớp học thất bại. Vui lòng thử lại.");
        } finally {
            setModalLoading(false);
        }
    };


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
        if (selectedSemesterFilter !== "All") {
            result = result.filter(c => c.semesterName === selectedSemesterFilter);
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
    }, [classrooms, searchTerm, selectedSemesterFilter, sortBy]);

    // Get unique semesters for filter dropdown
    const semestersForFilter = useMemo(() => {
        const unique = new Set(classrooms.map(c => c.semesterName));
        return ["All", ...Array.from(unique)];
    }, [classrooms]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <HomeNavbar />
                <div className="flex-grow flex justify-center items-center">
                    <Spinner size="xl" color="info" />
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <HomeNavbar />

            <main className="flex-grow container mx-auto px-4 pt-24 pb-12 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Quản lý lớp học
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Danh sách các lớp học bạn đang phụ trách
                        </p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] enabled:hover:bg-gradient-to-l focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                        onClick={() => setOpenModal(true)}
                    >
                        + Tạo lớp học mới
                    </Button>
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
                                value={selectedSemesterFilter}
                                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                            >
                                {semestersForFilter.map(sem => (
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


                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClassrooms.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                            Không tìm thấy lớp học nào.
                        </div>
                    ) : (
                        filteredClassrooms.map((c) => (
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
                                            <span className="font-semibold text-[#1F4E79] dark:text-[#C9A24D]">Môn:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-200">{c.subject.subjectName}</span>
                                        </p>

                                        <p className="flex items-center gap-2">
                                            <span className="font-semibold text-[#1F4E79] dark:text-[#C9A24D]">Thời gian:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-200">
                                                {new Date(c.createdDate).toLocaleDateString("vi-VN")} –{" "}
                                                {new Date(c.endDate).toLocaleDateString("vi-VN")}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div className="mt-auto flex gap-2">
                                        <Link href={`/manage-classroom/${c.id}`} className="flex-1">
                                            <Button
                                                color="gray"
                                                outline
                                                className="
                                                    w-full
                                                    rounded-xl
                                                    border-gray-300 dark:border-gray-600
                                                    hover:!bg-[#1F4E79] hover:!text-white hover:!border-[#1F4E79]
                                                    dark:hover:!bg-[#C9A24D] dark:hover:!text-white dark:hover:!border-[#C9A24D]
                                                    font-semibold
                                                "
                                            >
                                                Chi tiết
                                            </Button>
                                        </Link>
                                    </div>

                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </main>

            <Footer />

            {/* Create Modal */}
            <Modal show={openModal} onClose={() => setOpenModal(false)}>
                <ModalHeader>Tạo lớp học mới</ModalHeader>
                <ModalBody>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="classCode">Mã lớp <span className="text-red-500">*</span></Label>
                            </div>
                            <TextInput
                                id="classCode"
                                placeholder="Nhập mã lớp (VD: SE123)"
                                required
                                value={formData.classCode}
                                onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                            />
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="className">Tên lớp học <span className="text-red-500">*</span></Label>
                            </div>
                            <TextInput
                                id="className"
                                placeholder="Nhập tên lớp học (VD: Software Engineering)"
                                required
                                value={formData.className}
                                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                                maxLength={100}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Tối đa 100 ký tự.
                            </p>
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="subject">Môn học <span className="text-red-500">*</span></Label>
                            </div>
                            <Select
                                id="subject"
                                required
                                value={formData.subjectId}
                                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            >
                                {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.subjectCode} - {sub.subjectName}</option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="semester">Học kỳ <span className="text-red-500">*</span></Label>
                            </div>
                            <Select
                                id="semester"
                                required
                                value={formData.semesterName}
                                onChange={(e) => setFormData({ ...formData, semesterName: e.target.value })}
                            >
                                {SEMESTERS.map(sem => (
                                    <option key={sem.id} value={sem.semesterName}>{sem.semesterName}</option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="enrolKey">Mã tham gia (Enrol Key)</Label>
                            </div>
                            <TextInput
                                id="enrolKey"
                                placeholder="6-20 ký tự, phải có ký tự đặc biệt, không khoảng trắng"
                                type="password"
                                value={formData.enrolKey}
                                onChange={(e) => setFormData({ ...formData, enrolKey: e.target.value })}
                                pattern="^(?=.*[^a-zA-Z0-9])\S{6,20}$"
                                title="EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                6-20 ký tự, bao gồm ít nhất 1 ký tự đặc biệt, không có khoảng trắng.
                            </p>
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="dateEnd">Ngày kết thúc <span className="text-red-500">*</span></Label>
                            </div>
                            <TextInput
                                id="dateEnd"
                                type="date"
                                required
                                value={formData.dateEnd}
                                onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                            />
                        </div>

                        {/* Optional Description or other fields can go here */}

                        <div className="flex justify-end gap-2 mt-6">
                            <Button color="gray" onClick={() => setOpenModal(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={modalLoading} className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]">
                                {modalLoading ? <Spinner size="sm" className="mr-2" /> : "Tạo lớp học"}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>

        </div>
    )
}
