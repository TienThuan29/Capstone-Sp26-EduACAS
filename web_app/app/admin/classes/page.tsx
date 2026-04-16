"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import {
  Button,
  Label,
  TextInput,
  Select,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Avatar,
  Pagination,
  Modal,
  ModalHeader,
  ModalBody
} from "flowbite-react"
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline"
import { motion, AnimatePresence } from "framer-motion"
import { useClassroom } from "@/hooks/classroom/useClassroom"
import { useSubject } from "@/hooks/subject/useSubject"
import { useUserManagement } from "@/hooks/user/useUserManagement"
import type { Classroom } from "@/types/classroom"
import { DefaultCustomButton } from "@/components/ui/custom-button"
import { formatDate, toLocalDatetimeString, toUtcIsoString } from "@/utils/datetime-utils"
import { useToast } from "@/hooks/useToast"

interface ClassData {
  id: string
  name: string
  code: string
  subject: string
  subjectId: string
  teacher: string
  teacherEmail: string
  teacherId: string
  teacherAvatar?: string
  students: number
  maxSlot: number
  semester: string
  enrolKey: string
  createdDate: string
  updatedDate: string | null
  endDate: string
  status: "active" | "deleted" | "completed"
  isDeleted: boolean
}

function mapClassroomToClassData(c: Classroom): ClassData {
  const now = new Date()
  const endDate = c.endDate ? new Date(c.endDate) : null

  let status: ClassData["status"] = "active"
  if (c.isDeleted) {
    status = "deleted"
  } else if (endDate && now > endDate) {
    status = "completed"
  }

  return {
    id: c.id,
    name: c.className,
    code: c.classCode,
    subject: c.subject.subjectName,
    subjectId: c.subject.subjectId,
    teacher: c.lecturer.fullname,
    teacherEmail: c.lecturer.email,
    teacherId: (c.lecturer as any).lecturerId || (c.lecturer as any).id,
    teacherAvatar: c.lecturer.avatarUrl,
    students: c.studentCount || 0,
    maxSlot: c.maxSlot || 0,
    enrolKey: c.enrolKey,
    createdDate: c.createdDate,
    updatedDate: c.updatedDate,
    endDate: c.endDate,
    semester: c.semesterName,
    status,
    isDeleted: c.isDeleted
  }
}

