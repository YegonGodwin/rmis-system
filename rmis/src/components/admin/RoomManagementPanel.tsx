import { useEffect, useState } from 'react'
import { roomsService, type ImagingRoom, type RoomStatus, type Modality } from '../../services/rooms.service'
import { userService, type User } from '../../services/user.service'

const RoomManagementPanel = () => {
  const [rooms, setRooms] = useState<ImagingRoom[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newRoom, setNewRoom] = useState({
    name: '',
    modality: 'X-Ray' as Modality,
    status: 'Active' as RoomStatus,
    notes: '',
    assignedTechnician: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsData, techsData] = await Promise.all([
        roomsService.getRooms(),
        userService.listUsers({ role: 'Technician' })
      ])
      setRooms(roomsData.rooms)
      setTechnicians(techsData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      await roomsService.createRoom({
        ...newRoom,
        assignedTechnician: newRoom.assignedTechnician || undefined
      })
      setIsModalOpen(false)
      setNewRoom({ name: '', modality: 'X-Ray', status: 'Active', notes: '', assignedTechnician: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to create room')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this room? This may affect existing schedules.')) return
    try {
      await roomsService.deleteRoom(id)
      fetchRooms()
    } catch (err: any) {
      alert(err.message || 'Failed to delete room')
    }
  }

  if (loading && rooms.length === 0) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Facility Management</h2>
          <p className="text-sm text-slate-500">Configure imaging rooms and diagnostic resources.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm"
        >
          + Add New Room
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div key={room._id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm ${
                room.modality === 'MRI' ? 'bg-indigo-600' :
                room.modality === 'CT' ? 'bg-blue-600' :
                room.modality === 'X-Ray' ? 'bg-sky-600' :
                'bg-slate-600'
              }`}>
                <span className="text-xs font-bold">{room.modality}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  room.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                  room.status === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {room.status}
                </span>
                <button 
                  onClick={() => handleDelete(room._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-1">{room.notes || 'No description provided.'}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-50 pt-4">
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Utilization</p>
                    <p className="text-sm font-bold text-slate-700">{room.utilizationPercent}%</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Tech</p>
                    <p className="text-sm font-bold text-slate-700 truncate">
                        {room.assignedTechnician?.fullName.split(' ')[0] || 'Unstaffed'}
                    </p>
                </div>
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-500">No rooms configured yet. Add your first imaging suite to begin scheduling.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-xl font-bold text-slate-900 border-b pb-4">Add New Resource</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Room Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., MRI Suite 1"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Modality</label>
                  <select 
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={newRoom.modality}
                    onChange={(e) => setNewRoom({...newRoom, modality: e.target.value as Modality})}
                  >
                    <option value="X-Ray">X-Ray</option>
                    <option value="CT">CT</option>
                    <option value="MRI">MRI</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Mammography">Mammography</option>
                    <option value="Fluoroscopy">Fluoroscopy</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Initial Status</label>
                  <select 
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={newRoom.status}
                    onChange={(e) => setNewRoom({...newRoom, status: e.target.value as RoomStatus})}
                  >
                    <option value="Active">Active</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Assign Technician (Optional)</label>
                <select 
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={newRoom.assignedTechnician}
                  onChange={(e) => setNewRoom({...newRoom, assignedTechnician: e.target.value})}
                >
                  <option value="">-- No Technician --</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Description / Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Machine model, specific features, etc."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={newRoom.notes}
                  onChange={(e) => setNewRoom({...newRoom, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomManagementPanel
