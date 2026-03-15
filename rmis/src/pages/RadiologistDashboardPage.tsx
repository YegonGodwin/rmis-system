import { useMemo, useState } from 'react'
import RadiologistSidebar from '../components/radiologist/RadiologistSidebar'
import WorklistPanel from '../components/radiologist/WorklistPanel'
import ReportingPanel from '../components/radiologist/ReportingPanel'
import MyReportsPanel from '../components/radiologist/MyReportsPanel'
import TemplatesPanel from '../components/radiologist/TemplatesPanel'
import StatCard from '../components/admin/StatCard'
import { useRadiologistDashboard } from '../hooks/useRadiologistDashboard'

type RadiologistDashboardPageProps = {
  onLogout: () => void
}

const RadiologistDashboardPage = ({ onLogout }: RadiologistDashboardPageProps) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [pendingStudy, setPendingStudy] = useState<import('../services/studies.service').Study | null>(null)
  const { stats, worklist, loading, refresh } = useRadiologistDashboard()

  const handleOpenStudy = (study: import('../services/studies.service').Study) => {
    setPendingStudy(study)
    setActiveSection('reporting')
  }

  const kpis = useMemo(
    () => [
      { label: 'Pending Studies', value: stats.pendingStudies.toString(), delta: `${stats.statPriority} STAT priority`, tone: stats.statPriority > 0 ? 'warn' as const : 'good' as const },
      { label: 'Reports Today', value: stats.reportsToday.toString(), delta: 'Completed today', tone: 'good' as const },
      { label: 'Avg Read Time', value: stats.avgReadTime, delta: 'Within target', tone: 'good' as const },
      { label: 'Productivity', value: stats.productivity, delta: 'Above benchmark', tone: 'good' as const },
    ],
    [stats]
  )

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[240px_1fr]">
        <RadiologistSidebar activeId={activeSection} onSelect={setActiveSection} />

        <section className="flex h-full flex-col gap-4 overflow-hidden">
          <header className="shrink-0 rounded-2xl bg-gradient-to-r from-purple-900 to-purple-700 p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-purple-200">Radiologist Workstation</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {activeSection === 'worklist'
                    ? 'My Worklist'
                    : activeSection === 'reporting'
                      ? 'Create Report'
                      : activeSection === 'reports'
                        ? 'My Reports'
                        : activeSection === 'templates'
                          ? 'Report Templates'
                          : 'Dashboard'}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => refresh()}
                  disabled={loading}
                  className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-purple-900 transition hover:bg-purple-50"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {activeSection === 'worklist' ? (
              <WorklistPanel onOpenStudy={handleOpenStudy} />
            ) : activeSection === 'reporting' ? (
              <ReportingPanel preselectedStudy={pendingStudy} />
            ) : activeSection === 'reports' ? (
              <MyReportsPanel />
            ) : activeSection === 'templates' ? (
              <TemplatesPanel />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => (
                    <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Priority Studies</h3>
                    <div className="space-y-3">
                      {worklist.filter(s => s.priority !== 'Routine').length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-4">No priority studies pending</p>
                      ) : (
                        worklist.filter(s => s.priority !== 'Routine').slice(0, 5).map((item) => (
                          <div key={item._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                            <div>
                              <p className="font-medium text-slate-900">{item.patient.fullName}</p>
                              <p className="text-sm text-slate-500">{item.modality} {item.bodyPart}</p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                                  item.priority === 'STAT'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {item.priority}
                              </span>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveSection('worklist')}
                      className="mt-4 w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                    >
                      View Full Worklist
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Today's Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Reports Finalized</span>
                        <span className="text-lg font-bold text-slate-900">{stats.reportsFinalized}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div 
                          className="h-2 rounded-full bg-emerald-500" 
                          style={{ width: `${Math.min(100, (stats.reportsFinalized / 30) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Pending Review</span>
                        <span className="text-lg font-bold text-slate-900">{stats.pendingReview}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div 
                          className="h-2 rounded-full bg-amber-500"
                          style={{ width: `${Math.min(100, (stats.pendingReview / 15) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Critical Findings</span>
                        <span className="text-lg font-bold text-red-600">{stats.criticalFindings}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}


export default RadiologistDashboardPage
