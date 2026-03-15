import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../../services/studies.service'
import type { Study } from '../../services/studies.service'
import { auth } from '../../services/auth'
import type { AuthUser } from '../../services/auth'

type Tab = 'mine' | 'unassigned'

const WorklistPanel = ({ onOpenStudy }: { onOpenStudy?: (study: Study) => void }) => {
  const [tab, setTab] = useState<Tab>('mine')
  const [myStudies, setMyStudies] = useState<Study[]>([])
  const [unassigned, setUnassigned] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [filter, setFilter] = useState<'All' | 'STAT' | 'Urgent'>('All')
  const [modalityFilter, setModalityFilter] = useState('All')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    auth.me().then((res) => setCurrentUser(res.user)).catch(() => {})
  }, [])

  const fetchWorklist = useCallback(async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const [allCompleted] = await Promise.all([
        studiesService.getStudies({ status: 'Completed', limit: 200 }),
      ])
      const mine = allCompleted.studies.filter((s) => {
        const assigned = s.assignedRadiologist
        if (!assigned) return false
        // handle both populated object and raw string ID
        const assignedId = typeof assigned === 'object' ? assigned._id : assigned
        return assignedId === currentUser.id
      })
      const pool = allCompleted.studies.filter((s) => !s.assignedRadiologist)
      setMyStudies(mine)
      setUnassigned(pool)
    } catch (err) {
      console.error('Failed to fetch worklist:', err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchWorklist()
  }, [fetchWorklist])

  const handleSelfAssign = async (study: Study) => {
    if (!currentUser) return
    try {
      setClaiming(study._id)
      await studiesService.assignStudy(study._id, currentUser.id)
      await fetchWorklist()
    } catch (err) {
      console.error('Failed to claim study:', err)
    } finally {
      setClaiming(null)
    }
  }

  const applyFilters = (list: Study[]) =>
    list.filter((s) => {
      const matchesPriority = filter === 'All' || s.priority === filter
      const matchesModality = modalityFilter === 'All' || s.modality === modalityFilter
      return matchesPriority && matchesModality
    })

  const activeList = applyFilters(tab === 'mine' ? myStudies : unassigned)
  const modalities = ['All', ...new Set([...myStudies, ...unassigned].map((s) => s.modality))]

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
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
          >
            {modalities.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setTab('mine')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'mine' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Assigned to Me
          {myStudies.length > 0 && (
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
              {myStudies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('unassigned')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'unassigned' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unassigned Pool
          {unassigned.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {unassigned.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl bg-white shadow-sm">
          <div className="text-slate-500">Loading worklist...</div>
        </div>
      ) : (
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
                  {tab === 'mine' && <th className="px-6 py-4 font-semibold">Assigned</th>}
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {tab === 'mine'
                        ? 'No studies assigned to you. Check the unassigned pool or wait for admin assignment.'
                        : 'No unassigned studies in the pool.'}
                    </td>
                  </tr>
                ) : (
                  activeList.map((study) => (
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
                        <div className="font-medium text-slate-700">{study.modality} {study.bodyPart}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{study.accessionNumber}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600">{new Date(study.updatedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(study.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      {tab === 'mine' && (
                        <td className="px-6 py-4">
                          {study.assignedAt && (
                            <div className="text-xs text-slate-500">
                              {new Date(study.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {tab === 'mine' ? (
                          <button
                            onClick={() => onOpenStudy?.(study)}
                            className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500 active:scale-95">
                            Open Study
                          </button>
                        ) : (
                          <button
                            disabled={claiming === study._id}
                            onClick={() => handleSelfAssign(study)}
                            className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400 disabled:opacity-50"
                          >
                            {claiming === study._id ? 'Claiming...' : 'Claim Study'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorklistPanel
