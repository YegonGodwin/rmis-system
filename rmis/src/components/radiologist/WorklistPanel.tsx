import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../../services/studies.service'
import type { Study } from '../../services/studies.service'

const WorklistPanel = () => {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'STAT' | 'Urgent'>('All')
  const [modalityFilter, setModalityFilter] = useState('All')

  const fetchWorklist = useCallback(async () => {
    try {
      setLoading(true)
      const res = await studiesService.getStudies({ status: 'Completed' })
      setStudies(res.studies)
    } catch (err) {
      console.error('Failed to fetch worklist:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorklist()
  }, [fetchWorklist])

  const filteredStudies = studies.filter((s) => {
    const matchesPriority = filter === 'All' || s.priority === filter
    const matchesModality = modalityFilter === 'All' || s.modality === modalityFilter
    return matchesPriority && matchesModality
  })

  const modalities = ['All', ...new Set(studies.map((s) => s.modality))]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading worklist...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reporting Worklist</h2>
          <p className="mt-1 text-sm text-slate-500">Studies awaiting radiologist interpretation</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {(['All', 'STAT', 'Urgent'] as const).map((f) => (
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
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {modalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Study</th>
                <th className="px-6 py-4 font-semibold">Accession</th>
                <th className="px-6 py-4 font-semibold">Completed At</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No studies in your worklist matching filters.
                  </td>
                </tr>
              ) : (
                filteredStudies.map((study) => (
                  <tr
                    key={study._id}
                    className={`transition hover:bg-slate-50/80 ${
                      study.priority === 'STAT' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          study.priority === 'STAT'
                            ? 'bg-red-100 text-red-700 ring-1 ring-red-700/20'
                            : study.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {study.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{study.patient.fullName}</div>
                      <div className="text-xs text-slate-500">MRN: {study.patient.mrn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {study.modality} {study.bodyPart}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{study.accessionNumber}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">
                        {new Date(study.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(study.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500 active:scale-95"
                      >
                        Open Study
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

export default WorklistPanel
