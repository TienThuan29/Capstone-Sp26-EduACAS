"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, Label, TextInput, Select, Badge } from "flowbite-react"
import {
  CodeBracketIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

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
  const [mounted, setMounted] = useState(false)
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([
    { 
      id: '1', 
      languageName: 'Java', 
      key: 'java',
      languageVersion: '21.0', 
      isEnable: true,
      createdDate: new Date('2024-01-15'),
      updatedDate: new Date('2024-01-15')
    },
    { 
      id: '2', 
      languageName: 'Python', 
      key: 'python',
      languageVersion: '3.12', 
      isEnable: true,
      createdDate: new Date('2024-01-15'),
      updatedDate: new Date('2024-01-15')
    },
    { 
      id: '3', 
      languageName: 'JavaScript', 
      key: 'javascript',
      languageVersion: 'ES2024', 
      isEnable: true,
      createdDate: new Date('2024-01-15'),
      updatedDate: new Date('2024-01-15')
    },
    { 
      id: '4', 
      languageName: 'C++', 
      key: 'cpp',
      languageVersion: 'C++23', 
      isEnable: true,
      createdDate: new Date('2024-01-10'),
      updatedDate: new Date('2024-01-10')
    },
    { 
      id: '5', 
      languageName: 'C#', 
      key: 'csharp',
      languageVersion: '12.0', 
      isEnable: true,
      createdDate: new Date('2024-01-10'),
      updatedDate: new Date('2024-01-10')
    },
    { 
      id: '6', 
      languageName: 'Swift', 
      key: 'swift',
      languageVersion: '5.9', 
      isEnable: false,
      createdDate: new Date('2024-01-05'),
      updatedDate: new Date('2024-01-18')
    },
  ])
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
  }, [])

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

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ngôn ngữ lập trình này?')) {
      setLanguages(languages.filter(lang => lang.id !== id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLanguage) {
      setLanguages(languages.map(lang => 
        lang.id === editingLanguage.id 
          ? { ...lang, ...formData, updatedDate: new Date() } 
          : lang
      ))
    } else {
      const newLanguage: ProgrammingLanguage = {
        id: (languages.length + 1).toString(),
        ...formData,
        createdDate: new Date(),
        updatedDate: new Date()
      }
      setLanguages([...languages, newLanguage])
    }
    setIsModalOpen(false)
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
