import { api } from './api'

export type Modality = 'CT' | 'MRI' | 'X-Ray' | 'Ultrasound' | 'Mammography' | 'Fluoroscopy'
export type Priority = 'Routine' | 'Urgent' | 'STAT'
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Scheduled'

export type ImagingRequest = {
  _id: string
  requestId: string
  patient: {
    _id: string
    mrn: string
    fullName: string
  }
  modality: Modality
  bodyPart?: string
  priority: Priority
  clinicalIndication: string
  specialInstructions?: string
  requestedBy: {
    _id: string
    username: string
    fullName: string
    role: string
  }
  status: RequestStatus
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  scheduledAt?: string
}

export type ImagingRequestsResponse = {
  requests: ImagingRequest[]
  page: number
  limit: number
  total: number
}

export const imagingRequestService = {
  async list(params?: { status?: string; priority?: string; modality?: string; patientId?: string; limit?: number; page?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const queryString = queryParams.toString()
    return api.get<ImagingRequestsResponse>(`/imaging-requests${queryString ? `?${queryString}` : ''}`)
  },

  async create(data: {
    patientId: string
    modality: Modality
    bodyPart: string
    priority: Priority
    clinicalIndication: string
    specialInstructions?: string
  }) {
    const response = await api.post<{ request: ImagingRequest }>('/imaging-requests', data)
    return response.request
  },

  async approve(id: string) {
    const response = await api.post<{ request: ImagingRequest }>(`/imaging-requests/${id}/approve`)
    return response.request
  },

  async reject(id: string) {
    const response = await api.post<{ request: ImagingRequest }>(`/imaging-requests/${id}/reject`)
    return response.request
  },
}
