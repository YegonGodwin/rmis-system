import { useState, useEffect, useCallback } from 'react'
import { reportsService } from '../../services/reports.service'
import type { Report } from '../../services/reports.service'

const MyReportsPanel = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Final'>('All')

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reportsService.getReports()
      setReports(res.reports)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredReports = reports.filter((r) => {
    if (filter === 'All') return true
    return r.status === filter
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Reports</h2>
          <p className="mt-1 text-sm text-slate-500">View and manage your radiology reports</p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {(['All', 'Draft', 'Final'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  filter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {filteredReports.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            No reports found.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report._id}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'Final'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {report.status}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-purple-700">
                    {report.patient.fullName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {report.study.modality} {report.study.bodyPart} • {report.study.accessionNumber}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                  <p>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="mb-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Impression</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600 italic">
                  "{report.impression || 'No impression provided'}"
                </p>
              </div>

              {report.isCritical && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Critical Finding Reported</span>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                  View Full Report
                </button>
                {report.status === 'Draft' && (
                  <button className="flex-1 rounded-lg bg-purple-600 py-2 text-xs font-bold text-white transition hover:bg-purple-500">
                    Continue Writing
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyReportsPanel
