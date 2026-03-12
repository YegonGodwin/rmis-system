import { api } from './api'

export interface Patient {
  _id: string
  mrn: string
  fullName: string
  dob: string | Date
  gender: 'Male' | 'Female' | 'Other'
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
  isActive: boolean
  lastVisitAt?: string | Date
  createdAt: string | Date
  updatedAt: string | Date
}

export interface PatientTimelineEvent {
  id: string
  type: 'Request' | 'Study' | 'Report'
  date: string
  title: string
  subtitle: string
  status: string
  priority?: string
  isCritical?: boolean
  details?: string
}

export interface PatientTimelineResponse {
  patient: Patient
  timeline: PatientTimelineEvent[]
}

export interface ListPatientsResponse {
  patients: Patient[]
  page: number
  limit: number
  total: number
}

export interface ListPatientsParams {
  q?: string
  mrn?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export const patientService = {
  async list(params: ListPatientsParams = {}): Promise<ListPatientsResponse> {
    const query = new URLSearchParams()
    if (params.q) query.append('q', params.q)
    if (params.mrn) query.append('mrn', params.mrn)
    if (params.isActive !== undefined) query.append('isActive', String(params.isActive))
    if (params.page) query.append('page', String(params.page))
    if (params.limit) query.append('limit', String(params.limit))

    const queryString = query.toString()
    return api.get<ListPatientsResponse>(`/patients${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string): Promise<{ patient: Patient }> {
    return api.get<{ patient: Patient }>(`/patients/${id}`)
  },

  async create(data: Partial<Patient>): Promise<{ patient: Patient }> {
    return api.post<{ patient: Patient }>('/patients', data)
  },

  async update(id: string, data: Partial<Patient>): Promise<{ patient: Patient }> {
    return api.patch<{ patient: Patient }>(`/patients/${id}`, data)
  },

  async setActive(id: string, isActive: boolean): Promise<{ patient: Patient }> {
    return api.patch<{ patient: Patient }>(`/patients/${id}/active`, { isActive })
  },

  async getTimeline(id: string): Promise<PatientTimelineResponse> {
    return api.get<PatientTimelineResponse>(`/patients/${id}/timeline`)
  },
}
