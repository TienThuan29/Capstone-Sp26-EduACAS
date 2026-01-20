"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"

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
      active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      inactive: { label: 'Tạm ngưng', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
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
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Thêm lớp học mới
          </button>
        </div>

        {/* Filters */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm lớp học, mã lớp, giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Classes Table */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Mã lớp
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Tên lớp
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Môn học
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Giảng viên
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Số sinh viên
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Trạng thái
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className={`hover:bg-opacity-50 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {cls.code}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {cls.name}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {cls.subject}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {cls.teacher}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {cls.students}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(cls.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tên lớp học *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Nhập tên lớp học"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Mã lớp *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="VD: SE1801"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Môn học *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Nhập tên môn học"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Giảng viên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.teacher}
                      onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Tên giảng viên"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Số sinh viên *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.students}
                      onChange={(e) => setFormData({...formData, students: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Học kỳ *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Học kỳ 1 - 2024"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Trạng thái *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'completed'})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Tạm ngưng</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingClass ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
