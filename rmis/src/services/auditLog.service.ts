import { api } from './api'

export type AuditLog = {
  id: string
  actor: {
    id: string
    username: string
    fullName: string
    role: string
  }
  action: string
  targetType: string
  targetId: string
  ipAddress: string
  metadata?: any
  createdAt: string
}

export const auditLogService = {
  async list(params?: { actorId?: string; targetType?: string; targetId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.actorId) searchParams.append('actorId', params.actorId)
    if (params?.targetType) searchParams.append('targetType', params.targetType)
    if (params?.targetId) searchParams.append('targetId', params.targetId)
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.limit) searchParams.append('limit', String(params.limit))

    const query = searchParams.toString()
    const path = `/audit-logs${query ? `?${query}` : ''}`

    const response = await api.get<{ logs: any[]; total: number; page: number; limit: number }>(path)
    return {
      logs: response.logs.map((l) => ({
        id: l._id || l.id,
        actor: {
          id: l.actor?._id || l.actor?.id,
          username: l.actor?.username,
          fullName: l.actor?.fullName,
          role: l.actor?.role,
        },
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        ipAddress: l.ipAddress,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })) as AuditLog[],
      total: response.total,
      page: response.page,
      limit: response.limit,
    }
  },
}
