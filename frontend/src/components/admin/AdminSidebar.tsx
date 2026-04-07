type NavItem = {
  id: string
  label: string
}

type AdminSidebarProps = {
  activeId: string
  onSelect: (id: string) => void
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Imaging Requests' },
  { id: 'schedule', label: 'Scheduling' },
  { id: 'tech-mgmt', label: 'Technician Management' },
  { id: 'room-mgmt', label: 'Room Management' },
  { id: 'reports', label: 'Reports' },
  { id: 'patients', label: 'Patients' },
  { id: 'critical', label: 'Critical Results' },
  { id: 'users', label: 'User Management' },
  { id: 'audit', label: 'Audit Logs' },
]

const AdminSidebar = ({ activeId, onSelect }: AdminSidebarProps) => {
  return (
    <aside className="h-full rounded-2xl bg-slate-900 p-5 text-slate-100">
      <div className="mb-8 border-b border-slate-700 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Radiology</p>
        <h1 className="mt-2 text-xl font-bold">RMIS Admin</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default AdminSidebar
