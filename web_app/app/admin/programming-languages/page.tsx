"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, Label, TextInput, Select, Badge, Spinner } from "flowbite-react"
import {
  CodeBracketIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import useAxios from "@/hooks/useAxios"
import { useToast } from "@/hooks/useToast"
import { Api } from "@/configs/api"

interface ProgrammingLanguage {
  id: string
  languageName: string
  key: string
  languageVersion: string
  isEnable: boolean
  createdDate: Date
  updatedDate: Date
}

export default function ProgrammingLanguagesManagement() {
  const { isDark } = useThemeContext()
  const axiosInstance = useAxios()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<ProgrammingLanguage | null>(null)
  const [formData, setFormData] = useState({
    languageName: '',
    key: '',
    languageVersion: '',
    isEnable: true
  })

  useEffect(() => {
    setMounted(true)
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(Api.ProgrammingLanguage.GET_ALL)
      if (response.data?.dataResponse) {
        setLanguages(response.data.dataResponse)
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Không thể tải danh sách ngôn ngữ lập trình')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const filteredLanguages = languages.filter(lang => 
    lang.languageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingLanguage(null)
    setFormData({
      languageName: '',
      key: '',
      languageVersion: '',
      isEnable: true
    })
    setIsModalOpen(true)
  }

  const handleEdit = (lang: ProgrammingLanguage) => {
    setEditingLanguage(lang)
    setFormData({
      languageName: lang.languageName,
      key: lang.key,
      languageVersion: lang.languageVersion,
      isEnable: lang.isEnable
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ngôn ngữ lập trình này?')) {
      try {
        await axiosInstance.delete(Api.ProgrammingLanguage.DELETE(id))
        toast.showSuccess('Xóa ngôn ngữ lập trình thành công')
        fetchLanguages()
      } catch (error: any) {
        toast.showError(error.response?.data?.message || 'Không thể xóa ngôn ngữ lập trình')
      }
    }
  }

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      await axiosInstance.put(Api.ProgrammingLanguage.TOGGLE_ENABLE(id))
      toast.showSuccess(`${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} ngôn ngữ lập trình thành công`)
      fetchLanguages()
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Không thể thay đổi trạng thái')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Map to backend expected format (PascalCase)
      const payload = {
        Key: formData.key,
        LanguageName: formData.languageName,
        LanguageVersion: formData.languageVersion,
        IsEnable: formData.isEnable
      }
      
      console.log('Sending data:', payload)
      if (editingLanguage) {
        const response = await axiosInstance.put(Api.ProgrammingLanguage.UPDATE(editingLanguage.id), payload)
        console.log('Update response:', response.data)
        toast.showSuccess('Cập nhật ngôn ngữ lập trình thành công')
      } else {
        const response = await axiosInstance.post(Api.ProgrammingLanguage.CREATE, payload)
        console.log('Create response:', response.data)
        toast.showSuccess('Thêm ngôn ngữ lập trình thành công')
      }
      setIsModalOpen(false)
      fetchLanguages()
    } catch (error: any) {
      console.error('Error details:', error.response?.data)
      console.error('Validation errors:', error.response?.data?.errors)
      
      // Extract validation errors
      let errorMessage = 'Có lỗi xảy ra'
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages.join(', ') : messages
            return `${field}: ${msgs}`
          })
          .join('\n')
        errorMessage = errorList
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.showError(errorMessage)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quản lý ngôn ngữ lập trình
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Quản lý tất cả các ngôn ngữ lập trình trong hệ thống
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className={`pl-10 block w-full rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent p-2.5`}
              placeholder="Tìm kiếm ngôn ngữ lập trình..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button color="success" onClick={handleAddNew}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Thêm ngôn ngữ mới
          </Button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto shadow-md rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
            </div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-700'}`}>
              <tr>
                <th scope="col" className="px-6 py-3">Tên ngôn ngữ</th>
                <th scope="col" className="px-6 py-3">Key</th>
                <th scope="col" className="px-6 py-3">Phiên bản</th>
                <th scope="col" className="px-6 py-3">Trạng thái</th>
                <th scope="col" className="px-6 py-3">Ngày tạo</th>
                <th scope="col" className="px-6 py-3">Ngày cập nhật</th>
                <th scope="col" className="px-6 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredLanguages.map((lang) => (
                <tr 
                  key={lang.id} 
                  className={`border-b ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CodeBracketIcon className="w-5 h-5 text-green-600" />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>
                        {lang.languageName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                      {lang.key}
                    </code>
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {lang.languageVersion}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={lang.isEnable ? 'success' : 'failure'}>
                      {lang.isEnable ? 'Kích hoạt' : 'Vô hiệu hóa'}
                    </Badge>
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(lang.createdDate)}
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(lang.updatedDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="xs" 
                        color={lang.isEnable ? "warning" : "success"}
                        onClick={() => handleToggleEnable(lang.id, lang.isEnable)}
                        title={lang.isEnable ? "Vô hiệu hóa" : "Kích hoạt"}
                      >
                        {lang.isEnable ? "Tắt" : "Bật"}
                      </Button>
                      <Button size="xs" color="info" onClick={() => handleEdit(lang)}>
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button size="xs" color="failure" onClick={() => handleDelete(lang.id)}>
                        <TrashIcon className="w-4 h-4" />
                      </Button>
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
              {editingLanguage ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngôn ngữ mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="mb-2">
                  <Label htmlFor="languageName">
                    Tên ngôn ngữ *
                  </Label>
                </div>
                <TextInput
                  id="languageName"
                  type="text"
                  required
                  value={formData.languageName}
                  onChange={(e) => setFormData({...formData, languageName: e.target.value})}
                  placeholder="VD: Python"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="key">
                    Key *
                  </Label>
                </div>
                <TextInput
                  id="key"
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  placeholder="VD: python"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="languageVersion">
                    Phiên bản *
                  </Label>
                </div>
                <TextInput
                  id="languageVersion"
                  type="text"
                  required
                  value={formData.languageVersion}
                  onChange={(e) => setFormData({...formData, languageVersion: e.target.value})}
                  placeholder="VD: 3.12"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="isEnable">
                    Trạng thái *
                  </Label>
                </div>
                <Select
                  id="isEnable"
                  required
                  value={formData.isEnable.toString()}
                  onChange={(e) => setFormData({...formData, isEnable: e.target.value === 'true'})}
                >
                  <option value="true">Kích hoạt</option>
                  <option value="false">Vô hiệu hóa</option>
                </Select>
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <Button color="gray" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" color="success">
                  {editingLanguage ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </main>
    </div>
  )
}
