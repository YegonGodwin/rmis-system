import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../../services/studies.service'
import type { Study, StudyStatus } from '../../services/studies.service'
import ImageUploadModal from './ImageUploadModal'

const ScanQueuePanel = () => {
  const [queue, setQueue] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'STAT' | 'Checked In' | 'Re-scan'>('All')
  const [selectedItem, setSelectedItem] = useState<Study | null>(null)
  const [updating, setUpdating] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<Study | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true)
      const [res, rejected] = await Promise.all([
        studiesService.getTechnicianQueue(),
        studiesService.getStudies({ status: 'Requires Re-scan' })
      ])
      const combined = [...res.studies, ...rejected.studies].filter((s, i, a) => a.findIndex(t => t._id === s._id) === i)
      setQueue(combined)
    } catch (err) {
      console.error('Failed to fetch queue:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const filteredQueue = queue.filter((item) => {
    if (filter === 'STAT') return item.priority === 'STAT'
    if (filter === 'Checked In') return item.status === 'Checked In'
    if (filter === 'Re-scan') return item.status === 'Requires Re-scan'
    return true
  })

  const handleUpdateStatus = async (id: string, newStatus: StudyStatus) => {
    try {
      setUpdating(true)
      await studiesService.updateStudyStatus(id, newStatus)
      await fetchQueue()
      setSelectedItem(null)
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Scan Queue</h2>
          <p className="mt-1 text-sm text-slate-500">Manage scheduled imaging procedures</p>
        </div>
        <div className="flex gap-2">
          {(['All', 'STAT', 'Checked In', 'Re-scan'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Study</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No items in queue matching filters
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition hover:bg-slate-50 ${
                      item.priority === 'STAT' ? 'bg-red-50/30' : ''
                    } ${item.status === 'Requires Re-scan' ? 'bg-red-50 border-l-4 border-l-red-600' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {new Date(item.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          item.priority === 'STAT'
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
                            : item.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.patient.fullName}</div>
                      <div className="text-xs text-slate-500">
                        MRN: {item.patient.mrn}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {item.modality} {item.bodyPart}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{item.accessionNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {item.room?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : item.status === 'Checked In'
                                ? 'bg-teal-100 text-teal-700'
                                : item.status === 'Requires Re-scan'
                                  ? 'bg-red-100 text-red-700 animate-pulse'
                                  : item.status === 'Canceled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-500"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Scan Details</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedItem.accessionNumber}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Patient</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{selectedItem.patient.fullName}</p>
                  <p className="text-sm text-slate-500">MRN: {selectedItem.patient.mrn}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Study</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {selectedItem.modality} {selectedItem.bodyPart}
                  </p>
                  <p className="text-sm text-slate-600">Room: {selectedItem.room?.name || 'Unassigned'}</p>
                  <p className="text-sm text-slate-600">Time: {new Date(selectedItem.scheduledStartAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {selectedItem.clinicalIndication && (
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Clinical Indication</p>
                  <p className="mt-2 text-slate-900">{selectedItem.clinicalIndication}</p>
                </div>
              )}

              {selectedItem.status === 'Requires Re-scan' && selectedItem.radiologistFeedback && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Radiologist Feedback (Re-scan Required)
                  </p>
                  <p className="mt-2 text-red-900 font-medium">{selectedItem.radiologistFeedback}</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Current Status</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedItem.status}</p>
              </div>

              <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                {selectedItem.status === 'Scheduled' && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedItem._id, 'Checked In')}
                    className="rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                  >
                    Mark Checked In
                  </button>
                )}
                {(selectedItem.status === 'Checked In' || selectedItem.status === 'Requires Re-scan') && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedItem._id, 'In Progress')}
                    className="rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {selectedItem.status === 'Requires Re-scan' ? 'Start Re-scan' : 'Start Scan'}
                  </button>
                )}
                {selectedItem.status === 'In Progress' && (
                  <button
                    disabled={updating}
                    onClick={() => {
                      setSelectedItem(null)
                      setUploadTarget(selectedItem)
                    }}
                    className="rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Submit Images &amp; Complete
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadTarget && (
        <ImageUploadModal
          study={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={() => {
            setUploadTarget(null)
            fetchQueue()
          }}
        />
      )}
    </div>
  )
}


export default ScanQueuePanel
