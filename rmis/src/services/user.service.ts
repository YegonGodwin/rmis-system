import { api } from './api'

export type UserRole = 'Admin' | 'Radiologist' | 'Technician' | 'Physician'
export type UserStatus = 'Active' | 'Inactive'

export type User = {
  id: string
  username: string
  fullName: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: string
  mustChangePassword?: boolean
  createdAt: string
  updatedAt?: string
}

export type CreateUserDto = {
  username: string
  fullName: string
  email: string
  role: UserRole
  password: string
  mustChangePassword?: boolean
}

export type ChangePasswordDto = {
  currentPassword: string
  newPassword: string
}

export const userService = {
  async listUsers(params?: { role?: string; status?: string; q?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.role && params.role !== 'All') searchParams.append('role', params.role)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.q) searchParams.append('q', params.q)

    const query = searchParams.toString()
    const path = `/users${query ? `?${query}` : ''}`
    
    const response = await api.get<{ users: any[] }>(path)
    return response.users.map((u) => ({
      id: u._id || u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })) as User[]
  },

  async createUser(data: CreateUserDto) {
    const response = await api.post<{ user: any }>('/users', data)
    const u = response.user
    return {
      id: u._id || u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
    } as User
  },

  async changePassword(data: ChangePasswordDto) {
    await api.post('/users/change-password', data)
  },

  async setStatus(id: string, status: UserStatus) {
    const response = await api.patch<{ user: any }>(`/users/${id}/status`, { status })
    const u = response.user
    return {
      id: u._id || u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    } as User
  },
}
