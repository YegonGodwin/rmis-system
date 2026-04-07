type NavItem = {
  id: string
  label: string
}

type RadiologistSidebarProps = {
  activeId: string
  onSelect: (id: string) => void
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'worklist', label: 'My Worklist' },
  { id: 'reporting', label: 'Create Report' },
  { id: 'reports', label: 'My Reports' },
  { id: 'templates', label: 'Templates' },
]

const RadiologistSidebar = ({ activeId, onSelect }: RadiologistSidebarProps) => {
  return (
    <aside className="h-full rounded-2xl bg-purple-900 p-5 text-purple-100">
      <div className="mb-8 border-b border-purple-700 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Radiologist</p>
        <h1 className="mt-2 text-xl font-bold">RMIS Workstation</h1>
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
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-200 hover:bg-purple-800 hover:text-white'
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

export default RadiologistSidebar
