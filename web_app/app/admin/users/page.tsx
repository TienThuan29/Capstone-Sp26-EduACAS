"use client"

import { useState, useEffect } from "react"
import { useThemeContext } from "@/components/ThemeProvider"
import Sidebar from "@/components/sidebar"
import { Badge, Spinner } from "flowbite-react"
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
          
          <button
            onClick={() => setShowGrantModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Cấp tài khoản
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className={`rounded-xl p-6 shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
          </div>

          <div className={`rounded-xl p-6 shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
          </div>

          <div className={`rounded-xl p-6 shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
          </div>

          <div className={`rounded-xl p-6 shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
          </div>
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
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent p-2.5 min-w-[150px] cursor-pointer`}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="LECTURER">Giảng viên</option>
              <option value="ADMIN">Quản trị</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent p-2.5 min-w-[150px] cursor-pointer`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="disabled">Đã vô hiệu hóa</option>
            </select>
          </div>
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
                <th scope="col" className="px-6 py-3">Người dùng</th>
                <th scope="col" className="px-6 py-3">Mã số</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Vai trò</th>
                <th scope="col" className="px-6 py-3">Trạng thái</th>
                <th scope="col" className="px-6 py-3">Đăng nhập lần đầu</th>
                <th scope="col" className="px-6 py-3">Ngày tạo</th>
                <th scope="col" className="px-6 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        Không tìm thấy người dùng nào
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className={`border-b ${
                      isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
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
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.roleNumber}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <Badge color={getRoleBadgeColor(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={user.isEnable ? 'success' : 'failure'}>
                        {user.isEnable ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={user.firstLogin ? 'warning' : 'gray'}>
                        {user.firstLogin ? 'Chưa đổi MK' : 'Đã đổi MK'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(user.createdDate)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(user.createdDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredUsers.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Hiển thị <span className="font-semibold">{filteredUsers.length}</span> trong tổng số{' '}
              <span className="font-semibold">{users.length}</span> người dùng
            </p>
          </div>
        )}

        {/* Grant Account Modal */}
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cấp tài khoản người dùng
                </h3>
                <button
                  onClick={() => setShowGrantModal(false)}
                  className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGrantAccount} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={grantForm.email}
                    onChange={(e) => setGrantForm({...grantForm, email: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={grantForm.fullname}
                    onChange={(e) => setGrantForm({...grantForm, fullname: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mã số <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^\d+$"
                    value={grantForm.roleNumber}
                    onChange={(e) => setGrantForm({...grantForm, roleNumber: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    placeholder="20210001 (chỉ số)"
                    title="Mã số phải là số"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={grantForm.role}
                    onChange={(e) => setGrantForm({...grantForm, role: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="LECTURER">Giảng viên</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      'Cấp tài khoản'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Chỉnh sửa người dùng
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }}
                  className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email (không thể thay đổi)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={editingUser.email}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors bg-gray-100 dark:bg-gray-700 cursor-not-allowed ${
                      isDark 
                        ? 'border-gray-600 text-gray-400' 
                        : 'border-gray-300 text-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({...editForm, fullname: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mã số
                  </label>
                  <input
                    type="text"
                    value={editForm.roleNumber}
                    onChange={(e) => setEditForm({...editForm, roleNumber: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vai trò
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="LECTURER">Giảng viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editForm.isEnable.toString()}
                    onChange={(e) => setEditForm({...editForm, isEnable: e.target.value === 'true'})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingUser(null)
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      'Cập nhật'
                    )}
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
