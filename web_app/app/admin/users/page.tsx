"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Avatar, Badge, Spinner, Button, Modal, ModalHeader, ModalBody, Label, TextInput, Select, Card, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Pagination } from "flowbite-react"
import {
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UserCircleIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useUserManagement } from "@/hooks/user/useUserManagement"
import { useToast } from "@/hooks/useToast"
import { UserProfile } from "@/types/user"
import { DefaultCustomButton } from "@/components/ui/custom-button"
import { formatDateOnly, formatTime } from "@/utils/datetime-utils"
import { UserManagementSkeleton } from "@/components/ui/skeletons"

const userStatsAccentStyles: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  purple: { border: 'border-l-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400' },
  green: { border: 'border-l-green-500', iconBg: 'bg-green-50 dark:bg-green-500/10', iconColor: 'text-green-600 dark:text-green-400' },
  blue: { border: 'border-l-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400' },
  red: { border: 'border-l-red-500', iconBg: 'bg-red-50 dark:bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400' },
}

type GrantFormData = {
  email: string
  roleNumber: string
  fullname: string
  role: string
}

type EditFormData = {
  fullname: string
  roleNumber: string
  role: string
  isEnable: boolean
}

type GrantAccountModalProps = {
  show: boolean
  onClose: () => void
  grantForm: GrantFormData
  setGrantForm: React.Dispatch<React.SetStateAction<GrantFormData>>
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}



