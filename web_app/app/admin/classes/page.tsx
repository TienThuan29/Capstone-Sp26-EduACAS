"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, TextInput, Select, Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Card } from "flowbite-react"
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ClassData {
  id: string
  name: string
  code: string
  subject: string
  teacher: string
  students: number
  semester: string
  status: 'active' | 'inactive' | 'completed'
}

export default function ClassesManagement() {
  const { isDark } = useThemeContext()
  const [mounted, setMounted] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([
    { id: '1', name: 'Lớp Kỹ thuật phần mềm 1', code: 'SE1801', subject: 'Software Engineering', teacher: 'Nguyễn Văn A', students: 45, semester: 'Học kỳ 1 - 2024', status: 'active' },
    { id: '2', name: 'Lớp Java Web', code: 'PRJ301', subject: 'Java Web Application', teacher: 'Trần Thị B', students: 38, semester: 'Học kỳ 1 - 2024', status: 'active' },
    { id: '3', name: 'Lớp Cơ sở dữ liệu', code: 'DBI202', subject: 'Database Introduction', teacher: 'Lê Văn C', students: 42, semester: 'Học kỳ 1 - 2024', status: 'active' },
    { id: '4', name: 'Lớp Lập trình C', code: 'PRF192', subject: 'Programming Fundamentals', teacher: 'Phạm Thị D', students: 50, semester: 'Học kỳ 2 - 2023', status: 'completed' },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subject: '',
    teacher: '',
    students: 0,
    semester: '',
    status: 'active' as 'active' | 'inactive' | 'completed'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      setClasses(classes.filter(cls => cls.id !== id))
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
              Quản lý lớp học
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Quản lý tất cả các lớp học trong hệ thống
            </p>
          </div>
          <Button color="blue" onClick={handleAddNew}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Thêm lớp học mới
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <TextInput
                type="text"
                placeholder="Tìm kiếm lớp học, mã lớp, giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="completed">Hoàn thành</option>
            </Select>
          </div>
        </Card>

        {/* Classes Table */}
        <Card className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeadCell>Mã lớp</TableHeadCell>
                <TableHeadCell>Tên lớp</TableHeadCell>
                <TableHeadCell>Môn học</TableHeadCell>
                <TableHeadCell>Giảng viên</TableHeadCell>
                <TableHeadCell>Số sinh viên</TableHeadCell>
                <TableHeadCell>Trạng thái</TableHeadCell>
                <TableHeadCell>Thao tác</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
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
        </Card>

        {/* Modal */}
        <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalHeader>
            {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="mb-2">
                    <Label htmlFor="name">Tên lớp học *</Label>
                  </div>
                  <TextInput
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nhập tên lớp học"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="code">Mã lớp *</Label>
                  </div>
                  <TextInput
                    id="code"
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="VD: SE1801"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="subject">Môn học *</Label>
                  </div>
                  <TextInput
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Nhập tên môn học"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="teacher">Giảng viên *</Label>
                  </div>
                  <TextInput
                    id="teacher"
                    type="text"
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                    placeholder="Tên giảng viên"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="students">Số sinh viên *</Label>
                  </div>
                  <TextInput
                    id="students"
                    type="number"
                    required
                    value={formData.students}
                    onChange={(e) => setFormData({...formData, students: parseInt(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="semester">Học kỳ *</Label>
                  </div>
                  <TextInput
                    id="semester"
                    type="text"
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    placeholder="Học kỳ 1 - 2024"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <Label htmlFor="status">Trạng thái *</Label>
                  </div>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'completed'})}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm ngưng</option>
                    <option value="completed">Hoàn thành</option>
                  </Select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="gray" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" color="blue">
                {editingClass ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      </main>
    </div>
  )
}
