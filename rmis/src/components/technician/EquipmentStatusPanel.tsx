import { useState, useEffect, useCallback } from 'react'
import { roomsService } from '../../services/rooms.service'
import type { ImagingRoom, RoomStatus } from '../../services/rooms.service'

const EquipmentStatusPanel = () => {
  const [equipment, setEquipment] = useState<ImagingRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEquipment, setSelectedEquipment] = useState<ImagingRoom | null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true)
      const res = await roomsService.getRooms()
      setEquipment(res.rooms)
    } catch (err) {
      console.error('Failed to fetch equipment:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const handleUpdateStatus = async (id: string, newStatus: RoomStatus) => {
    try {
      setUpdating(true)
      await roomsService.updateRoom(id, { status: newStatus })
      await fetchEquipment()
      setSelectedEquipment(null)
    } catch (err) {
      console.error('Failed to update room status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const activeCount = equipment.filter((e) => e.status === 'Active').length
  const maintenanceCount = equipment.filter((e) => e.status === 'Maintenance').length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading equipment status...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Equipment</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">In Maintenance</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{maintenanceCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Rooms</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{equipment.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Equipment Status</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor and manage imaging equipment</p>
        </div>
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
        >
          Update Status
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {equipment.map((eq) => (
          <div
            key={eq._id}
            className={`cursor-pointer rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${
              eq.status === 'Maintenance'
                ? 'border-amber-200 bg-amber-50/30'
                : eq.status === 'Active'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200'
            }`}
            onClick={() => setSelectedEquipment(eq)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{eq.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      eq.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : eq.status === 'Idle'
                          ? 'bg-blue-100 text-blue-700'
                          : eq.status === 'Maintenance'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {eq.modality}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Current Utilization</span>
                  <span className="font-semibold text-slate-900">{eq.utilizationPercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      eq.utilizationPercent > 80
                        ? 'bg-red-500'
                        : eq.utilizationPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${eq.utilizationPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium text-slate-700">{new Date(eq.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEquipment(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedEquipment.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedEquipment.modality}
                </p>
              </div>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Current Status</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{selectedEquipment.status}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">Utilization</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{selectedEquipment.utilizationPercent}%</p>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button 
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedEquipment._id, selectedEquipment.status === 'Active' ? 'Maintenance' : 'Active')}
                  className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {selectedEquipment.status === 'Active' ? 'Move to Maintenance' : 'Mark as Active'}
                </button>
                <button className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMaintenanceModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-slate-900">Quick Status Update</h3>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateStatus(formData.get('equipment') as string, formData.get('status') as RoomStatus);
              setShowMaintenanceModal(false);
            }}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Equipment</label>
                <select name="equipment" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  {equipment.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">New Status</label>
                <select name="status" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Idle">Idle</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


export default EquipmentStatusPanel
