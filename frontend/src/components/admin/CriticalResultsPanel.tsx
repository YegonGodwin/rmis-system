import { useState, useEffect, useMemo } from 'react'
import {
  criticalResultService,
  type CriticalResult,
  type CriticalResultStatus,
  type Severity,
  type NotificationMethod,
} from '../../services/criticalResult.service'
import { patientService, type Patient } from '../../services/patient.service'
import { userService, type User } from '../../services/user.service'
import { studiesService, type Study } from '../../services/studies.service'

const CriticalResultsPanel = () => {
  const [results, setResults] = useState<CriticalResult[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [physicians, setPhysicians] = useState<User[]>([])
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newResult, setNewResult] = useState({
    patientId: '',
    studyId: '',
    studyType: '',
    finding: '',
    severity: 'Critical' as Severity,
    notifiedToUserId: '',
    notificationMethod: 'Phone' as NotificationMethod,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [resultsData, patientsData, physiciansData, studiesData] = await Promise.all([
        criticalResultService.list({ limit: 100 }),
        patientService.list(),
        userService.listUsers({ role: 'Physician' }),
        studiesService.getStudies({ limit: 200 }),
      ])
      setResults(resultsData.results)
      setPatients(patientsData.patients)
      setPhysicians(physiciansData)
      setStudies(studiesData.studies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch critical results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAcknowledge = async (id: string) => {
    try {
      await criticalResultService.acknowledge(id)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge')
    }
  }

  const handleEscalate = async (id: string) => {
    try {
      await criticalResultService.escalate(id)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to escalate')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await criticalResultService.create({
        patientId: newResult.patientId,
        studyId: newResult.studyId || undefined,
        studyType: newResult.studyType,
        finding: newResult.finding,
        severity: newResult.severity,
        notifiedToUserId: newResult.notifiedToUserId,
        notificationMethod: newResult.notificationMethod,
      })
      setIsModalOpen(false)
      setNewResult({
        patientId: '',
        studyId: '',
        studyType: '',
        finding: '',
        severity: 'Critical',
        notifiedToUserId: '',
        notificationMethod: 'Phone',
      })
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create critical result')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredResults = useMemo(() => {
    if (filterStatus === 'All') return results
    return results.filter((result) => result.status === filterStatus)
  }, [results, filterStatus])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pending = results.filter((r) => r.status === 'Pending').length
    const acknowledgedToday = results.filter((r) => {
      if (r.status !== 'Acknowledged' || !r.acknowledgedAt) return false
      return new Date(r.acknowledgedAt) >= today
    }).length

    // Calculate average response time
    let totalResponseTime = 0
    let countWithResponse = 0
    results.forEach((r) => {
      if (r.acknowledgedAt) {
        const notified = new Date(r.notifiedAt).getTime()
        const acknowledged = new Date(r.acknowledgedAt).getTime()
        totalResponseTime += acknowledged - notified
        countWithResponse++
      }
    })
    const avgResponseMinutes =
      countWithResponse > 0 ? Math.round(totalResponseTime / 1000 / 60 / countWithResponse) : 0

    return { pending, acknowledgedToday, avgResponseMinutes }
  }, [results])

  const getStatusBorderColor = (status: CriticalResultStatus) => {
    switch (status) {
      case 'Pending':
        return 'border-red-200 bg-red-50/30'
      case 'Escalated':
        return 'border-amber-200 bg-amber-50/30'
      default:
        return 'border-slate-200'
    }
  }

  const getStatusBadgeClass = (status: CriticalResultStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-100 text-red-700'
      case 'Acknowledged':
        return 'bg-emerald-100 text-emerald-700'
      case 'Escalated':
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getSeverityBadgeClass = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
      case 'Urgent':
        return 'bg-amber-100 text-amber-700 ring-2 ring-amber-600/20'
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading critical results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading critical results</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pending Notifications</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Acknowledged Today</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.acknowledgedToday}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Avg Response Time</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.avgResponseMinutes} min</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Critical Results Notification</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage urgent findings requiring immediate attention
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          New Critical Finding
        </button>
      </div>

      <div className="flex gap-2 rounded-xl bg-white p-4 shadow-sm">
        {(['All', 'Pending', 'Acknowledged', 'Escalated'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filterStatus === status
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No critical results found matching this filter.
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result._id}
              className={`rounded-2xl border-2 bg-white p-5 shadow-sm ${getStatusBorderColor(result.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-slate-500">
                      {result.criticalResultId}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${getSeverityBadgeClass(result.severity)}`}
                    >
                      {result.severity}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(result.status)}`}
                    >
                      {result.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{result.patient.fullName}</h3>
                      <p className="text-sm text-slate-500">MRN: {result.patient.mrn}</p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium text-slate-700">Study:</span> {result.studyType}
                      </p>
                      <p className="mt-1 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-900">
                        <span className="font-semibold">Finding:</span> {result.finding}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-slate-700">Radiologist:</span>{' '}
                        {result.radiologist.fullName}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Notified To:</span>{' '}
                        {result.notifiedTo.fullName}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Method:</span>{' '}
                        {result.notificationMethod}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Timestamp:</span>{' '}
                        {new Date(result.notifiedAt).toLocaleString()}
                      </p>
                      {result.acknowledgedAt && (
                        <p className="text-emerald-700">
                          <span className="font-medium">Acknowledged:</span>{' '}
                          {new Date(result.acknowledgedAt).toLocaleString()}
                        </p>
                      )}
                      {result.escalatedAt && (
                        <p className="text-amber-700">
                          <span className="font-medium">Escalated:</span>{' '}
                          {new Date(result.escalatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {result.status === 'Pending' && (
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleAcknowledge(result._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleEscalate(result._id)}
                      className="rounded-lg border border-amber-600 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Escalate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900">Report Critical Finding</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="criticalResultForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Patient *
                  </label>
                  <select
                    required
                    value={newResult.patientId}
                    onChange={(e) => {
                      setNewResult({
                        ...newResult,
                        patientId: e.target.value,
                        studyType: '',
                      })
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.fullName} (MRN: {patient.mrn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Associated Study (Optional)
                  </label>
                  <select
                    value={newResult.studyId}
                    onChange={(e) => {
                      const study = studies.find((s) => s._id === e.target.value)
                      setNewResult({
                        ...newResult,
                        studyId: e.target.value,
                        studyType: study ? `${study.modality} ${study.bodyPart || ''}`.trim() : '',
                      })
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="">No associated study</option>
                    {studies.map((study) => (
                      <option key={study._id} value={study._id}>
                        {study.studyId} - {study.modality} {study.bodyPart || ''} -{' '}
                        {study.patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Study Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResult.studyType}
                    onChange={(e) => setNewResult({ ...newResult, studyType: e.target.value })}
                    placeholder="e.g., CT Head, Chest X-Ray"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Severity *
                    </label>
                    <select
                      required
                      value={newResult.severity}
                      onChange={(e) =>
                        setNewResult({ ...newResult, severity: e.target.value as Severity })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Notify To (Physician) *
                    </label>
                    <select
                      required
                      value={newResult.notifiedToUserId}
                      onChange={(e) =>
                        setNewResult({ ...newResult, notifiedToUserId: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Select a physician</option>
                      {physicians.map((physician) => (
                        <option key={physician.id} value={physician.id}>
                          {physician.fullName} ({physician.username})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Critical Finding *
                  </label>
                  <textarea
                    required
                    value={newResult.finding}
                    onChange={(e) => setNewResult({ ...newResult, finding: e.target.value })}
                    rows={4}
                    placeholder="Describe the critical finding..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notification Method *
                  </label>
                  <select
                    required
                    value={newResult.notificationMethod}
                    onChange={(e) =>
                      setNewResult({
                        ...newResult,
                        notificationMethod: e.target.value as NotificationMethod,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="Phone">Phone Call</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="criticalResultForm"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CriticalResultsPanel
