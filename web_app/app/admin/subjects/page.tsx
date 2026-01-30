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
  TableRow 
} from "flowbite-react"
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useToast } from "@/hooks/useToast"
import { useSubject, Subject } from "@/hooks/subject/useSubject"
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
  const { getAllSubjects, createSubject, updateSubject, softDeleteSubject, restoreSubject } = useSubject()
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
    createdBy: user?.id || '',
    isDeleted: false
  })

  useEffect(() => {
    setMounted(true)
    fetchSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const data = await getAllSubjects()
      setSubjects(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Cannot load subject list')
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to mark this subject as deleted?')) {
      try {
        await softDeleteSubject(id)
        toast.showSuccess('Delete subject successfully')
        fetchSubjects()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.showError(error.response?.data?.message || 'Cannot delete subject!')
      }
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreSubject(id)
      toast.showSuccess('Restore subject successfully')
      fetchSubjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Cannot restore subject!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Ensure createdBy is always a string
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Something went wrong!')
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
            Manage Subjects
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage all subjects in the system
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <TextInput
                type="text"
                icon={MagnifyingGlassIcon}
                placeholder="Search subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={filterDeleted}
              onChange={(e) => setFilterDeleted(e.target.value)}
              className="min-w-[180px]"
            >
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="all">All</option>
            </Select>
          </div>
          <Button color="purple" onClick={handleAddNew} className="cursor-pointer">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add new subject
          </Button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
              <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading data...</span>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Subject Code</TableHeadCell>
                  <TableHeadCell>Subject Name</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Created Date</TableHeadCell>
                  <TableHeadCell>Updated Date</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {subject.subjectCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subject.subjectName}
                    </TableCell>
                    <TableCell className={`max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {subject.description}
                    </TableCell>
                    <TableCell>
                      <Badge color={subject.isDeleted ? 'failure' : 'success'}>
                        {subject.isDeleted ? 'Deleted' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                      {subject.createdDate ? formatDate(new Date(subject.createdDate)) : 'N/A'}
                    </TableCell>
                    <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                      {subject.updatedDate ? formatDate(new Date(subject.updatedDate)) : 'N/A'}
                    </TableCell>
                    <TableCell>
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
                            Restore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          {editingSubject && (
            <div>
              <label htmlFor="isDeleted" className={`block mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Status *
              </label>
              <Select
                id="isDeleted"
                value={formData.isDeleted.toString()}
                onChange={(e) => setFormData({ ...formData, isDeleted: e.target.value === 'true' })}
              >
                <option value="false">Active</option>
                <option value="true">Deleted</option>
              </Select>
            </div>
          )}
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