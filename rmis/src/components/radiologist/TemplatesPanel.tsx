import { useState, useEffect, useCallback } from 'react'
import { reportTemplatesService } from '../../services/reportTemplates.service'
import type { ReportTemplate } from '../../services/reportTemplates.service'

const TemplatesPanel = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalityFilter, setModalityFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reportTemplatesService.list({ 
        modality: modalityFilter === 'All' ? undefined : modalityFilter,
        q: searchTerm || undefined
      })
      setTemplates(res.templates)
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoading(false)
    }
  }, [modalityFilter, searchTerm])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const modalities = ['All', 'CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography']

  if (loading && templates.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Report Templates</h2>
          <p className="mt-1 text-sm text-slate-500">Manage and use standardized report text</p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500">
          Create New Template
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {modalities.map((m) => (
            <button
              key={m}
              onClick={() => setModalityFilter(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                modalityFilter === m ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            No templates found matching your criteria.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template._id}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">
                  {template.modality}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  {template.bodyPart}
                </span>
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-900 group-hover:text-purple-700">
                {template.name}
              </h3>
              <p className="mb-4 line-clamp-3 flex-1 text-sm text-slate-500 italic">
                {template.impression}
              </p>
              <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                  Edit
                </button>
                <button className="flex-1 rounded-lg bg-purple-50 py-1.5 text-xs font-bold text-purple-600 transition hover:bg-purple-100">
                  Use
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TemplatesPanel
