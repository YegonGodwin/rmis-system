import { useMemo, useState } from 'react'
import TechnicianSidebar from '../components/technician/TechnicianSidebar'
import ScanQueuePanel from '../components/technician/ScanQueuePanel'
import PatientCheckInPanel from '../components/technician/PatientCheckInPanel'
import EquipmentStatusPanel from '../components/technician/EquipmentStatusPanel'
import QualityControlPanel from '../components/technician/QualityControlPanel'
import StatCard from '../components/admin/StatCard'
import { useTechnicianDashboard } from '../hooks/useTechnicianDashboard'

type TechnicianDashboardPageProps = {
  onLogout: () => void
}

const TechnicianDashboardPage = ({ onLogout }: TechnicianDashboardPageProps) => {
  const [activeSection, setActiveSection] = useState('overview')
  const { stats, queue, rooms, loading, refresh } = useTechnicianDashboard()

  const kpis = useMemo(
    () => [
      { label: 'Today Scans', value: stats.todayScans.toString(), delta: 'Completed today', tone: 'good' as const },
      { label: 'Queue Length', value: stats.queueLength.toString(), delta: `${stats.statCount} STAT priority`, tone: stats.statCount > 0 ? 'warn' as const : 'good' as const },
      { label: 'Equipment Status', value: `${stats.activeRooms}/${stats.totalRooms}`, delta: `${stats.maintenanceCount} in maintenance`, tone: stats.maintenanceCount > 0 ? 'warn' as const : 'good' as const },
      { label: 'Avg Scan Time', value: stats.avgScanTime, delta: 'Within target', tone: 'good' as const },
    ],
    [stats]
  )

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[240px_1fr]">
        <TechnicianSidebar activeId={activeSection} onSelect={setActiveSection} />

        <section className="flex h-full flex-col gap-4 overflow-hidden">
          <header className="shrink-0 rounded-2xl bg-gradient-to-r from-teal-900 to-teal-700 p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-teal-200">Technician Console</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {activeSection === 'queue'
                    ? 'Scan Queue'
                    : activeSection === 'checkin'
                      ? 'Patient Check-In'
                      : activeSection === 'equipment'
                        ? 'Equipment Status'
                        : activeSection === 'qc'
                          ? 'Quality Control'
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
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {activeSection === 'queue' ? (
              <ScanQueuePanel />
            ) : activeSection === 'checkin' ? (
              <PatientCheckInPanel />
            ) : activeSection === 'equipment' ? (
              <EquipmentStatusPanel />
            ) : activeSection === 'qc' ? (
              <QualityControlPanel />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => (
                    <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Next in Queue</h3>
                    <div className="space-y-3">
                      {queue.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-4">No patients in queue</p>
                      ) : (
                        queue.map((item) => (
                          <div key={item._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                            <div>
                              <p className="font-medium text-slate-900">{item.patient.fullName}</p>
                              <p className="text-sm text-slate-500">
                                {item.modality} {item.bodyPart} • {item.room?.name || 'Unassigned'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                                  item.priority === 'STAT'
                                    ? 'bg-red-100 text-red-700'
                                    : item.priority === 'Urgent'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.priority}
                              </span>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(item.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveSection('queue')}
                      className="mt-4 w-full rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                      View Full Queue
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Equipment Overview</h3>
                    <div className="space-y-3">
                      {rooms.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-4">No equipment data available</p>
                      ) : (
                        rooms.slice(0, 5).map((room) => (
                          <div key={room._id} className="rounded-lg border border-slate-100 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-900">{room.name}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  room.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : room.status === 'Maintenance'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {room.status}
                              </span>
                            </div>
                            {room.status === 'Active' && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span>Utilization</span>
                                  <span>{room.utilizationPercent}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                                  <div
                                    className="h-1.5 rounded-full bg-teal-500"
                                    style={{ width: `${room.utilizationPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveSection('equipment')}
                      className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Manage Equipment
                    </button>
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

export default TechnicianDashboardPage
