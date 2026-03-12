import { useState, useEffect } from 'react'
import type { CriticalResult } from '../../services/criticalResult.service'
import { criticalResultService } from '../../services/criticalResult.service'

type CriticalAlert = CriticalResult

type CriticalAlertsPanelProps = {
  compact?: boolean
}

const CriticalAlertsPanel = ({ compact = false }: CriticalAlertsPanelProps) => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await criticalResultService.list({ limit: 50 })
        setAlerts(response.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch critical alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const handleAcknowledge = async (id: string) => {
    try {
      await criticalResultService.acknowledge(id, new Date().toISOString())
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === id
            ? { ...alert, status: 'Acknowledged', acknowledgedAt: new Date().toISOString() }
            : alert
        )
      )
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    }
  }

  const unacknowledgedCount = alerts.filter((a) => a.status === 'Pending').length

  if (compact) {
    if (loading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Critical Alerts</h3>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-sm text-slate-500">Loading alerts...</p>
        </div>
      )
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Critical Alerts</h3>
          {unacknowledgedCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
              {unacknowledgedCount} New
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && alerts.length === 0 && (
          <p className="text-sm text-slate-500">No critical alerts</p>
        )}
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert._id}
              className={`rounded-lg border-2 p-3 ${
                alert.status === 'Acknowledged' ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{alert.patient.fullName}</p>
                  <p className="text-sm text-slate-600">{alert.studyType}</p>
                  <p className="mt-1 text-sm font-medium text-red-700">{alert.finding}</p>
                </div>
                {alert.status === 'Pending' && (
                  <button
                    onClick={() => handleAcknowledge(alert._id)}
                    className="ml-2 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unacknowledged</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{unacknowledgedCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Alerts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{alerts.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Last 24 Hours</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {alerts.filter((a) => {
              const oneDayAgo = new Date()
              oneDayAgo.setDate(oneDayAgo.getDate() - 1)
              return new Date(a.notifiedAt) >= oneDayAgo
            }).length}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Error loading alerts</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-lg font-medium">No critical alerts</p>
          <p className="text-sm">All caught up!</p>
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Critical Findings Alert</h2>
            <p className="mt-1 text-sm text-slate-500">Urgent findings requiring immediate attention</p>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`rounded-2xl border-2 p-5 ${
                  alert.status === 'Acknowledged' ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-medium text-slate-500">{alert.criticalResultId}</span>
                      {alert.status === 'Pending' && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 ring-2 ring-red-600/20">
                          UNACKNOWLEDGED
                        </span>
                      )}
                      {alert.status === 'Acknowledged' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Acknowledged
                        </span>
                      )}
                      {alert.status === 'Escalated' && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                          ESCALATED
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{alert.patient.fullName}</h3>
                        <p className="text-sm text-slate-500">MRN: {alert.patient.mrn}</p>
                        <p className="mt-2 text-sm">
                          <span className="font-medium text-slate-700">Study:</span> {alert.studyType}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm">
                          <span className="font-medium text-slate-700">Radiologist:</span> {alert.radiologist.fullName}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-slate-700">Time:</span>{' '}
                          {new Date(alert.notifiedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-red-100 p-3">
                      <p className="text-xs font-semibold uppercase text-red-700">Critical Finding</p>
                      <p className="mt-1 font-medium text-red-900">{alert.finding}</p>
                    </div>
                  </div>

                  {alert.status === 'Pending' && (
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        Acknowledge
                      </button>
                      <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        View Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CriticalAlertsPanel
