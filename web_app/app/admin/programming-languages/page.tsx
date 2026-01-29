"use client"

import { useState, useEffect, useCallback } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Button, Modal, Label, TextInput, Select, Badge, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react"
import {
  CodeBracketIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useProgrammingLanguage, ProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage"
import { useToast } from "@/hooks/useToast"

export default function ProgrammingLanguagesManagement() {
  const { isDark } = useThemeContext()
  const toast = useToast()
  const {
    getAllProgrammingLanguages,
    createProgrammingLanguage,
    updateProgrammingLanguage,
    deleteProgrammingLanguage,
    toggleEnable,
  } = useProgrammingLanguage()
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

  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllProgrammingLanguages()
      setLanguages(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Cannot load programming language list')
    } finally {
      setLoading(false)
    }
  }, [getAllProgrammingLanguages, toast])

  useEffect(() => {
    setMounted(true)
    fetchLanguages()
  }, [fetchLanguages])

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
    if (confirm('Are you sure you want to delete this programming language?')) {
      try {
        await deleteProgrammingLanguage(id)
        toast.showSuccess('Delete programming language successfully')
        fetchLanguages()
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } }
        toast.showError(err.response?.data?.message || 'Cannot delete programming language')
      }
    }
  }

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      await toggleEnable(id)
      toast.showSuccess(`${currentStatus ? 'Disabled' : 'Enabled'} programming language successfully`)
      fetchLanguages()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Cannot change status')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        Key: formData.key,
        LanguageName: formData.languageName,
        LanguageVersion: formData.languageVersion,
        IsEnable: formData.isEnable,
      }
      if (editingLanguage) {
        await updateProgrammingLanguage(editingLanguage.id, payload)
        toast.showSuccess('Cập nhật ngôn ngữ lập trình thành công')
      } else {
        await createProgrammingLanguage(payload)
        toast.showSuccess('Thêm ngôn ngữ lập trình thành công')
      }
      setIsModalOpen(false)
      fetchLanguages()
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string
            errors?: Record<string, string | string[]>
          }
        }
      }
      let errorMessage = 'An error occurred'
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        const errorList = Object.entries(errors)
          .map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages.join(', ') : messages
            return `${field}: ${msgs}`
          })
          .join('\n')
        errorMessage = errorList
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
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
            Manage Programming Languages
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage all programming languages in the system
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <TextInput
              type="text"
              icon={MagnifyingGlassIcon}
              placeholder="Search programming language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button color="success" onClick={handleAddNew}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Add new programming language
          </Button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableHeadCell>Language Name</TableHeadCell>
                <TableHeadCell>Key</TableHeadCell>
                <TableHeadCell>Language Version</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created Date</TableHeadCell>
                <TableHeadCell>Updated Date</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredLanguages.map((lang) => (
                  <TableRow key={lang.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CodeBracketIcon className="w-5 h-5 text-green-600" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {lang.languageName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                        {lang.key}
                      </code>
                    </TableCell>
                    <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                      {lang.languageVersion}
                    </TableCell>
                    <TableCell>
                      <Badge color={lang.isEnable ? 'success' : 'failure'}>
                        {lang.isEnable ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                      {formatDate(lang.createdDate)}
                    </TableCell>
                    <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                      {formatDate(lang.updatedDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="xs" 
                          color={lang.isEnable ? "warning" : "success"}
                          onClick={() => handleToggleEnable(lang.id, lang.isEnable)}
                          title={lang.isEnable ? "Disabled" : "Enabled"}
                        >
                          {lang.isEnable ? "Disable" : "Enable"}
                        </Button>
                        <Button size="xs" color="info" onClick={() => handleEdit(lang)}>
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button size="xs" color="failure" onClick={() => handleDelete(lang.id)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Modal */}
        <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6">
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingLanguage ? 'Edit programming language' : 'Add new programming language'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="mb-2">
                  <Label htmlFor="languageName">
                    Language Name *
                  </Label>
                </div>
                <TextInput
                  id="languageName"
                  type="text"
                  required
                  value={formData.languageName}
                  onChange={(e) => setFormData({...formData, languageName: e.target.value})}
                  placeholder="Example: Python"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="key">
                    Key
                  </Label>
                </div>
                <TextInput
                  id="key"
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  placeholder="Example: python"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="languageVersion">
                    Language Version
                  </Label>
                </div>
                <TextInput
                  id="languageVersion"
                  type="text"
                  required
                  value={formData.languageVersion}
                  onChange={(e) => setFormData({...formData, languageVersion: e.target.value})}
                  placeholder="Example: 3.12"
                />
              </div>
              <div>
                <div className="mb-2">
                  <Label htmlFor="isEnable">
                    Status *
                  </Label>
                </div>
                <Select
                  id="isEnable"
                  required
                  value={formData.isEnable.toString()}
                  onChange={(e) => setFormData({...formData, isEnable: e.target.value === 'true'})}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </Select>
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <Button color="gray" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" color="success">
                  {editingLanguage ? 'Update' : 'Add new'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </main>
    </div>
  )
}
