"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Badge, Spinner, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, TextInput, Select, Card, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react"
import {
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UserCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import useAxios from "@/hooks/useAxios"
import { useToast } from "@/hooks/useToast"
import { Api } from "@/configs/api"
import { UserProfile } from "@/types/user"

export default function UsersManagement() {
  const { isDark } = useThemeContext()
  const axiosInstance = useAxios()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
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

  useEffect(() => {
    setMounted(true)
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(Api.User.GET_ALL)
      if (response.data?.dataResponse) {
        setUsers(response.data.dataResponse)
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const requestBody = {
        email: grantForm.email,
        roleNumber: grantForm.roleNumber,
        fullname: grantForm.fullname,
        role: grantForm.role
      }

      const response = await axiosInstance.post(Api.Auth.GRANT_ACCOUNT, requestBody)
      
      if (response.data) {
        toast.showSuccess('Cấp tài khoản thành công!')
        setShowGrantModal(false)
        setGrantForm({
          email: "",
          roleNumber: "",
          fullname: "",
          role: "STUDENT"
        })
        fetchUsers()
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Có lỗi xảy ra khi cấp tài khoản!')
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
      const response = await axiosInstance.put(Api.User.UPDATE(editingUser.id), editForm)
      if (response.data) {
        toast.showSuccess('Cập nhật người dùng thành công!')
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsers()
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.roleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isEnable) ||
                         (filterStatus === 'disabled' && !user.isEnable)
    return matchesSearch && matchesRole && matchesStatus
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
        return 'Quản trị viên'
      case 'LECTURER':
        return 'Giảng viên'
      case 'STUDENT':
        return 'Sinh viên'
      default:
        return role
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Quản lý người dùng
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Quản lý tất cả người dùng trong hệ thống
            </p>
          </div>
          
          <Button color="blue" onClick={() => setShowGrantModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Cấp tài khoản
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tổng số</p>
                <h3 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {users.length}
                </h3>
              </div>
              <div className="rounded-lg p-3 bg-purple-100">
                <UserIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sinh viên</p>
                <h3 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {users.filter(u => u.role === 'STUDENT').length}
                </h3>
              </div>
              <div className="rounded-lg p-3 bg-green-100">
                <UserCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Giảng viên</p>
                <h3 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {users.filter(u => u.role === 'LECTURER').length}
                </h3>
              </div>
              <div className="rounded-lg p-3 bg-blue-100">
                <AcademicCapIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quản trị</p>
                <h3 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {users.filter(u => u.role === 'ADMIN').length}
                </h3>
              </div>
              <div className="rounded-lg p-3 bg-red-100">
                <ShieldCheckIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <TextInput
                type="text"
                icon={MagnifyingGlassIcon}
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="LECTURER">Giảng viên</option>
              <option value="ADMIN">Quản trị</option>
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="disabled">Đã vô hiệu hóa</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
              <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Đang tải dữ liệu...</span>
            </div>
          ) : (
          <Table>
            <TableHead>
              <TableHeadCell>Người dùng</TableHeadCell>
              <TableHeadCell>Mã số</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Vai trò</TableHeadCell>
              <TableHeadCell>Trạng thái</TableHeadCell>
              <TableHeadCell>Đăng nhập lần đầu</TableHeadCell>
              <TableHeadCell>Ngày tạo</TableHeadCell>
              <TableHeadCell>Thao tác</TableHeadCell>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <UserIcon className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        Không tìm thấy người dùng nào
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.fullname}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <UserIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.fullname}
                          </div>
                          {user.birthday && (
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(user.birthday).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.roleNumber}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <Badge color={getRoleBadgeColor(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={user.isEnable ? 'success' : 'failure'}>
                        {user.isEnable ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={user.firstLogin ? 'warning' : 'gray'}>
                        {user.firstLogin ? 'Chưa đổi MK' : 'Đã đổi MK'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(user.createdDate)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(user.createdDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="xs" color="blue" onClick={() => handleEdit(user)}>
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Chỉnh sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
        </Card>

        {/* Summary */}
        {!loading && filteredUsers.length > 0 && (
          <Card className="mt-4">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Hiển thị <span className="font-semibold">{filteredUsers.length}</span> trong tổng số{' '}
              <span className="font-semibold">{users.length}</span> người dùng
            </p>
          </Card>
        )}

        {/* Grant Account Modal */}
        <Modal show={showGrantModal} onClose={() => setShowGrantModal(false)}>
          <ModalHeader>Cấp tài khoản người dùng</ModalHeader>
          <form onSubmit={handleGrantAccount}>
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
                  onChange={(e) => setGrantForm({...grantForm, email: e.target.value})}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <div className="mb-2">
                  <Label htmlFor="grant-fullname">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                </div>
                <TextInput
                  id="grant-fullname"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={grantForm.fullname}
                  onChange={(e) => setGrantForm({...grantForm, fullname: e.target.value})}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <div className="mb-2">
                  <Label htmlFor="grant-roleNumber">
                    Mã số <span className="text-red-500">*</span>
                  </Label>
                </div>
                <TextInput
                  id="grant-roleNumber"
                  type="text"
                  required
                  pattern="^\d+$"
                  value={grantForm.roleNumber}
                  onChange={(e) => setGrantForm({...grantForm, roleNumber: e.target.value})}
                  placeholder="20210001 (chỉ số)"
                  title="Mã số phải là số"
                />
              </div>

              <div>
                <div className="mb-2">
                  <Label htmlFor="grant-role">
                    Vai trò <span className="text-red-500">*</span>
                  </Label>
                </div>
                <Select
                  id="grant-role"
                  required
                  value={grantForm.role}
                  onChange={(e) => setGrantForm({...grantForm, role: e.target.value})}
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="LECTURER">Giảng viên</option>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="gray" onClick={() => setShowGrantModal(false)}>
                Hủy
              </Button>
              <Button type="submit" color="blue" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Cấp tài khoản'
                )}
              </Button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal show={showEditModal} onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}>
          <ModalHeader>Chỉnh sửa người dùng</ModalHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser}>
              <ModalBody className="space-y-4">
                <div>
                  <div className="mb-2">
                    <Label htmlFor="edit-email">Email (không thể thay đổi)</Label>
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
                    <Label htmlFor="edit-fullname">Họ và tên</Label>
                  </div>
                  <TextInput
                    id="edit-fullname"
                    type="text"
                    maxLength={100}
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({...editForm, fullname: e.target.value})}
                  />
                </div>

                <div>
                  <div className="mb-2">
                    <Label htmlFor="edit-roleNumber">Mã số</Label>
                  </div>
                  <TextInput
                    id="edit-roleNumber"
                    type="text"
                    value={editForm.roleNumber}
                    onChange={(e) => setEditForm({...editForm, roleNumber: e.target.value})}
                  />
                </div>

                <div>
                  <div className="mb-2">
                    <Label htmlFor="edit-role">Vai trò</Label>
                  </div>
                  <Select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="LECTURER">Giảng viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </Select>
                </div>

                <div>
                  <div className="mb-2">
                    <Label htmlFor="edit-isEnable">Trạng thái tài khoản</Label>
                  </div>
                  <Select
                    id="edit-isEnable"
                    value={editForm.isEnable.toString()}
                    onChange={(e) => setEditForm({...editForm, isEnable: e.target.value === 'true'})}
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="gray" onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}>
                  Hủy
                </Button>
                <Button type="submit" color="blue" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      Đang xử lý...
                    </span>
                  ) : (
                    'Cập nhật'
                  )}
                </Button>
              </ModalFooter>
            </form>
          )}
        </Modal>
      </main>
    </div>
  )
}
