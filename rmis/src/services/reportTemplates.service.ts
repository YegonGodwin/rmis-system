import { api } from './api'

export type ReportTemplate = {
  _id: string
  templateId: string
  name: string
  modality: string
  bodyPart: string
  technique?: string
  findings: string
  impression: string
  recommendations?: string
  createdBy: {
    _id: string
    username: string
    fullName: string
  }
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export type ReportTemplatesResponse = {
  templates: ReportTemplate[]
}

export const reportTemplatesService = {
  async list(params?: { modality?: string; bodyPart?: string; q?: string }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const queryString = queryParams.toString()
    return api.get<ReportTemplatesResponse>(`/report-templates${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string) {
    return api.get<{ template: ReportTemplate }>(`/report-templates/${id}`)
  },

  async create(data: Partial<ReportTemplate>) {
    return api.post<{ template: ReportTemplate }>('/report-templates', data)
  },

  async update(id: string, data: Partial<ReportTemplate>) {
    return api.patch<{ template: ReportTemplate }>(`/report-templates/${id}`, data)
  },

  async delete(id: string) {
    return api.delete<{ template: ReportTemplate }>(`/report-templates/${id}`)
  }
}
