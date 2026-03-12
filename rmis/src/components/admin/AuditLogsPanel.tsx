import { useEffect, useState } from 'react'
import { auditLogService, type AuditLog } from '../../services/auditLog.service'

const AuditLogsPanel = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await auditLogService.list({ limit: 50 })
      setLogs(data.logs)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[400px] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">Track access, status changes, and report actions.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="rounded-l-lg px-3 py-2 font-semibold">Log ID</th>
              <th className="px-3 py-2 font-semibold">Actor</th>
              <th className="px-3 py-2 font-semibold">Action</th>
              <th className="px-3 py-2 font-semibold">Target</th>
              <th className="px-3 py-2 font-semibold">Timestamp</th>
              <th className="rounded-r-lg px-3 py-2 font-semibold">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-slate-500">
                  No audit logs found.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
                  {log.id.slice(-8).toUpperCase()}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">{log.actor?.fullName || 'System'}</div>
                  <div className="text-[10px] text-slate-400">@{log.actor?.username || 'system'}</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="text-slate-600">{log.targetType}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{log.targetId}</div>
                </td>
                <td className="px-3 py-3 text-slate-500 tabular-nums">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-slate-400">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AuditLogsPanel
