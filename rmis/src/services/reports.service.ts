import { api } from './api'

export type Report = {
  _id: string
  reportId: string
  study: {
    _id: string
    studyId: string
    accessionNumber: string
    modality: string
    bodyPart: string
    priority: string
    status: string
    scheduledStartAt: string
  }
  patient: {
    _id: string
    mrn: string
    fullName: string
  }
  radiologist: {
    _id: string
    username: string
    fullName: string
    role: string
  }
  status: 'Draft' | 'Preliminary' | 'Final'
  studyType: string
  technique?: string
  findings: string
  impression: string
  recommendations?: string
  isCritical: boolean
  finalizedAt?: string
  createdAt: string
  updatedAt: string
}

export type ReportsResponse = {
  reports: Report[]
  page: number
  limit: number
  total: number
}

export const reportsService = {
  async getReports(params?: {
    status?: string
    patientId?: string
    radiologistId?: string
    studyId?: string
    isCritical?: boolean
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
    return api.get<ReportsResponse>(`/reports${queryString ? `?${queryString}` : ''}`)
  },

  async getReportById(id: string) {
    return api.get<{ report: Report }>(`/reports/${id}`)
  },

  async create(data: {
    studyId: string
    studyType: string
    technique?: string
    findings: string
    impression: string
    recommendations?: string
    isCritical?: boolean
    status?: 'Draft' | 'Preliminary' | 'Final'
  }) {
    return api.post<{ report: Report }>('/reports', data)
  },

  async update(id: string, data: Partial<{
    studyType: string
    technique: string
    findings: string
    impression: string
    recommendations: string
    isCritical: boolean
    status: 'Draft' | 'Preliminary' | 'Final'
  }>) {
    return api.patch<{ report: Report }>(`/reports/${id}`, data)
  },
}
