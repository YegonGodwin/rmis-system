import { api } from './api'

export type Modality = 'CT' | 'MRI' | 'X-Ray' | 'Ultrasound' | 'Mammography' | 'Fluoroscopy'
export type Priority = 'Routine' | 'Urgent' | 'STAT'
export type StudyStatus = 'Scheduled' | 'Checked In' | 'In Progress' | 'Completed' | 'Canceled'

export type StudyImageUpload = {
  imageData: string // base64 data URI
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  seriesDescription?: string
  seriesNumber?: number
  instanceNumber?: number
  notes?: string
}

export type StudyImageMeta = {
  _id: string
  study: string
  seriesDescription: string
  seriesNumber: number
  instanceNumber: number
  mimeType: string
  fileSizeBytes?: number
  notes?: string
  imageData?: string // only present when metaOnly=false
  uploadedBy?: string
  createdAt: string
}

export type Study = {
  _id: string
  studyId: string
  accessionNumber: string
  patient: {
    _id: string
    mrn: string
    fullName: string
  }
  imagingRequest?: {
    _id: string
    requestId: string
    status: string
    priority: string
    modality: string
  }
  modality: Modality
  bodyPart?: string
  priority: Priority
  clinicalIndication?: string
  referringPhysician?: {
    _id: string
    username: string
    fullName: string
    role: string
  }
  scheduledStartAt: string
  room?: {
    _id: string
    name: string
    modality: string
    status: string
  }
  performedStartAt?: string
  performedEndAt?: string
  assignedRadiologist?: {
    _id: string
    username: string
    fullName: string
  }
  assignedAt?: string
  status: StudyStatus
  createdAt: string
  updatedAt: string
}

export type StudiesResponse = {
  studies: Study[]
  page: number
  limit: number
  total: number
}

export const studiesService = {
  async getStudies(params?: {
    status?: string
    priority?: string
    modality?: string
    patientId?: string
    roomId?: string
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
    return api.get<StudiesResponse>(`/studies${queryString ? `?${queryString}` : ''}`)
  },

  async getStudyById(id: string) {
    return api.get<{ study: Study }>(`/studies/${id}`)
  },

  async createStudy(data: {
    patientId: string
    accessionNumber: string
    modality: Modality
    bodyPart?: string
    priority: Priority
    clinicalIndication?: string
    referringPhysicianId?: string
    scheduledStartAt: string
    roomId?: string
    imagingRequestId?: string
    studyId?: string
  }) {
    return api.post<{ study: Study }>(`/studies`, data)
  },

  async updateStudy(
    id: string,
    data: {
      scheduledStartAt?: string
      roomId?: string
      priority?: Priority
    },
  ) {
    return api.patch<{ study: Study }>(`/studies/${id}`, data)
  },

  async updateStudyStatus(
    id: string,
    status: StudyStatus,
    data?: {
      identityMethod?: 'Government ID' | 'Insurance Card' | 'Facility Bracelet' | 'Biometric' | 'Other'
      consentSigned?: boolean
      safetyScreeningCompleted?: boolean
      safetyScreeningNotes?: string
    },
  ) {
    return api.patch<{ study: Study }>(`/studies/${id}/status`, { status, ...data })
  },

  async getTechnicianQueue(params?: {
    status?: string
    roomId?: string
    priority?: string
    modality?: string
    limit?: number
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
    return api.get<{ studies: Study[] }>(`/studies/queue${queryString ? `?${queryString}` : ''}`)
  },

  async uploadImages(
    studyId: string,
    images: StudyImageUpload[],
    completeStudy = true,
  ) {
    return api.post<{ uploaded: number; studyStatus: string }>(`/studies/${studyId}/images`, {
      images,
      completeStudy,
    })
  },

  async getStudyImages(studyId: string, metaOnly = false) {
    return api.get<{ images: StudyImageMeta[]; total: number }>(
      `/studies/${studyId}/images${metaOnly ? '?metaOnly=true' : ''}`,
    )
  },

  async deleteStudyImage(studyId: string, imageId: string) {
    return api.delete<{ message: string }>(`/studies/${studyId}/images/${imageId}`)
  },

  async assignStudy(studyId: string, radiologistId: string | null) {
    return api.patch<{ study: Study }>(`/studies/${studyId}/assign`, { radiologistId })
  },
}