export default function ClassesManagement() {
  const { isDark } = useThemeContext()
  const { showSuccess, showError } = useToast()
  const { getAllClassrooms, softDeleteClassroom, updateClassroom, createClassroom } = useClassroom()
  const { getAllSubjects } = useSubject()
  const { getAllUsers } = useUserManagement()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const semesters = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    const seasons = ["Spring", "Summer", "Fall"];
    const result: { id: string; name: string }[] = [];
    years.forEach((year) => {
      seasons.forEach((season) => {
        result.push({
          id: `${season.toLowerCase()}-${year}`,
          name: `${season} ${year}`,
        });
      });
    });
    return result;
  }, []);

  const [createFormData, setCreateFormData] = useState({
    classCode: "",
    className: "",
    subjectId: "",
    lecturerId: "",
    semesterName: semesters[0].name,
    enrolKey: "",
    endDate: "",
    maxSlot: 40
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [editData, setEditData] = useState<ClassData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllClassrooms(undefined, searchTerm || undefined, filterStatus === "all" ? undefined : filterStatus, currentPage, pageSize)
      const items = (result?.items ?? []) as Classroom[]
      setClasses(items.map(mapClassroomToClassData))
      setTotalPages(result?.totalPages ?? 1)
      setTotalCount(result?.totalCount ?? 0)
    } catch {
      setClasses([])
    } finally {
      setLoading(false)
    }
  }, [getAllClassrooms, currentPage, pageSize, searchTerm, filterStatus])

  const onPageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: string) => {
    setFilterStatus(value)
    setCurrentPage(1)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchClasses()
      loadSubjects()
      loadLecturers()
    }
  }, [mounted, fetchClasses])

  const loadSubjects = async () => {
    try {
      const data = await getAllSubjects()
      setSubjects(data)
      if (data.length > 0) {
        setCreateFormData(prev => ({ ...prev, subjectId: data[0].id }))
      }
    } catch (error) {
      console.error("Failed to load subjects:", error)
    }
  }

  const loadLecturers = async () => {
    try {
      const users = await getAllUsers()
      const lecs = users.filter((u: any) => u.role === 'LECTURER')
      setLecturers(lecs)
      if (lecs.length > 0) {
        setCreateFormData(prev => ({ ...prev, lecturerId: lecs[0].id }))
      }
    } catch (error) {
      console.error("Failed to load lecturers:", error)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFormData.subjectId || !createFormData.lecturerId) {
      showError("Please select both a subject and a lecturer")
      return
    }

    if (new Date(createFormData.endDate) <= new Date()) {
      showError("End date must be in the future")
      return
    }

    try {
      setIsCreating(true)
      await createClassroom({
        classCode: createFormData.classCode,
        className: createFormData.className,
        lecturerId: createFormData.lecturerId,
        subjectId: createFormData.subjectId,
        semesterName: createFormData.semesterName,
        enrolKey: createFormData.enrolKey || undefined,
        endDate: toUtcIsoString(createFormData.endDate),
        maxSlot: createFormData.maxSlot
      })

      showSuccess("Classroom created successfully")
      setIsCreateModalOpen(false)
      fetchClasses()
      setCreateFormData({
        classCode: "",
        className: "",
        subjectId: subjects[0]?.id || "",
        lecturerId: lecturers[0]?.id || "",
        semesterName: semesters[0].name,
        enrolKey: "",
        endDate: "",
        maxSlot: 40
      })
    } catch (error: any) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const messages = Object.values(serverErrors).flat();
        showError(messages[0] as string);
      } else {
        showError("Failed to create classroom")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editData) return
    try {
      setLoading(true)
      const updatedRes = await updateClassroom(editData.id, {
        id: editData.id,
        className: editData.name,
        classCode: editData.code,
        lecturerId: editData.teacherId,
        subjectId: editData.subjectId,
        semesterName: editData.semester,
        enrolKey: editData.enrolKey,
        endDate: toUtcIsoString(editData.endDate),
        maxSlot: editData.maxSlot
      })

      if (updatedRes) {
        const mapped = mapClassroomToClassData(updatedRes as any)
        setSelectedClass(mapped)
        setEditData(JSON.parse(JSON.stringify(mapped)))
      }

      fetchClasses()
      setIsEditing(false)
      showSuccess("Classroom updated successfully")

    } catch (error: any) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const messages = Object.values(serverErrors).flat();
        showError(messages[0] as string);
      } else {
        showError("Failed to update classroom");
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (cls: ClassData) => {
    setSelectedClass(cls)
    setEditData(JSON.parse(JSON.stringify(cls)))
    setIsEditing(false)
    setIsDrawerOpen(true)
  }

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedClass?.id) return
    try {
      setLoading(true)
      await softDeleteClassroom(selectedClass.id)
      setIsDeleteModalOpen(false)
      setIsDrawerOpen(false)
      showSuccess("Classroom deleted successfully")
      await fetchClasses()
    } catch (error) {
      showError("Failed to delete classroom")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'ACTIVE', color: 'green' as const },
      completed: { label: 'COMPLETED', color: 'info' as const },
      deleted: { label: 'DELETED', color: 'red' as const },
      pending: { label: 'PENDING', color: 'yellow' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <div className="w-fit"><Badge color={config.color} className="font-bold tracking-wider">{config.label}</Badge></div>
  }

  // const semesterOptions = [
  //   { label: 'Spring 2025', value: 'Spring 2025' },
  //   { label: 'Summer 2025', value: 'Summer 2025' },
  //   { label: 'Fall 2025', value: 'Fall 2025' },
  //   { label: 'Spring 2026', value: 'Spring 2026' },
  // ]

  const subjectOptions = subjects.map(s => ({
    label: `${s.subjectCode} - ${s.subjectName}`,
    value: s.id
  }))

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Classroom Management</h1>
            <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage all academic classrooms in the system</p>
          </div>
          <DefaultCustomButton
            label="Create New Class"
            icon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsCreateModalOpen(true)}
          />
        </div>

        <div className={`p-6 rounded-md border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <form className="grow max-w-md flex gap-3" onSubmit={(e) => { e.preventDefault(); fetchClasses(); }}>
              <div className="flex-1">
                <TextInput
                  id="searchClasses"
                  type="text"
                  placeholder="Search classes..."
                  required={false}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  icon={MagnifyingGlassIcon}
                  theme={{
                    field: {
                      input: {
                        colors: {
                          gray: `${isDark ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500" : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500"}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </form>

            <div className="w-full md:w-32">
              <Select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full"
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="completed">COMPLETED</option>
                <option value="deleted">DELETED</option>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table hoverable={true}>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Classroom</TableHeadCell>
                  <TableHeadCell>Subject</TableHeadCell>
                  <TableHeadCell className="text-center">Lecturer</TableHeadCell>
                  <TableHeadCell className="text-center">Students</TableHeadCell>
                  <TableHeadCell className="text-center">Status</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y-0">
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Spinner size="xl" /></TableCell></TableRow>
                ) : classes.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No classrooms found</TableCell></TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow
                      key={cls.id}
                      className={`cursor-pointer transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                      onClick={() => handleRowClick(cls)}
                    >
                      <TableCell className="max-w-xs">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-fit">
                            <Badge color="info">
                              <span className="font-medium uppercase tracking-wider">{cls.code}</span>
                            </Badge>
                          </div>
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{cls.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-medium">{cls.subject}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Avatar img={cls.teacherAvatar} rounded size="sm" />
                          <div className="flex flex-col text-left">
                            <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{cls.teacher}</span>
                            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{cls.teacherEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                        {cls.students}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(cls.status)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                showIcons
              />
            </div>
          )}
        </div>

        <ClassroomDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          selectedClass={selectedClass}
          editData={editData}
          setEditData={setEditData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          subjectOptions={subjectOptions}
          onUpdate={handleUpdate}
          onDelete={handleDeleteClick}
          getStatusBadge={getStatusBadge}
        />

        <CreateClassroomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          formData={createFormData}
          onChange={(data) => setCreateFormData(prev => ({ ...prev, ...data }))}
          isCreating={isCreating}
          subjects={subjects}
          lecturers={lecturers}
          semesters={semesters}
          onSubmit={handleCreateSubmit}
        />

        <DeleteClassroomModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          classroomName={selectedClass?.name}
          loading={loading}
          onConfirm={handleConfirmDelete}
        />
      </main>
    </div>
  )
}

const DetailItem = ({ label, value, labelDisplay, isEditing, onChange, type = 'text', options = [] }: {
  label: string,
  value: any,
  labelDisplay?: string,
  isEditing?: boolean,
  onChange?: (val: any) => void,
  type?: 'text' | 'select' | 'readonly' | 'datetime-local',
  options?: { label: string, value: string }[]
}) => {
  const { isDark } = useThemeContext()
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{label}</label>
      {isEditing && type !== 'readonly' ? (
        type === 'select' ? (
          <div className="relative group flex items-stretch">
            <Select
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="flex-1 min-w-0 [&>select]:appearance-none [&>select]:bg-none [&>select]:pr-12"
            >
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
            <div className={`absolute right-0 inset-y-0 w-10 flex items-center justify-center pointer-events-none border-l rounded-r-lg transition-colors ${isDark
                ? "bg-gray-700/50 border-gray-600 text-gray-400 group-hover:text-blue-400"
                : "bg-gray-50 border-gray-300 text-gray-500 group-hover:text-blue-500"
              }`}>
              <ChevronDownIcon className="w-4 h-4" />
            </div>
          </div>
        ) : type === 'datetime-local' ? (
          <TextInput type="datetime-local" value={value || ""} onChange={(e) => onChange?.(e.target.value)} className="w-full" />
        ) : (
          <TextInput value={value || ""} onChange={(e) => onChange?.(e.target.value)} className="w-full" />
        )
      ) : (
        <div className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"} leading-relaxed`}>
          {labelDisplay ?? value ?? '—'}
        </div>
      )}
    </div>
  )
}

