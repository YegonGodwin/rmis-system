import { api, tokenStore } from './api'

export type AuthUser = {
  id: string
  username: string
  fullName: string
  email: string
  role: 'Admin' | 'Physician' | 'Radiologist' | 'Technician'
  status: 'Active' | 'Inactive'
  lastLoginAt?: string
  mustChangePassword?: boolean
  createdAt?: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export const auth = {
  async login(username: string, password: string) {
    const data = await api.post<LoginResponse>('/auth/login', { username, password })
    tokenStore.set(data.token)
    return data
  },

  async me() {
    return api.get<{ user: AuthUser }>('/auth/me')
  },

  logout() {
    tokenStore.clear()
  },
}
