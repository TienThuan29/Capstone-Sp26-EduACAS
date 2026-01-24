"use client"

import { useEffect, useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button, TextInput, Modal, ModalHeader, ModalBody, ModalFooter, Label, Textarea, Spinner, Select } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import useAxios from "@/hooks/useAxios"
import { Api } from "@/configs/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { PencilIcon as HiPencil, TrashIcon as HiTrash, PlusIcon as HiPlus, EyeIcon as HiEye } from "@heroicons/react/24/solid"

interface Subject {
    id: string
    subjectCode: string
    subjectName: string
    description: string
    createdBy: string
    createdDate: string
    updatedDate?: string
    isDeleted: boolean
}

export default function ManageSubjectPage() {
    const { showSuccess, showError } = useToast()
    const axiosInstance = useAxios()
    const { user } = useAuth()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // -- Search State --
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all") // "all" | "active" | "deleted"

    // -- Modal States --
    const [openModal, setOpenModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null)

    // -- Form State --
    const [formData, setFormData] = useState({
        subjectCode: "",
        subjectName: "",
        description: ""
    })

    // -- Delete Confirmation State --
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)

    // -- View Description State --
    const [openViewModal, setOpenViewModal] = useState(false)
    const [viewDescription, setViewDescription] = useState("")
    const [viewSubjectName, setViewSubjectName] = useState("")

    // Fetch Subjects
    const fetchSubjects = async () => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(Api.Subject.GET_ALL_SUBJECTS)
            if (res.data?.dataResponse) {
                // Filter out deleted subjects if the API returns them (though usually soft-delete hides them, unless specified)
                // If API returns all, we might want to filter client side or just show them with a status. 
                // Creating a "Manage" page usually implies seeing active ones. 
                // Based on User Request "xóa mềm", usually that means they disappear from the main list.
                // Let's assume the GET_ALL returns everything or just active. I'll filter !isDeleted just in case.
                const allSubjects: Subject[] = res.data.dataResponse
                setSubjects(allSubjects)
            } else {
                setSubjects([])
            }
        } catch (err) {
            console.error("Fetch subjects failed", err)
            showError("Không thể tải danh sách môn học")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [axiosInstance])

    // Filtered Subjects
    const filteredSubjects = useMemo(() => {
        let result = subjects

        // Filter by Status
        if (statusFilter !== "all") {
            const isDeleting = statusFilter === "deleted"
            result = result.filter(s => s.isDeleted === isDeleting)
        }

        // Filter by Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            result = result.filter(s =>
                s.subjectCode.toLowerCase().includes(lowerTerm) ||
                s.subjectName.toLowerCase().includes(lowerTerm)
            )
        }

        return result
    }, [subjects, searchTerm, statusFilter])

    // Open Modal for Create
    const handleOpenCreate = () => {
        setFormData({
            subjectCode: "",
            subjectName: "",
            description: ""
        })
        setIsEditing(false)
        setCurrentSubjectId(null)
        setOpenModal(true)
    }

    // Open Modal for Edit
    const handleOpenEdit = (subject: Subject) => {
        setFormData({
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            description: subject.description
        })
        setIsEditing(true)
        setCurrentSubjectId(subject.id)
        setOpenModal(true)
    }

    // Handle Submit (Create or Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let currentUserId = user?.id
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

        if (!currentUserId && !isEditing) {
            showError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.")
            return
        }

        try {
            setActionLoading(true)
            if (isEditing && currentSubjectId) {
                // Update
                const payload = {
                    id: currentSubjectId, // Include ID in the body for backend validation
                    subjectCode: formData.subjectCode,
                    subjectName: formData.subjectName,
                    description: formData.description
                }
                await axiosInstance.put(`${Api.Subject.UPDATE_SUBJECT}/${currentSubjectId}`, payload)
                showSuccess("Cập nhật môn học thành công")
            } else {
                // Create
                const payload = {
                    subjectCode: formData.subjectCode,
                    subjectName: formData.subjectName,
                    description: formData.description,
                    createdBy: currentUserId
                }
                await axiosInstance.post(Api.Subject.CREATE_SUBJECT, payload)
                showSuccess("Tạo môn học thành công")
            }
            setOpenModal(false)
            fetchSubjects()
        } catch (error: any) {
            console.error("Submit subject failed", error)
            const errorMsg = error.response?.data?.message || (isEditing ? "Cập nhật thất bại" : "Tạo mới thất bại")
            showError(errorMsg)
        } finally {
            setActionLoading(false)
        }
    }

    // Handle Delete
    const handleDeleteClick = (subject: Subject) => {
        setSubjectToDelete(subject)
        setOpenDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!subjectToDelete) return
        try {
            setActionLoading(true)
            await axiosInstance.patch(`${Api.Subject.SOFT_DELETE_SUBJECT}/${subjectToDelete.id}/soft-delete`)
            showSuccess("Xóa môn học thành công")
            setOpenDeleteModal(false)
            setSubjectToDelete(null)
            fetchSubjects()
        } catch (error) {
            console.error("Delete subject failed", error)
            showError("Xóa thất bại")
        } finally {
            setActionLoading(false)
        }
    }

    // Handle View Description
    const handleViewDescription = (subject: Subject) => {
        setViewDescription(subject.description)
        setViewSubjectName(subject.subjectName)
        setOpenViewModal(true)
    }

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
                            Quản lý Môn học
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Quản lý danh sách các môn học trong hệ thống
                        </p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] enabled:hover:bg-gradient-to-l focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                        onClick={handleOpenCreate}
                    >
                        <HiPlus className="mr-2 h-5 w-5" />
                        Tạo môn học mới
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="max-w-md flex-grow">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã môn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={() => (
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            id="status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="deleted">Đã xóa</option>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                    <Table hoverable>
                        <TableHead>
                            <TableHeadCell className="text-center">Mã môn</TableHeadCell>
                            <TableHeadCell className="text-center">Tên môn học</TableHeadCell>
                            <TableHeadCell className="text-center">Mô tả</TableHeadCell>
                            <TableHeadCell className="text-center">Trạng thái</TableHeadCell>
                            <TableHeadCell className="text-center">Ngày tạo</TableHeadCell>
                            <TableHeadCell className="text-center">
                                <span className="sr-only">Hành động</span>
                            </TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y">
                            {filteredSubjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Không tìm thấy môn học nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSubjects.map((subject) => (
                                    <TableRow key={subject.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white text-center">
                                            {subject.subjectCode}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {subject.subjectName}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="xs"
                                                color="light"
                                                onClick={() => handleViewDescription(subject)}
                                                className="mx-auto border-none focus:ring-0"
                                            >
                                                <HiEye className="h-5 w-5 text-gray-500 hover:text-blue-600 transition-colors" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {subject.isDeleted ? (
                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                    Đã xóa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    Hoạt động
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {new Date(subject.createdDate).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    size="xs"
                                                    color="gray"
                                                    onClick={() => handleOpenEdit(subject)}
                                                >
                                                    <HiPencil className="h-5 w-5 text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="gray"
                                                    onClick={() => handleDeleteClick(subject)}
                                                    disabled={subject.isDeleted}
                                                    className={subject.isDeleted ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                    <HiTrash className={`h-5 w-5 ${subject.isDeleted ? "text-gray-400" : "text-red-600"}`} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>

            <Footer />

            {/* Create/Edit Modal */}
            <Modal show={openModal} onClose={() => setOpenModal(false)}>
                <ModalHeader>{isEditing ? "Chỉnh sửa môn học" : "Tạo môn học mới"}</ModalHeader>
                <ModalBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="subjectCode">Mã môn học <span className="text-red-500">*</span></Label>
                            </div>
                            <TextInput
                                id="subjectCode"
                                placeholder="VD: SWP490"
                                required
                                value={formData.subjectCode}
                                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="subjectName">Tên môn học <span className="text-red-500">*</span></Label>
                            </div>
                            <TextInput
                                id="subjectName"
                                placeholder="VD: Software Project"
                                required
                                value={formData.subjectName}
                                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="description">Mô tả</Label>
                            </div>
                            <Textarea
                                id="description"
                                placeholder="Mô tả về môn học..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button color="gray" onClick={() => setOpenModal(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={actionLoading} className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]">
                                {actionLoading ? <Spinner size="sm" className="mr-2" /> : (isEditing ? "Cập nhật" : "Tạo mới")}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={openDeleteModal} size="md" onClose={() => setOpenDeleteModal(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 text-red-600 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900 dark:text-red-200">
                            <HiTrash className="h-10 w-10" />
                        </div>
                        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                            Xác nhận xóa
                        </h3>
                        <p className="mb-6 text-gray-500 dark:text-gray-400">
                            Bạn có chắc chắn muốn xóa môn học <span className="font-semibold text-gray-900 dark:text-white">"{subjectToDelete?.subjectName}"</span> không?
                            <br />
                            Hành động này sẽ chuyển trạng thái sang "Đã xóa".
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button color="failure" onClick={confirmDelete} disabled={actionLoading} className="px-4">
                                {actionLoading ? <Spinner size="sm" className="mr-2" /> : "Xóa môn học"}
                            </Button>
                            <Button color="gray" onClick={() => setOpenDeleteModal(false)} className="px-4">
                                Hủy bỏ
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* View Description Modal */}
            <Modal show={openViewModal} onClose={() => setOpenViewModal(false)}>
                <ModalHeader>Mô tả môn học: {viewSubjectName}</ModalHeader>
                <ModalBody>
                    <div className="space-y-6">
                        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                            {viewDescription || "Không có mô tả nào cho môn học này."}
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter className="justify-end">
                    <Button color="gray" onClick={() => setOpenViewModal(false)}>
                        Đóng
                    </Button>
                </ModalFooter>
            </Modal>

        </div>
    )
}