// ─── Classroom Drawer ────────────────────────────────────────────────────────

interface ClassroomDrawerProps {
  isDrawerOpen: boolean
  setIsDrawerOpen: (v: boolean) => void
  selectedClass: ClassData | null
  editData: ClassData | null
  setEditData: React.Dispatch<React.SetStateAction<ClassData | null>>
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  subjectOptions: { label: string; value: string }[]
  onUpdate: () => void
  onDelete: () => void
  getStatusBadge: (status: string) => React.ReactNode
}

function ClassroomDrawer({
  isDrawerOpen, setIsDrawerOpen,
  selectedClass, editData, setEditData, isEditing, setIsEditing,
  subjectOptions,
  onUpdate, onDelete, getStatusBadge,
}: ClassroomDrawerProps) {
  const { isDark } = useThemeContext()

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-screen w-[550px] shadow-2xl z-50 flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Classroom Overview</span>
                <h2 className="text-xl font-bold dark:text-white text-gray-900">Details & Management</h2>
              </div>
              <Button className="cursor-pointer" color="gray" pill size="xs" onClick={() => setIsDrawerOpen(false)}>
                <XMarkIcon className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              <div className="h-full flex flex-col justify-between gap-y-10 min-h-[500px]">
                <div className="grid grid-cols-2 gap-x-10">
                  <DetailItem label="Classroom Name" value={isEditing ? editData?.name : selectedClass?.name}
                    isEditing={isEditing} onChange={(val) => setEditData(prev => prev ? { ...prev, name: val } : null)} />
                  <DetailItem label="Class Code" value={isEditing ? editData?.code : selectedClass?.code}
                    isEditing={isEditing} onChange={(val) => setEditData(prev => prev ? { ...prev, code: val } : null)} />
                </div>

                <div className="grid grid-cols-2 gap-x-10">
                  <DetailItem label="Semester" value={isEditing ? editData?.semester : selectedClass?.semester}
                    isEditing={isEditing}
                    onChange={(val) => setEditData(prev => prev ? { ...prev, semester: val } : null)} />
                  <DetailItem label="Subject" value={isEditing ? editData?.subjectId : selectedClass?.subjectId}
                    labelDisplay={isEditing ? subjectOptions.find(o => o.value === editData?.subjectId)?.label : selectedClass?.subject}
                    isEditing={isEditing} type="select" options={subjectOptions}
                    onChange={(val) => setEditData(prev => prev ? { ...prev, subjectId: val } : null)} />
                </div>

                <div className="grid grid-cols-2 gap-x-10">
                  <div className="flex flex-col space-y-2">
                    <label className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Lecturer</label>
                    <div className="flex items-center gap-3">
                      <Avatar img={selectedClass?.teacherAvatar} size="sm" rounded />
                      <div className="flex flex-col">
                        <span className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"} leading-none`}>{selectedClass?.teacher}</span>
                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}>{selectedClass?.teacherEmail}</span>
                      </div>
                    </div>
                  </div>
                  <DetailItem label="Students" value={selectedClass?.students} isEditing={isEditing} type="readonly" />
                </div>

                <div className="grid grid-cols-2 gap-x-10">
                  <DetailItem label="Enrollment Key" value={isEditing ? editData?.enrolKey : selectedClass?.enrolKey}
                    isEditing={isEditing} onChange={(val) => setEditData(prev => prev ? { ...prev, enrolKey: val } : null)} />
                  <DetailItem label="Status" value={selectedClass && getStatusBadge(selectedClass.status)} isEditing={isEditing} type="readonly" />
                </div>

                <div className="grid grid-cols-2 gap-x-10 pb-6">
                  <DetailItem label="Created Date" value={formatDate(selectedClass?.createdDate || "")} isEditing={isEditing} type="readonly" />
                  <DetailItem label="End Date" value={toLocalDatetimeString(isEditing ? editData?.endDate : selectedClass?.endDate)}
                    labelDisplay={formatDate(isEditing ? editData?.endDate : (selectedClass?.endDate || ""))}
                    isEditing={isEditing} type="datetime-local"
                    onChange={(val) => setEditData(prev => prev ? { ...prev, endDate: val } : null)} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
              {selectedClass?.status !== 'deleted' && (
                <>
                  {isEditing ? (
                    <>
                      <Button color="blue" className="cursor-pointer" onClick={onUpdate}>Save Changes</Button>
                      <Button color="gray" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button color="blue" className="cursor-pointer" onClick={() => setIsEditing(true)}>Update</Button>
                      <Button color="red" outline onClick={onDelete}><TrashIcon className="w-5 h-5" /></Button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Create Classroom Modal ──────────────────────────────────────────────────

interface CreateClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  formData: {
    classCode: string
    className: string
    subjectId: string
    lecturerId: string
    semesterName: string
    enrolKey: string
    endDate: string
    maxSlot: number
  }
  onChange: (data: Partial<CreateClassroomModalProps["formData"]>) => void
  isCreating: boolean
  subjects: any[]
  lecturers: any[]
  semesters: { id: string; name: string }[]
  onSubmit: (e: React.FormEvent) => void
}

function CreateClassroomModal({
  isOpen, onClose, formData, onChange, isCreating,
  subjects, lecturers, semesters, onSubmit,
}: CreateClassroomModalProps) {
  const { isDark } = useThemeContext()

  return (
    <Modal show={isOpen} onClose={onClose}>
      <ModalHeader>Create new classroom</ModalHeader>
      <ModalBody className={isDark ? "bg-gray-800" : "bg-white"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="create-code">
              Classroom code <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="create-code"
              placeholder="Enter classroom code (e.g. SE123)"
              required
              value={formData.classCode}
              onChange={(e) => onChange({ classCode: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="create-name">
              Classroom name <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="create-name"
              placeholder="Enter classroom name (e.g. Software Engineering)"
              required
              value={formData.className}
              onChange={(e) => onChange({ className: e.target.value })}
              maxLength={100}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum 100 characters.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-lecturer">
                Assigned Lecturer <span className="text-red-500">*</span>
              </Label>
              <Select
                id="create-lecturer"
                required
                value={formData.lecturerId}
                onChange={(e) => onChange({ lecturerId: e.target.value })}
                className="mt-1"
              >
                {lecturers.map(lec => (
                  <option key={lec.id} value={lec.id}>{lec.fullname} ({lec.email})</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="create-max">
                Max Slot <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="create-max"
                type="number"
                placeholder="Enter max slot (e.g. 30)"
                required
                value={formData.maxSlot}
                onChange={(e) => onChange({ maxSlot: parseInt(e.target.value) })}
                min={2}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select
                id="create-subject"
                required
                value={formData.subjectId}
                onChange={(e) => onChange({ subjectId: e.target.value })}
                className="mt-1"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.subjectCode} - {sub.subjectName}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="create-semester">
                Semester <span className="text-red-500">*</span>
              </Label>
              <Select
                id="create-semester"
                required
                value={formData.semesterName}
                onChange={(e) => onChange({ semesterName: e.target.value })}
                className="mt-1"
              >
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.name}>{sem.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="create-enrol">Enrol key</Label>
            <TextInput
              id="create-enrol"
              placeholder="Leave blank for auto-generate"
              type="password"
              value={formData.enrolKey}
              onChange={(e) => onChange({ enrolKey: e.target.value })}
              className="mt-1"
            />
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-500">
              <li>6-20 characters, must contain at least one special character, and must not contain spaces.</li>
              <li>If you don&apos;t want to set an enrol key, it is automatically generated.</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="create-end">
              End Date <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="create-end"
              type="datetime-local"
              required
              value={formData.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
            <DefaultCustomButton
              label={isCreating ? "Creating..." : "Create classroom"}
              type="submit"
              disabled={isCreating}
            />
          </div>
        </form>
      </ModalBody>
    </Modal>
  )
}

// ─── Delete Classroom Modal ─────────────────────────────────────────────────

interface DeleteClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  classroomName: string | undefined
  loading: boolean
  onConfirm: () => void
}

function DeleteClassroomModal({ isOpen, onClose, classroomName, loading, onConfirm }: DeleteClassroomModalProps) {
  const { isDark } = useThemeContext()

  return (
    <Modal
      show={isOpen}
      size="md"
      onClose={onClose}
      popup
      theme={{
        root: {
          base: "fixed inset-x-0 bottom-0 z-[200] h-modal w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0 md:h-full"
        }
      }}
    >
      <ModalHeader />
      <ModalBody className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl`}>
        <div>
          <h3 className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Confirm delete
          </h3>
          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Are you sure you want to delete the classroom{" "}
            <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              &quot;{classroomName}&quot;
            </span>{" "}
            ?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="cursor-pointer px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                "Delete classroom"
              )}
            </button>
            <button
              onClick={onClose}
              className={`cursor-pointer px-6 py-2.5 font-bold rounded-xl transition-colors ${isDark
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-[#374151] text-white hover:bg-gray-600"
                }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}
