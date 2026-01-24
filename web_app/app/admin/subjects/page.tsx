"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, TextInput, Textarea, Select, Badge, Spinner } from "flowbite-react"
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import useAxios from "@/hooks/useAxios"
import { useToast } from "@/hooks/useToast"
import { Api } from "@/configs/api"

interface Subject {
  id: string
  subjectCode: string
  subjectName: string
  description: string
  createdBy: string
  isDeleted: boolean
  createdDate: Date
  updatedDate: Date
}

export default function SubjectsManagement() {
  const { isDark } = useThemeContext()
  const axiosInstance = useAxios()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<string>('active')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    description: '',
    createdBy: 'admin@eduacas.com',
    isDeleted: false
  })

  useEffect(() => {
    setMounted(true)
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(Api.Subject.GET_ALL)
      if (response.data?.dataResponse) {
        setSubjects(response.data.dataResponse)
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Không thể tải danh sách môn học')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterDeleted === 'all' || 
                         (filterDeleted === 'active' && !subject.isDeleted) ||
                         (filterDeleted === 'deleted' && subject.isDeleted)
    return matchesSearch && matchesFilter
  })

  const handleAddNew = () => {
    setEditingSubject(null)
    setFormData({
      subjectCode: '',
      subjectName: '',
      description: '',
      createdBy: 'admin@eduacas.com',
      isDeleted: false
    })
    setIsModalOpen(true)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      description: subject.description,
      createdBy: subject.createdBy,
      isDeleted: subject.isDeleted
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn đánh dấu xóa môn học này?')) {
      try {
        await axiosInstance.patch(Api.Subject.SOFT_DELETE(id))
        toast.showSuccess('Xóa môn học thành công')
        fetchSubjects()
      } catch (error: any) {
        toast.showError(error.response?.data?.message || 'Không thể xóa môn học')
      }
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await axiosInstance.patch(Api.Subject.RESTORE(id))
      toast.showSuccess('Khôi phục môn học thành công')
      fetchSubjects()
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Không thể khôi phục môn học')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        await axiosInstance.put(Api.Subject.UPDATE(editingSubject.id), formData)
        toast.showSuccess('Cập nhật môn học thành công')
      } else {
        await axiosInstance.post(Api.Subject.CREATE, formData)
        toast.showSuccess('Thêm môn học thành công')
      }
      setIsModalOpen(false)
      fetchSubjects()
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quản lý môn học
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Quản lý tất cả các môn học trong hệ thống
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 max-w-md relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className={`pl-10 block w-full rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent p-2.5`}
                placeholder="Tìm kiếm môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterDeleted}
              onChange={(e) => setFilterDeleted(e.target.value)}
              className={`rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent p-2.5 min-w-[180px] cursor-pointer`}
            >
              <option value="active">Đang hoạt động</option>
              <option value="deleted">Đã xóa</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
          <Button color="purple" onClick={handleAddNew}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Thêm môn học mới
          </Button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto shadow-md rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
              <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Đang tải dữ liệu...</span>
            </div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-700'}`}>
              <tr>
                <th scope="col" className="px-6 py-3">Mã môn học</th>
                <th scope="col" className="px-6 py-3">Tên môn học</th>
                <th scope="col" className="px-6 py-3">Mô tả</th>
                <th scope="col" className="px-6 py-3">Người tạo</th>
                <th scope="col" className="px-6 py-3">Trạng thái</th>
                <th scope="col" className="px-6 py-3">Ngày tạo</th>
                <th scope="col" className="px-6 py-3">Ngày cập nhật</th>
                <th scope="col" className="px-6 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject) => (
                <tr 
                  key={subject.id}
                  className={`border-b ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>
                        {subject.subjectCode}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {subject.subjectName}
                  </td>
                  <td className={`px-6 py-4 max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {subject.description}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {subject.createdBy}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={subject.isDeleted ? 'failure' : 'success'}>
                      {subject.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(subject.createdDate)}
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(subject.updatedDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!subject.isDeleted ? (
                        <>
                          <Button size="xs" color="info" onClick={() => handleEdit(subject)}>
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button size="xs" color="failure" onClick={() => handleDelete(subject.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="xs" color="success" onClick={() => handleRestore(subject.id)}>
                          <ArrowPathIcon className="w-4 h-4 mr-1" />
                          Khôi phục
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Modal */}
        <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6">
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="subjectCode" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Mã môn học *
                </label>
                <TextInput
                  id="subjectCode"
                  type="text"
                  required
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                  placeholder="VD: SWE201"
                />
              </div>
              <div>
                <label htmlFor="subjectName" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Tên môn học *
                </label>
                <TextInput
                  id="subjectName"
                  type="text"
                  required
                  value={formData.subjectName}
                  onChange={(e) => setFormData({...formData, subjectName: e.target.value})}
                  placeholder="VD: Software Engineering"
                />
              </div>
              <div>
                <label htmlFor="description" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Mô tả *
                </label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nhập mô tả môn học"
                  rows={4}
                />
              </div>
              <div>
                <label htmlFor="createdBy" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Người tạo *
                </label>
                <TextInput
                  id="createdBy"
                  type="email"
                  required
                  value={formData.createdBy}
                  onChange={(e) => setFormData({...formData, createdBy: e.target.value})}
                  placeholder="Email người tạo"
                />
              </div>
              {editingSubject && (
                <div>
                  <label htmlFor="isDeleted" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Trạng thái *
                  </label>
                  <Select
                    id="isDeleted"
                    value={formData.isDeleted.toString()}
                    onChange={(e) => setFormData({...formData, isDeleted: e.target.value === 'true'})}
                  >
                    <option value="false">Hoạt động</option>
                    <option value="true">Đã xóa</option>
                  </Select>
                </div>
              )}
              <div className="flex gap-4 justify-end pt-4">
                <Button color="gray" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" color="purple">
                  {editingSubject ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </main>
    </div>
  )
}
