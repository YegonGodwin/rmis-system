import { useEffect, useMemo, useState } from 'react'
import { imagingRequestService, type ImagingRequest } from '../../services/imagingRequest.service'

type ImagingRequestsPanelProps = {
  onSchedule?: (request: ImagingRequest) => void
}

const ImagingRequestsPanel = ({ onSchedule }: ImagingRequestsPanelProps) => {
  const [requests, setRequests] = useState<ImagingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Urgent'>('All')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await imagingRequestService.list({
        status: filter === 'Pending' ? 'Pending' : undefined,
      })
      setRequests(response.requests)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch imaging requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const handleApprove = async (id: string) => {
    try {
      const updated = await imagingRequestService.approve(id)
      setRequests((prev) => prev.map((req) => (req._id === id ? updated : req)))
    } catch (err: any) {
      alert(err.message || 'Failed to approve request')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const updated = await imagingRequestService.reject(id)
      setRequests((prev) => prev.map((req) => (req._id === id ? updated : req)))
    } catch (err: any) {
      alert(err.message || 'Failed to reject request')
    }
  }

  const filteredRequests = useMemo(() => {
    if (filter === 'Urgent') {
      return requests.filter((req) => req.priority === 'Urgent' || req.priority === 'STAT')
    }
    return requests
  }, [requests, filter])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Imaging Requests Queue</h2>
          <p className="mt-1 text-sm text-slate-500">Manage incoming radiology orders from referring physicians.</p>
        </div>
        <div className="flex gap-2">
          {(['All', 'Pending', 'Urgent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Request ID</th>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Modality</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Details</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {!loading && filteredRequests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No requests found matching this filter.
                </td>
              </tr>
            )}
            {filteredRequests.map((req) => (
              <tr key={req._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{req.requestId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{req.patient?.fullName}</div>
                  <div className="text-xs text-slate-400">MRN: {req.patient?.mrn}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {req.modality}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      req.priority === 'STAT'
                        ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        : req.priority === 'Urgent'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                          : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10'
                    }`}
                  >
                    {req.priority}
                  </span>
                </td>
                <td className="hidden max-w-xs px-4 py-3 md:table-cell">
                  <div className="line-clamp-1 text-slate-600" title={req.clinicalIndication}>
                    {req.clinicalIndication}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">By {req.requestedBy?.fullName}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === 'Pending'
                        ? 'bg-yellow-50 text-yellow-800'
                        : req.status === 'Approved'
                          ? 'bg-green-50 text-green-700'
                          : req.status === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {req.status === 'Pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(req._id)}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : req.status === 'Approved' ? (
                    <button
                      onClick={() => onSchedule?.(req)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Schedule
                    </button>
                  ) : (
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-500">View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ImagingRequestsPanel
