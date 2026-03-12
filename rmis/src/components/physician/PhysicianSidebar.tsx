type NavItem = {
  id: string
  label: string
}

type PhysicianSidebarProps = {
  activeId: string
  onSelect: (id: string) => void
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'patients', label: 'My Patients' },
  { id: 'order', label: 'Order Imaging' },
  { id: 'results', label: 'Results & Reports' },
  { id: 'alerts', label: 'Critical Alerts' },
]

const PhysicianSidebar = ({ activeId, onSelect }: PhysicianSidebarProps) => {
  return (
    <aside className="h-full rounded-2xl bg-blue-900 p-5 text-blue-100">
      <div className="mb-8 border-b border-blue-700 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Physician</p>
        <h1 className="mt-2 text-xl font-bold">RMIS Portal</h1>
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
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
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

export default PhysicianSidebar
