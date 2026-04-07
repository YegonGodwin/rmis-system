type Alert = {
  title: string
  detail: string
  priority: 'High' | 'Medium'
}

type AlertsPanelProps = {
  alerts: Alert[]
}

const priorityClass: Record<Alert['priority'], string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
}

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Operational Alerts</h2>
      <ul className="space-y-3">
        {alerts.map((alert) => (
          <li key={alert.title} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass[alert.priority]}`}>
                {alert.priority}
              </span>
            </div>
            <p className="text-xs text-slate-600">{alert.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AlertsPanel
