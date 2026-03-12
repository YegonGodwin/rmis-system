import { useState, useEffect } from 'react'
import { studiesService } from '../../services/studies.service'
import type { Study } from '../../services/studies.service'
import { reportsService } from '../../services/reports.service'
import { reportTemplatesService } from '../../services/reportTemplates.service'
import type { ReportTemplate } from '../../services/reportTemplates.service'

const ReportingPanel = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [studies, setStudies] = useState<Study[]>([])
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastStatus, setLastStatus] = useState('')

  const [formData, setFormData] = useState({
    studyType: '',
    technique: '',
    findings: '',
    impression: '',
    recommendations: '',
    isCritical: false
  })

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchStudies()
      } else {
        setStudies([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const searchStudies = async () => {
    try {
      setLoading(true)
      const res = await studiesService.getStudies({ status: 'Completed', q: searchTerm } as any)
      setStudies(res.studies)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStudy = (study: Study) => {
    setSelectedStudy(study)
    setStudies([])
    setSearchTerm('')
    setFormData({
      ...formData,
      studyType: `${study.modality} ${study.bodyPart}`
    })
    fetchTemplates(study.modality, study.bodyPart)
  }

  const fetchTemplates = async (modality: string, bodyPart?: string) => {
    try {
      const res = await reportTemplatesService.list({ modality, bodyPart })
      setTemplates(res.templates)
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const handleApplyTemplate = (template: ReportTemplate) => {
    setFormData({
      ...formData,
      technique: template.technique || formData.technique,
      findings: template.findings,
      impression: template.impression,
      recommendations: template.recommendations || formData.recommendations
    })
    setShowTemplates(false)
  }

  const handleSubmit = async (status: 'Draft' | 'Preliminary' | 'Final') => {
    if (!selectedStudy) return

    try {
      setSubmitting(true)
      await reportsService.create({
        studyId: selectedStudy._id,
        status,
        ...formData
      })
      setLastStatus(status)
      setShowSuccess(true)
      setSelectedStudy(null)
      setFormData({
        studyType: '',
        technique: '',
        findings: '',
        impression: '',
        recommendations: '',
        isCritical: false
      })
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err: any) {
      console.error('Submission failed:', err)
      alert(err.response?.data?.message || 'Failed to save report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">Report saved successfully as {lastStatus}!</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Create Radiology Report</h2>
          <p className="mt-1 text-sm text-slate-500">Search for a completed study to begin reporting</p>
        </div>

        <div className="relative mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Find Study (Patient Name or Accession)</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search completed studies..."
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && (
              <div className="absolute right-3 top-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {studies.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
              {studies.map((s) => (
                <button
                  key={s._id}
                  onClick={() => handleSelectStudy(s)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{s.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{s.modality} {s.bodyPart} • {s.accessionNumber}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.priority === 'STAT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedStudy && (
          <div className="space-y-6 border-t border-slate-100 pt-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Case</p>
                <p className="text-lg font-bold text-slate-900">{selectedStudy.patient.fullName} • {selectedStudy.accessionNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="rounded-lg border border-purple-600 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition"
              >
                {templates.length > 0 ? `Templates (${templates.length})` : 'No Templates Available'}
              </button>
            </div>

            {showTemplates && templates.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-xl bg-purple-50 p-4 border border-purple-100 animate-in zoom-in-95 duration-200">
                {templates.map(t => (
                  <button
                    key={t._id}
                    onClick={() => handleApplyTemplate(t)}
                    className="rounded-lg bg-white p-3 text-left text-sm hover:shadow-md transition group border border-transparent hover:border-purple-300"
                  >
                    <p className="font-bold text-purple-900">{t.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.impression}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Study Type / Clinical Indication</label>
                <input
                  type="text"
                  value={formData.studyType}
                  onChange={e => setFormData({ ...formData, studyType: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Technique</label>
                <textarea
                  value={formData.technique}
                  onChange={e => setFormData({ ...formData, technique: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Findings</label>
                <textarea
                  value={formData.findings}
                  onChange={e => setFormData({ ...formData, findings: e.target.value })}
                  required
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Impression</label>
                <textarea
                  value={formData.impression}
                  onChange={e => setFormData({ ...formData, impression: e.target.value })}
                  required
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Recommendations</label>
                <textarea
                  value={formData.recommendations}
                  onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className={`rounded-xl border-2 p-4 transition ${formData.isCritical ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCritical}
                    onChange={e => setFormData({ ...formData, isCritical: e.target.checked })}
                    className="h-6 w-6 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className={`font-bold ${formData.isCritical ? 'text-red-900' : 'text-slate-900'}`}>Critical Finding Alert</span>
                    <p className={`text-sm ${formData.isCritical ? 'text-red-700' : 'text-slate-500'}`}>
                      Check this to trigger an immediate critical result notification workflow.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('Draft')}
                  className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('Preliminary')}
                  className="flex-1 rounded-lg bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  Preliminary
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('Final')}
                  className="flex-1 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow-lg shadow-purple-200"
                >
                  {submitting ? 'Finalizing...' : 'Finalize Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedStudy && !searchTerm && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="h-20 w-20 mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Select a study from the worklist or search above</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportingPanel
