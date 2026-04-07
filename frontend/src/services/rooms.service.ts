import { api } from './api'

export type RoomStatus = 'Active' | 'Idle' | 'Maintenance' | 'Offline'
export type Modality = 'CT' | 'MRI' | 'X-Ray' | 'Ultrasound' | 'Mammography' | 'Fluoroscopy'

export type ImagingRoom = {
  _id: string
  name: string
  modality: Modality
  status: RoomStatus
  utilizationPercent: number
  notes?: string
  assignedTechnician?: {
    _id: string
    fullName: string
    username: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

export type RoomsResponse = {
  rooms: ImagingRoom[]
}

export const roomsService = {
  async getRooms(params?: { modality?: string; status?: string; q?: string }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const queryString = queryParams.toString()
    return api.get<RoomsResponse>(`/rooms${queryString ? `?${queryString}` : ''}`)
  },

  async getRoomById(id: string) {
    return api.get<{ room: ImagingRoom }>(`/rooms/${id}`)
  },

  async createRoom(data: {
    name: string
    modality: Modality
    status?: RoomStatus
    utilizationPercent?: number
    notes?: string
    assignedTechnician?: string
  }) {
    return api.post<{ room: ImagingRoom }>(`/rooms`, data)
  },

  async updateRoom(
    id: string,
    data: {
      name?: string
      modality?: Modality
      status?: RoomStatus
      utilizationPercent?: number
      notes?: string
      assignedTechnician?: string | null
    },
  ) {
    return api.patch<{ room: ImagingRoom }>(`/rooms/${id}`, data)
  },

  async deleteRoom(id: string) {
    return api.delete<{ room: ImagingRoom }>(`/rooms/${id}`)
  },
}
