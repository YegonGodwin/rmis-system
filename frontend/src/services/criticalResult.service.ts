import { api } from './api'

export type CriticalResultStatus = 'Pending' | 'Acknowledged' | 'Escalated'
export type Severity = 'Critical' | 'Urgent'
export type NotificationMethod = 'Phone' | 'SMS' | 'Email' | 'In-Person'

export type CriticalResult = {
  _id: string
  criticalResultId: string
  report?: {
    _id: string
    reportId: string
    status: string
    isCritical: boolean
    finalizedAt?: string
    accessionNumber: string
  }
  study?: {
    _id: string
    studyId: string
    accessionNumber: string
    modality: string
    bodyPart?: string
    priority: string
    status: string
    scheduledStartAt: string
  }
  patient: {
    _id: string
    mrn: string
    fullName: string
  }
  studyType: string
  finding: string
  severity: Severity
  radiologist: {
    _id: string
    username: string
    fullName: string
    role: string
  }
  notifiedTo: {
    _id: string
    username: string
    fullName: string
    role: string
  }
  notificationMethod: NotificationMethod
  status: CriticalResultStatus
  notifiedAt: string
  acknowledgedAt?: string
  escalatedAt?: string
  createdAt: string
  updatedAt: string
}

export type CriticalResultsResponse = {
  results: CriticalResult[]
  page: number
  limit: number
  total: number
}

export const criticalResultService = {
  async list(params?: {
    status?: string
    severity?: string
    patientId?: string
    notifiedTo?: string
    radiologist?: string
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
    return api.get<CriticalResultsResponse>(`/critical-results${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string) {
    return api.get<{ result: CriticalResult }>(`/critical-results/${id}`)
  },

  async create(data: {
    reportId?: string
    studyId?: string
    patientId: string
    studyType: string
    finding: string
    severity: Severity
    notifiedToUserId: string
    notificationMethod: NotificationMethod
  }) {
    return api.post<{ result: CriticalResult }>('/critical-results', data)
  },

  async acknowledge(id: string, acknowledgedAt?: string) {
    return api.post<{ result: CriticalResult }>(`/critical-results/${id}/acknowledge`, {
      acknowledgedAt,
    })
  },

  async escalate(id: string) {
    return api.post<{ result: CriticalResult }>(`/critical-results/${id}/escalate`)
  },
}
