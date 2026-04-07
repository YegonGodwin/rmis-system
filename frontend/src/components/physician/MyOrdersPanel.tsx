import { useEffect, useMemo, useState } from 'react'
import type { ImagingRequest } from '../../services/imagingRequest.service'
import { imagingRequestService } from '../../services/imagingRequest.service'

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Scheduled', 'Completed'] as const
const priorityOptions = ['All', 'Routine', 'Urgent', 'STAT'] as const

const MyOrdersPanel = () => {
  const [orders, setOrders] = useState<ImagingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('All')
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>('All')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await imagingRequestService.list({ limit: 200 })
        setOrders(response.requests)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false
      if (priorityFilter !== 'All' && order.priority !== priorityFilter) return false
      return true
    })
  }, [orders, statusFilter, priorityFilter])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
            <p className="mt-1 text-sm text-slate-500">Track imaging request status and timelines</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as (typeof statusOptions)[number])}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as (typeof priorityOptions)[number])}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Error loading orders</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Modality</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.requestId}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.patient.fullName}</p>
                      <p className="text-xs text-slate-500">MRN: {order.patient.mrn}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{order.modality}</p>
                      <p className="text-xs text-slate-500">{order.bodyPart || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.priority === 'STAT'
                            ? 'bg-red-100 text-red-700'
                            : order.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : order.status === 'Scheduled'
                                ? 'bg-purple-100 text-purple-700'
                                : order.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.approvedAt && (
                        <p className="text-emerald-700">Approved: {new Date(order.approvedAt).toLocaleDateString()}</p>
                      )}
                      {order.rejectedAt && (
                        <p className="text-red-700">Rejected: {new Date(order.rejectedAt).toLocaleDateString()}</p>
                      )}
                      {order.scheduledAt && (
                        <p className="text-purple-700">Scheduled: {new Date(order.scheduledAt).toLocaleDateString()}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrdersPanel
