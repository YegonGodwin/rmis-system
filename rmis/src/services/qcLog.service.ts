import { api } from './api'

export type QCResult = 'Pass' | 'Fail' | 'Warning'

export type QCLog = {
  _id: string
  qcLogId: string
  room: {
    _id: string
    name: string
    modality: string
  }
  performedBy: {
    _id: string
    username: string
    fullName: string
  }
  testType: string
  result: QCResult
  notes?: string
  performedAt: string
  createdAt: string
  updatedAt: string
}

export type QCLogsResponse = {
  logs: QCLog[]
  page: number
  limit: number
  total: number
}

export const qcLogService = {
  async list(params?: {
    roomId?: string
    performedBy?: string
    result?: string
    from?: string
    to?: string
    limit?: number
    page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const queryString = queryParams.toString()
    return api.get<QCLogsResponse>(`/qc-logs${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string) {
    return api.get<{ log: QCLog }>(`/qc-logs/${id}`)
  },

  async create(data: {
    roomId: string
    testType: string
    result: QCResult
    notes?: string
    performedAt?: string
  }) {
    return api.post<{ log: QCLog }>('/qc-logs', data)
  },

  async update(id: string, data: Partial<{
    testType: string
    result: QCResult
    notes?: string
  }>) {
    return api.patch<{ log: QCLog }>(`/qc-logs/${id}`, data)
  },

  async delete(id: string) {
    return api.delete<{ log: QCLog }>(`/qc-logs/${id}`)
  }
}
