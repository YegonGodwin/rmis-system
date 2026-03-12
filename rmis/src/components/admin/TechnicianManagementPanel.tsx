import { useEffect, useState } from 'react'
import { roomsService, type ImagingRoom } from '../../services/rooms.service'
import { userService, type User } from '../../services/user.service'

const TechnicianManagementPanel = () => {
  const [rooms, setRooms] = useState<ImagingRoom[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsData, techsData] = await Promise.all([
        roomsService.getRooms(),
        userService.listUsers({ role: 'Technician' }),
      ])
      setRooms(roomsData.rooms)
      setTechnicians(techsData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch technician data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAssign = async (roomId: string, technicianId: string | null) => {
    try {
      setIsUpdating(roomId)
      await roomsService.updateRoom(roomId, { assignedTechnician: technicianId })
      
      // Update local state
      setRooms(prev => prev.map(room => {
        if (room._id === roomId) {
          const tech = technicians.find(t => t.id === technicianId)
          return {
            ...room,
            assignedTechnician: tech ? {
              _id: tech.id,
              fullName: tech.fullName,
              username: tech.username,
              role: tech.role
            } : undefined
          }
        }
        return room
      }))
    } catch (err: any) {
      alert(err.message || 'Failed to assign technician')
    } finally {
      setIsUpdating(null)
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Room Assignment Control</h2>
            <p className="mt-1 text-sm text-slate-500">Deploy technicians to imaging rooms based on shift needs.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Active Rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-600">Unassigned Rooms</span>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div 
              key={room._id} 
              className={`rounded-xl border p-4 transition shadow-sm hover:shadow-md ${
                room.assignedTechnician ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{room.name}</h3>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{room.modality}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  room.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                  room.status === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {room.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    room.assignedTechnician ? 'bg-emerald-100 border-emerald-200' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {room.assignedTechnician ? (
                      <span className="font-bold text-emerald-700">{room.assignedTechnician.fullName[0]}</span>
                    ) : (
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {room.assignedTechnician ? room.assignedTechnician.fullName : 'Vacant'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {room.assignedTechnician ? `@${room.assignedTechnician.username}` : 'Needs technician'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    disabled={isUpdating === room._id}
                    value={room.assignedTechnician?._id || ''}
                    onChange={(e) => handleAssign(room._id, e.target.value || null)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">-- Assign Technician --</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.fullName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Technician Availability</h3>
          <div className="divide-y divide-slate-100">
            {technicians.map((tech) => {
              const assignedRoom = rooms.find(r => r.assignedTechnician?._id === tech.id)
              return (
                <div key={tech.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                      {tech.fullName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tech.fullName}</p>
                      <p className="text-xs text-slate-500">@{tech.username}</p>
                    </div>
                  </div>
                  {assignedRoom ? (
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 uppercase">
                      In {assignedRoom.name}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">
                      Available
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Shift Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="text-sm text-slate-600">Total Technicians</span>
              <span className="text-xl font-bold text-slate-900">{technicians.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
              <span className="text-sm text-emerald-700">Deployed</span>
              <span className="text-xl font-bold text-emerald-900">
                {rooms.filter(r => r.assignedTechnician).length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
              <span className="text-sm text-amber-700">Capacity Utilization</span>
              <span className="text-xl font-bold text-amber-900">
                {technicians.length > 0 
                  ? Math.round((rooms.filter(r => r.assignedTechnician).length / technicians.length) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechnicianManagementPanel
