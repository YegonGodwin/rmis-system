type NavItem = {
  id: string
  label: string
}

type TechnicianSidebarProps = {
  activeId: string
  onSelect: (id: string) => void
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'queue', label: 'Scan Queue' },
  { id: 'checkin', label: 'Patient Check-In' },
  { id: 'equipment', label: 'Equipment Status' },
  { id: 'qc', label: 'Quality Control' },
]

const TechnicianSidebar = ({ activeId, onSelect }: TechnicianSidebarProps) => {
  return (
    <aside className="h-full rounded-2xl bg-teal-900 p-5 text-teal-100">
      <div className="mb-8 border-b border-teal-700 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Technician</p>
        <h1 className="mt-2 text-xl font-bold">RMIS Console</h1>
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
                  ? 'bg-teal-600 text-white'
                  : 'text-teal-200 hover:bg-teal-800 hover:text-white'
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

export default TechnicianSidebar
