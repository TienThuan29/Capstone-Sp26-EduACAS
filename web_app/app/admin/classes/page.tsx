"use client"

import { useState, useEffect, useCallback } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, TextInput, Select, Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Card, Spinner } from "flowbite-react"
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useClassroom, type Classroom } from "@/hooks/classroom/useClassroom"
import { DefaultCustomButton } from "@/components/ui/custom-button"

interface ClassData {
  id: string
  name: string
  code: string
  subject: string
  teacher: string
  students: number
  semester: string
  status: "active" | "inactive" | "completed"
}

function mapClassroomToClassData(c: Classroom): ClassData {
  const now = new Date()
  const endDate = c.endDate ? new Date(c.endDate) : null
  let status: ClassData["status"] = "active"
  if (c.isDeleted) status = "inactive"
  else if (endDate && endDate < now) status = "completed"

  return {
    id: c.id,
    name: c.className,
    code: c.classCode,
    subject: c.subject.subjectName,
    teacher: c.lecturer.fullname,
    students: 0,
    semester: c.semesterName,
    status,
  }
}

type ClassFormData = {
  name: string
  code: string
  subject: string
  teacher: string
  students: number
  semester: string
  status: 'active' | 'inactive' | 'completed'
}

type ClassModalProps = {
  show: boolean
  onClose: () => void
  formData: ClassFormData
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>
  onSubmit: (e: React.FormEvent) => void
  editingClass: ClassData | null
}

export default function ClassesManagement() {
  const { isDark } = useThemeContext()
  const { getAllClassrooms, softDeleteClassroom } = useClassroom()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassData | null>(null)
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    code: "",
    subject: "",
    teacher: "",
    students: 0,
    semester: "",
    status: "active",
  })

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllClassrooms(undefined, 1, 100)
      const items = (result?.items ?? []) as Classroom[]
      setClasses(items.map(mapClassroomToClassData))
    } catch {
      setClasses([])
    } finally {
      setLoading(false)
    }
  }, [getAllClassrooms])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) fetchClasses()
  }, [mounted, fetchClasses])

  if (!mounted) return null

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || cls.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleAddNew = () => {
    setEditingClass(null)
    setFormData({
      name: '',
      code: '',
      subject: '',
      teacher: '',
      students: 0,
      semester: '',
      status: 'active'
    })
    setIsModalOpen(true)
  }

  const handleEdit = (cls: ClassData) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      code: cls.code,
      subject: cls.subject,
      teacher: cls.teacher,
      students: cls.students,
      semester: cls.semester,
      status: cls.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return
    try {
      await softDeleteClassroom(id)
      await fetchClasses()
    } catch {
      // Optionally show toast on error
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClass) {
      setClasses(classes.map(cls => 
        cls.id === editingClass.id ? { ...cls, ...formData } : cls
      ))
    } else {
      const newClass: ClassData = {
        id: (classes.length + 1).toString(),
        ...formData
      }
      setClasses([...classes, newClass])
    }
    setIsModalOpen(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Đang hoạt động', color: 'success' as const },
      inactive: { label: 'Tạm ngưng', color: 'warning' as const },
      completed: { label: 'Hoàn thành', color: 'gray' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge color={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manage Classrooms
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all classrooms in the system
            </p>
          </div>
          <DefaultCustomButton
            label="Add New Classroom"
            icon={<PlusIcon className="h-5 w-5" />}
            onClick={handleAddNew}
            className="cursor-pointer"
          />
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <TextInput
                type="text"
                placeholder="Search classrooms, classroom code, lecturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </Card>

        {/* Classes Table */}
        <Card className="rounded-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="xl" color="info" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className={`py-16 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Không có lớp học nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Mã lớp</TableHeadCell>
                    <TableHeadCell>Tên lớp</TableHeadCell>
                    <TableHeadCell>Môn học</TableHeadCell>
                    <TableHeadCell>Giảng viên</TableHeadCell>
                    <TableHeadCell>Số sinh viên</TableHeadCell>
                    <TableHeadCell>Trạng thái</TableHeadCell>
                    <TableHeadCell>Thao tác</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                        {cls.code}
                      </TableCell>
                      <TableCell>{cls.name}</TableCell>
                      <TableCell>{cls.subject}</TableCell>
                      <TableCell>{cls.teacher}</TableCell>
                      <TableCell>{cls.students}</TableCell>
                      <TableCell>
                        {getStatusBadge(cls.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="xs" color="info" onClick={() => handleEdit(cls)}>
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button size="xs" color="failure" onClick={() => handleDelete(cls.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <ClassModal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          editingClass={editingClass}
        />
      </main>
    </div>
  )
}


function ClassModal({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  editingClass,
}: ClassModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>
        {editingClass ? "Edit Classroom" : "Add New Classroom"}
      </ModalHeader>
      <form onSubmit={onSubmit}>
        <ModalBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="mb-2">
                <Label htmlFor="name">Classroom name *</Label>
              </div>
              <TextInput
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter classroom name"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="code">Classroom code *</Label>
              </div>
              <TextInput
                id="code"
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Example: SE1801"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="subject">Subject *</Label>
              </div>
              <TextInput
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject name"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="teacher">Lecturer *</Label>
              </div>
              <TextInput
                id="teacher"
                type="text"
                required
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="Enter lecturer name"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="students">Number of students *</Label>
              </div>
              <TextInput
                id="students"
                type="number"
                required
                value={formData.students}
                onChange={(e) =>
                  setFormData({ ...formData, students: parseInt(e.target.value, 10) })
                }
                placeholder="0"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="semester">Semester *</Label>
              </div>
              <TextInput
                id="semester"
                type="text"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="Semester 1 - 2024"
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="status">Status *</Label>
              </div>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "inactive" | "completed",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color="blue">
            {editingClass ? "Update" : "Add new"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}