"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Badge,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Pagination,
  ModalHeader,
  ModalBody
} from "flowbite-react"
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { DefaultCustomButton } from "@/components/ui/custom-button"
import { formatDate, formatDateOnly } from "@/utils/datetime-utils"
import { useToast } from "@/hooks/useToast"
import { useSubject } from "@/hooks/subject/useSubject"
import type { Subject } from "@/types/subject"
import { useAuth } from "@/contexts/AuthContext"

type SubjectFormData = {
  subjectCode: string
  subjectName: string
  description: string
  createdBy: string
  isDeleted: boolean
}

type SubjectModalProps = {
  show: boolean
  onClose: () => void
  isDark: boolean
  editingSubject: Subject | null
  formData: SubjectFormData
  setFormData: React.Dispatch<React.SetStateAction<SubjectFormData>>
  onSubmit: (e: React.FormEvent) => void
}


export default function SubjectsManagement() {

  const { user } = useAuth()
  const { isDark } = useThemeContext()
  const toast = useToast()
  const { getPagedSubjects, createSubject, updateSubject, softDeleteSubject, restoreSubject } = useSubject()
  const [mounted, setMounted] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    description: '',
    createdBy: user?.id || '',
    isDeleted: false
  })

  useEffect(() => {
    setMounted(true)
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const includeDeleted = filterDeleted === 'all' || filterDeleted === 'deleted'
      const data = await getPagedSubjects(currentPage, pageSize, includeDeleted)

      if (data) {
        setSubjects(data.items)
        setTotalPages(data.totalPages)
      } else {
        setSubjects([])
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Cannot load subject list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchSubjects()
  }, [currentPage, filterDeleted, mounted])

  const onPageChange = (page: number) => {
    setCurrentPage(page)
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
      createdBy: user?.id || '',
      isDeleted: false
    })
    setIsModalOpen(true)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      description: subject.description || '',
      createdBy: (subject.createdBy || user?.id || '') as string,
      isDeleted: subject.isDeleted
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedSubject) return
    try {
      setLoading(true)
      await softDeleteSubject(selectedSubject.id)
      setIsDeleteModalOpen(false)
      toast.showSuccess('Delete subject successfully')
      await fetchSubjects()
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Cannot delete subject!')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreSubject(id)
      toast.showSuccess('Restore subject successfully')
      fetchSubjects();
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Cannot restore subject!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        createdBy: formData.createdBy || user?.id || ''
      }

      if (editingSubject) {
        await updateSubject(editingSubject.id, payload)
        toast.showSuccess('Update subject successfully')
      } else {
        await createSubject(payload)
        toast.showSuccess('Create subject successfully')
      }
      setIsModalOpen(false)
      fetchSubjects()
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Something went wrong!')
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manage Subjects
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all subjects in the system
            </p>
          </div>
          <DefaultCustomButton
            label="Add new subject"
            icon={<PlusIcon className="h-5 w-5" />}
            onClick={handleAddNew}
            className="cursor-pointer"
          />
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-grow max-w-md">
              <TextInput
                type="text"
                icon={MagnifyingGlassIcon}
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="w-full md:w-36">
              <Select
                value={filterDeleted}
                onChange={(e) => setFilterDeleted(e.target.value)}
                className="w-full"
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="deleted">DELETED</option>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Spinner size="xl" />
              </div>
            ) : (
              <Table hoverable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell className="text-center">Subject Code</TableHeadCell>
                    <TableHeadCell className="text-center">Subject Name</TableHeadCell>
                    <TableHeadCell className="text-center">Status</TableHeadCell>
                    <TableHeadCell className="text-center">Created Date</TableHeadCell>
                    <TableHeadCell className="text-center">Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y-0">
                  {filteredSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                        No subjects found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <TableRow key={subject.id} className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white"} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge color="info" className="w-fit font-bold uppercase tracking-wider">{subject.subjectCode}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className={`text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {subject.subjectName}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge color={subject.isDeleted ? 'failure' : 'success'} className="font-bold tracking-wider">
                              {subject.isDeleted ? 'DELETED' : 'ACTIVE'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {subject.createdDate ? formatDate(subject.createdDate) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            {!subject.isDeleted ? (
                              <>
                                <Button size="xs" color="failure" onClick={() => handleEdit(subject)}>
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                                <Button size="xs" color="failure" onClick={() => handleDeleteClick(subject)}>
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button size="xs" color="success" onClick={() => handleRestore(subject.id)}>
                                <ArrowPathIcon className="w-4 h-4 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
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

        <SubjectModal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isDark={isDark}
          editingSubject={editingSubject}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />

        <Modal
          show={isDeleteModalOpen}
          size="md"
          onClose={() => setIsDeleteModalOpen(false)}
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
                Are you sure you want to delete the subject{" "}
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  &quot;{selectedSubject?.subjectName}&quot;
                </span>{" "}
                ?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="cursor-pointer px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    "Delete subject"
                  )}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
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
      </main>
    </div>
  )
}


function SubjectModal({
  show,
  onClose,
  isDark,
  editingSubject,
  formData,
  setFormData,
  onSubmit,
}: SubjectModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <div className="p-6">
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {editingSubject ? 'Edit subject' : 'Add new subject'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="subjectCode" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Subject Code *
            </label>
            <TextInput
              id="subjectCode"
              type="text"
              required
              value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              placeholder="Example: SWE201"
            />
          </div>
          <div>
            <label htmlFor="subjectName" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Subject Name *
            </label>
            <TextInput
              id="subjectName"
              type="text"
              required
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              placeholder="Example: Software Engineering"
            />
          </div>
          <div>
            <label htmlFor="description" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Description *
            </label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter subject description"
              rows={4}
            />
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button color="gray" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" color="purple" className="cursor-pointer">
              {editingSubject ? 'Update' : 'Add new'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}