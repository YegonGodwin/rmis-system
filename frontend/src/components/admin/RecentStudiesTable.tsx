import { type Study } from '../../services/studies.service'

type RecentStudiesTableProps = {
  studies: Study[]
}

const statusClass: Record<Study['status'], string> = {
  Scheduled: 'bg-amber-50 text-amber-700',
  'Checked In': 'bg-sky-50 text-sky-700',
  'In Progress': 'bg-violet-50 text-violet-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Canceled: 'bg-red-50 text-red-700',
}

const RecentStudiesTable = ({ studies }: RecentStudiesTableProps) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent Imaging Studies</h2>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="rounded-l-lg px-3 py-2 font-semibold">Study ID</th>
              <th className="px-3 py-2 font-semibold">Patient</th>
              <th className="px-3 py-2 font-semibold">Modality</th>
              <th className="px-3 py-2 font-semibold">Priority</th>
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="rounded-r-lg px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No recent studies found
                </td>
              </tr>
            ) : (
              studies.map((study) => (
                <tr key={study._id} className="text-slate-700">
                  <td className="px-3 py-3 font-medium">{study.studyId}</td>
                  <td className="px-3 py-3">{study.patient.fullName}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{study.modality}</div>
                    {study.bodyPart && <div className="text-xs text-slate-500">{study.bodyPart}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        study.priority === 'STAT'
                          ? 'bg-red-50 text-red-700'
                          : study.priority === 'Urgent'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {study.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatTime(study.scheduledStartAt)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[study.status]}`}>
                      {study.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default RecentStudiesTable
