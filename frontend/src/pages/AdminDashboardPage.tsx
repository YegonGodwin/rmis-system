import { useMemo, useState } from 'react'
import AdminSidebar from '../components/admin/AdminSidebar'
import AlertsPanel from '../components/admin/AlertsPanel'
import AuditLogsPanel from '../components/admin/AuditLogsPanel'
import RecentStudiesTable from '../components/admin/RecentStudiesTable'
import StatCard from '../components/admin/StatCard'
import WorkflowBoard from '../components/admin/WorkflowBoard'
import ImagingRequestsPanel from '../components/admin/ImagingRequestsPanel'
import SchedulingPanel from '../components/admin/SchedulingPanel'
import TechnicianManagementPanel from '../components/admin/TechnicianManagementPanel'
import RoomManagementPanel from '../components/admin/RoomManagementPanel'
import ReportsPanel from '../components/admin/ReportsPanel'
import PatientsPanel from '../components/admin/PatientsPanel'
import CriticalResultsPanel from '../components/admin/CriticalResultsPanel'
import UserManagementPanel from '../components/admin/UserManagementPanel'
import { useReportsStats } from '../hooks/useReportsStats'
import { useDashboardOverview } from '../hooks/useDashboardOverview'

type AdminDashboardPageProps = {
  onLogout: () => void
}

const AdminDashboardPage = ({ onLogout }: AdminDashboardPageProps) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [prefillRequest, setPrefillRequest] = useState<any>(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const reportsStats = useReportsStats()
  const { stats, workflow, recentStudies, alerts, loading, error } = useDashboardOverview()

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setGlobalSearch(searchInput)
    setActiveSection('patients')
  }

  const kpis = useMemo(
    () => [
      {
        label: 'Today Requests',
        value: String(stats.todayRequests),
        delta: 'Live from requests',
        tone: 'good' as const,
      },
      {
        label: 'Pending Reports',
        value: String(reportsStats.pendingReports),
        delta: 'Live from reports',
        tone: 'warn' as const,
      },
      {
        label: 'Avg Turnaround',
        value: reportsStats.avgTurnaround,
        delta: 'Calculated from finalized',
        tone: 'good' as const,
      },
      {
        label: 'Active Patients',
        value: String(stats.activePatients),
        delta: 'Scheduled today',
        tone: 'neutral' as const,
      },
    ],
    [stats.todayRequests, stats.activePatients, reportsStats.pendingReports, reportsStats.avgTurnaround],
  )

  const workflowColumns = useMemo(
    () => [
      {
        title: 'Requested',
        count: workflow.requested.count,
        accent: 'bg-amber-50 text-amber-700',
        items: workflow.requested.items,
      },
      {
        title: 'Scheduled',
        count: workflow.scheduled.count,
        accent: 'bg-sky-50 text-sky-700',
        items: workflow.scheduled.items,
      },
      {
        title: 'In Reporting',
        count: workflow.inReporting.count,
        accent: 'bg-violet-50 text-violet-700',
        items: workflow.inReporting.items,
      },
      {
        title: 'Completed',
        count: workflow.completed.count,
        accent: 'bg-emerald-50 text-emerald-700',
        items: workflow.completed.items,
      },
    ],
    [workflow],
  )

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[240px_1fr]">
        <AdminSidebar activeId={activeSection} onSelect={setActiveSection} />

        <section className="flex h-full flex-col gap-4 overflow-hidden">
          <header className="shrink-0 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[200px]">
                <p className="text-sm text-slate-200">Radiology Department Control Center</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {activeSection === 'audit'
                    ? 'Audit Logs'
                    : activeSection === 'requests'
                      ? 'Imaging Requests'
                      : activeSection === 'schedule'
                        ? 'Scheduling & Resources'
                        : activeSection === 'tech-mgmt'
                          ? 'Technician Management'
                        : activeSection === 'room-mgmt'
                          ? 'Room Management'
                          : activeSection === 'reports'
                            ? 'Radiology Reports'
                          : activeSection === 'patients'
                            ? 'Patient Directory'
                            : activeSection === 'critical'
                              ? 'Critical Results'
                              : activeSection === 'users'
                                ? 'User Management'
                                : 'Admin Dashboard'}
                </h2>
              </div>

              <form onSubmit={handleGlobalSearch} className="flex-1 max-w-md hidden lg:block mx-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Patient MRN or Name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2 pl-10 text-sm text-white placeholder:text-slate-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25"
                >
                  New Request
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-4 space-y-4">
            {activeSection === 'audit' ? (
              <AuditLogsPanel />
            ) : activeSection === 'requests' ? (
              <ImagingRequestsPanel 
                onSchedule={(req) => {
                  setPrefillRequest(req)
                  setActiveSection('schedule')
                }} 
              />
            ) : activeSection === 'schedule' ? (
              <SchedulingPanel 
                prefillRequest={prefillRequest} 
                onClearPrefill={() => setPrefillRequest(null)}
              />
            ) : activeSection === 'tech-mgmt' ? (
              <TechnicianManagementPanel />
            ) : activeSection === 'room-mgmt' ? (
              <RoomManagementPanel />
            ) : activeSection === 'reports' ? (
              <ReportsPanel />
            ) : activeSection === 'patients' ? (
              <PatientsPanel initialSearch={globalSearch} />
            ) : activeSection === 'critical' ? (
              <CriticalResultsPanel />
            ) : activeSection === 'users' ? (
              <UserManagementPanel />
            ) : (
              <>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-slate-500">Loading dashboard...</div>
                  </div>
                ) : error ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="rounded-lg bg-red-50 p-4 text-red-700">
                      <p className="font-semibold">Error loading dashboard</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.map((kpi) => (
                        <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
                      ))}
                    </div>

                    <WorkflowBoard columns={workflowColumns} />

                    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                      <RecentStudiesTable studies={recentStudies} />
                      <AlertsPanel alerts={alerts} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboardPage
