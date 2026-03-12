type WorkflowColumn = {
  title: string
  count: number
  items: string[]
  accent: string
}

type WorkflowBoardProps = {
  columns: WorkflowColumn[]
}

const WorkflowBoard = ({ columns }: WorkflowBoardProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Study Workflow Tracker</h2>
        <span className="text-sm text-slate-500">Request to final report</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{column.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${column.accent}`}>
                {column.count}
              </span>
            </div>
            <ul className="space-y-2">
              {column.items.length === 0 ? (
                <li className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
                  No items
                </li>
              ) : (
                column.items.map((item, index) => (
                  <li key={index} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                    {item}
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WorkflowBoard