export default function UsersManagement() {
  const { isDark } = useThemeContext()
  const toast = useToast()
  const { getAllUsers, getPagedUsers, grantAccount, updateUser } = useUserManagement()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [grantForm, setGrantForm] = useState({
    email: "",
    roleNumber: "",
    fullname: "",
    role: "STUDENT"
  })
  const [editForm, setEditForm] = useState({
    fullname: "",
    roleNumber: "",
    role: "STUDENT",
    isEnable: true
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPagedUsers(currentPage, pageSize, searchTerm, filterRole, filterStatus)
      if (data) {
        setUsers(data.items)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toastRef.current.showError(err.response?.data?.message || 'Cannot load user list')
    } finally {
      setLoading(false)
    }
  }, [getPagedUsers, currentPage, pageSize, searchTerm, filterRole, filterStatus])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchUsers()
    }
  }, [mounted, fetchUsers])

  const onPageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleGrantAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const requestBody = {
        email: grantForm.email,
        roleNumber: grantForm.roleNumber,
        fullname: grantForm.fullname,
        role: grantForm.role,
      }
      await grantAccount(requestBody)
      toast.showSuccess('Grant account successfully!')
      setShowGrantModal(false)
      setGrantForm({
        email: "",
        roleNumber: "",
        fullname: "",
        role: "STUDENT"
      })
      fetchUsers()
    } catch (error: unknown) {
      console.log(error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Something went wrong when granting account!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      fullname: user.fullname,
      roleNumber: user.roleNumber,
      role: user.role,
      isEnable: user.isEnable
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsLoading(true)
    try {
      await updateUser(editingUser.id, editForm)
      toast.showSuccess('Update user successfully!')
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Something went wrong when updating user!')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  if (loading) {
    return <UserManagementSkeleton />
  }

  const statsCardsData = [
    { title: 'Total', value: totalCount, icon: <UserIcon className="h-6 w-6" />, accent: 'purple' },
    { title: 'Student', value: users.filter(u => u.role === 'STUDENT').length, icon: <UserCircleIcon className="h-6 w-6" />, accent: 'green' },
    { title: 'Lecturer', value: users.filter(u => u.role === 'LECTURER').length, icon: <AcademicCapIcon className="h-6 w-6" />, accent: 'blue' },
    { title: 'Admin', value: users.filter(u => u.role === 'ADMIN').length, icon: <ShieldCheckIcon className="h-6 w-6" />, accent: 'red' },
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheckIcon className="w-5 h-5 text-red-600" />
      case 'LECTURER':
        return <AcademicCapIcon className="w-5 h-5 text-blue-600" />
      case 'STUDENT':
        return <UserCircleIcon className="w-5 h-5 text-green-600" />
      default:
        return <UserIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'failure'
      case 'LECTURER':
        return 'info'
      case 'STUDENT':
        return 'success'
      default:
        return 'gray'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ADMIN'
      case 'LECTURER':
        return 'LECTURER'
      case 'STUDENT':
        return 'STUDENT'
      default:
        return role
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manage Users
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all users in the system
            </p>
          </div>

          <DefaultCustomButton
            label="Grant Account"
            icon={<PlusIcon className="h-5 w-5" />}
            onClick={() => setShowGrantModal(true)}
            className="cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
          {statsCardsData.map((stat) => {
            const style = userStatsAccentStyles[stat.accent]
            return (
              <div
                key={stat.title}
                className={`
                  overflow-hidden rounded-xl border border-gray-200 bg-white
                  dark:border-gray-700 dark:bg-gray-800
                  border-l-4 ${style.border}
                  transition-colors
                `}
              >
                <div className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor}`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.title}
                    </p>
                    <p className={`mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <form className="flex-grow max-w-md flex gap-3" onSubmit={(e) => { e.preventDefault(); fetchUsers(); }}>
              <div className="flex-1">
                <TextInput
                  type="text"
                  icon={MagnifyingGlassIcon}
                  placeholder="Search users..."
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
            </form>

            <div className="flex gap-3">
              <div className="w-40">
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full"
                >
                  <option value="all">ALL ROLES</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="LECTURER">LECTURER</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </div>
              <div className="w-40">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="active">ACTIVE</option>
                  <option value="disabled">DISABLED</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>User</TableHeadCell>
                  <TableHeadCell className="text-center">Role Number</TableHeadCell>
                  <TableHeadCell className="text-center">Email</TableHeadCell>
                  <TableHeadCell className="text-center">Role</TableHeadCell>
                  <TableHeadCell className="text-center">Status</TableHeadCell>
                  <TableHeadCell className="text-center">First Login</TableHeadCell>
                  <TableHeadCell className="text-center">Created Date</TableHeadCell>
                  <TableHeadCell className="text-center">Action</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y-0">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Spinner size="xl" />
                      <div className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading users...</div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className=" py-10">
                      <div className="flex flex-col">
                        <UserIcon className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar img={user.avatarUrl} alt={user.fullname} rounded size="sm" className="shrink-0" />
                          <div className="flex flex-col">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.fullname}</span>
                            {user.birthday && (
                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatDateOnly(user.birthday)}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {user.roleNumber}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>{user.email}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge color={getRoleBadgeColor(user.role)} className="font-bold">
                            {getRoleText(user.role)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge color={user.isEnable ? 'success' : 'failure'} className="font-bold">
                            {user.isEnable ? 'ACTIVE' : 'DISABLED'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge color={user.firstLogin ? 'warning' : 'gray'} className="font-bold">
                            {user.firstLogin ? 'PENDING' : 'CHANGED'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDateOnly(user.createdDate)}</span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatTime(user.createdDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => handleEdit(user)}
                            disabled={user.role === 'ADMIN'}
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex justify-center mt-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                showIcons
              />
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
            </div>
          )}
        </div>

        <GrantAccountModal
          show={showGrantModal}
          onClose={() => setShowGrantModal(false)}
          grantForm={grantForm}
          setGrantForm={setGrantForm}
          onSubmit={handleGrantAccount}
          isLoading={isLoading}
        />

        <EditUserModal
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          editingUser={editingUser}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleUpdateUser}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}


function GrantAccountModal({
  show,
  onClose,
  grantForm,
  setGrantForm,
  onSubmit,
  isLoading,
}: GrantAccountModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Grant user account</ModalHeader>
      <form onSubmit={onSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <div className="mb-2">
              <Label htmlFor="grant-email">
                Email <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="grant-email"
              type="email"
              required
              value={grantForm.email}
              onChange={(e) => setGrantForm({ ...grantForm, email: e.target.value })}
              placeholder="example@email.com"
            />
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor="grant-fullname">
                Fullname <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="grant-fullname"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={grantForm.fullname}
              onChange={(e) => setGrantForm({ ...grantForm, fullname: e.target.value })}
              placeholder="Nguyen Van A"
            />
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor="grant-roleNumber">
                Role Number <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="grant-roleNumber"
              type="text"
              required
              pattern="^\d+$"
              value={grantForm.roleNumber}
              onChange={(e) => setGrantForm({ ...grantForm, roleNumber: e.target.value })}
              placeholder="20210001 (Role Number)"
              title="Role Number must be a number"
            />
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor="grant-role">
                Role <span className="text-red-500">*</span>
              </Label>
            </div>
            <Select
              id="grant-role"
              required
              value={grantForm.role}
              onChange={(e) => setGrantForm({ ...grantForm, role: e.target.value })}
            >
              <option value="STUDENT">STUDENT</option>
              <option value="LECTURER">LECTURER</option>
            </Select>
          </div>
        </ModalBody>
        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/50">
          <Button color="gray" onClick={onClose} className='cursor-pointer'>
            Cancel
          </Button>
          <Button type="submit" color="blue" disabled={isLoading} className='cursor-pointer'>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Processing...
              </span>
            ) : (
              'Grant account'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type EditUserModalProps = {
  show: boolean
  onClose: () => void
  editingUser: UserProfile | null
  editForm: EditFormData
  setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

function EditUserModal({
  show,
  onClose,
  editingUser,
  editForm,
  setEditForm,
  onSubmit,
  isLoading,
}: EditUserModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Edit user</ModalHeader>
      {editingUser && (
        <form onSubmit={onSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <div className="mb-2">
                <Label htmlFor="edit-email">Email (cannot be changed)</Label>
              </div>
              <TextInput
                id="edit-email"
                type="email"
                disabled
                value={editingUser.email}
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="edit-fullname">Fullname</Label>
              </div>
              <TextInput
                id="edit-fullname"
                type="text"
                maxLength={100}
                value={editForm.fullname}
                onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="edit-roleNumber">Role Number</Label>
              </div>
              <TextInput
                id="edit-roleNumber"
                type="text"
                value={editForm.roleNumber}
                onChange={(e) => setEditForm({ ...editForm, roleNumber: e.target.value })}
              />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="edit-role">Vai trò</Label>
              </div>
              <Select
                id="edit-role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="LECTURER">LECTURER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="edit-isEnable">Account status</Label>
              </div>
              <Select
                id="edit-isEnable"
                value={editForm.isEnable.toString()}
                onChange={(e) => setEditForm({ ...editForm, isEnable: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </Select>
            </div>
          </ModalBody>
          <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/50">
            <Button color="gray" onClick={onClose} className='cursor-pointer'>
              Cancel
            </Button>
            <Button type="submit" color="blue" disabled={isLoading} className='cursor-pointer'>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Processing...
                </span>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}