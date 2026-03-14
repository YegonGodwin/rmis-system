import { useMemo, useState, useEffect } from 'react'
import PhysicianSidebar from '../components/physician/PhysicianSidebar'
import MyPatientsPanel from '../components/physician/MyPatientsPanel'
import MyOrdersPanel from '../components/physician/MyOrdersPanel'
import OrderImagingPanel from '../components/physician/OrderImagingPanel'
import ResultsPanel from '../components/physician/ResultsPanel'
import CriticalAlertsPanel from '../components/physician/CriticalAlertsPanel'
import StatCard from '../components/admin/StatCard'
import { patientService } from '../services/patient.service'
import { imagingRequestService } from '../services/imagingRequest.service'
import { reportsService } from '../services/reports.service'
import { criticalResultService } from '../services/criticalResult.service'

type PhysicianDashboardPageProps = {
  onLogout: () => void
}

type KPIs = {
  myPatients: number
  pendingResults: number
  criticalAlerts: number
  ordersToday: number
  awaitingApproval: number
  avgReportTime: string
}

const PhysicianDashboardPage = ({ onLogout }: PhysicianDashboardPageProps) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [kpis, setKpis] = useState<KPIs>({
    myPatients: 0,
    pendingResults: 0,
    criticalAlerts: 0,
    ordersToday: 0,
    awaitingApproval: 0,
    avgReportTime: '-',
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [patientsRes, requestsRes, reportsRes, alertsRes] = await Promise.all([
          patientService.list({ limit: 1, isActive: true }),
          imagingRequestService.list({ limit: 100 }),
          reportsService.getReports({ limit: 100 }),
          criticalResultService.list({ limit: 100 }),
        ])

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const ordersToday = requestsRes.requests.filter(
          (req) => new Date(req.createdAt) >= today
        ).length

        const pendingRequests = requestsRes.requests.filter((req) => req.status === 'Pending')

        setKpis({
          myPatients: patientsRes.total,
          pendingResults: reportsRes.reports.filter((r) => r.status !== 'Final').length,
          criticalAlerts: alertsRes.results.filter((a) => a.status === 'Pending').length,
          ordersToday,
          awaitingApproval: pendingRequests.length,
          avgReportTime: '3.2h', // This would need backend calculation
        })

        setRecentOrders(requestsRes.requests.slice(0, 5))
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const kpiCards = useMemo(
    () => [
      { label: 'My Patients', value: String(kpis.myPatients), delta: 'Active patients', tone: 'neutral' as const },
      { label: 'Pending Results', value: String(kpis.pendingResults), delta: `${kpis.criticalAlerts} critical alerts`, tone: kpis.criticalAlerts > 0 ? 'warn' as const : 'neutral' as const },
      { label: 'Orders Today', value: String(kpis.ordersToday), delta: `${kpis.awaitingApproval} awaiting approval`, tone: 'neutral' as const },
      { label: 'Avg Report Time', value: kpis.avgReportTime, delta: 'Within target', tone: 'good' as const },
    ],
    [kpis]
  )

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[240px_1fr]">
        <PhysicianSidebar activeId={activeSection} onSelect={setActiveSection} />

        <section className="flex h-full flex-col gap-4 overflow-hidden">
          <header className="shrink-0 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-blue-200">Physician Portal</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {activeSection === 'patients'
                    ? 'My Patients'
                    : activeSection === 'orders'
                      ? 'My Orders'
                    : activeSection === 'order'
                      ? 'Order Imaging'
                      : activeSection === 'results'
                        ? 'Imaging Results'
                        : activeSection === 'alerts'
                          ? 'Critical Alerts'
                          : 'Dashboard'}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25"
                  onClick={() => setActiveSection('order')}
                >
                  Quick Order
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {activeSection === 'patients' ? (
              <MyPatientsPanel />
            ) : activeSection === 'orders' ? (
              <MyOrdersPanel />
            ) : activeSection === 'order' ? (
              <OrderImagingPanel />
            ) : activeSection === 'results' ? (
              <ResultsPanel />
            ) : activeSection === 'alerts' ? (
              <CriticalAlertsPanel />
            ) : (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {kpiCards.map((kpi) => (
                        <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
                      ))}
                    </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Orders</h3>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">No recent orders</p>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                            <div>
                              <p className="font-medium text-slate-900">{order.patient.fullName}</p>
                              <p className="text-sm text-slate-500">{order.modality} - {order.bodyPart}</p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                  order.status === 'Approved' || order.status === 'Scheduled'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : order.status === 'Pending'
                                      ? 'bg-blue-100 text-blue-700'
                                      : order.status === 'Rejected'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {order.status}
                              </span>
                              <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <CriticalAlertsPanel compact />
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

export default PhysicianDashboardPage
