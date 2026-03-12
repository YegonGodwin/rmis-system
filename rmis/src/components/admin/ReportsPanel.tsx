import { useEffect, useState } from 'react'
import { reportsService, type Report as ApiReport } from '../../services/reports.service'

const ReportsPanel = () => {
    const [reports, setReports] = useState<ApiReport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, pending: 0, avgTurnaround: '0h 0m' })

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await reportsService.getReports({ limit: 50, page: 1 })
                setReports(data.reports)

                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const reportsToday = data.reports.filter((r) => {
                    const createdAt = new Date(r.createdAt)
                    return createdAt >= today
                })

                const pendingReports = data.reports.filter((r) => r.status === 'Draft' || r.status === 'Preliminary')

                const finalizedReports = data.reports.filter((r) => r.finalizedAt && r.createdAt)
                let totalTurnaroundMs = 0
                finalizedReports.forEach((r) => {
                    const created = new Date(r.createdAt).getTime()
                    const finalized = new Date(r.finalizedAt!).getTime()
                    totalTurnaroundMs += finalized - created
                })
                const avgTurnaroundMs = finalizedReports.length > 0 ? totalTurnaroundMs / finalizedReports.length : 0
                const avgHours = Math.floor(avgTurnaroundMs / (1000 * 60 * 60))
                const avgMinutes = Math.floor((avgTurnaroundMs % (1000 * 60 * 60)) / (1000 * 60))

                setStats({
                    total: reportsToday.length,
                    pending: pendingReports.length,
                    avgTurnaround: `${avgHours}h ${avgMinutes}m`,
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch reports')
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-slate-500">Loading reports...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                    <p className="font-semibold">Error loading reports</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Reports Today</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Pending Signature</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Turnaround Time</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.avgTurnaround}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">Radiology Reports</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Report ID</th>
                                <th className="px-6 py-3 font-semibold">Patient</th>
                                <th className="px-6 py-3 font-semibold">Study</th>
                                <th className="px-6 py-3 font-semibold">Radiologist</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{report.reportId}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{report.patient.fullName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{report.studyType}</div>
                                            <div className="text-xs text-slate-500">
                                                {report.study.scheduledStartAt
                                                    ? new Date(report.study.scheduledStartAt).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{report.radiologist.fullName}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${report.status === 'Final'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : report.status === 'Draft'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                    }`}
                                            >
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ReportsPanel
