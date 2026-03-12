import { useState, useEffect } from 'react'
import type { Report } from '../../services/reports.service'
import { reportsService } from '../../services/reports.service'

export type ImagingResult = Report

const ResultsPanel = () => {
  const [results, setResults] = useState<ImagingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<ImagingResult | null>(null)
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Recent'>('All')

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await reportsService.getReports({ limit: 100 })
        setResults(response.reports)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch imaging results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  const filteredResults = results.filter((result) => {
    if (filter === 'Critical') return result.isCritical
    if (filter === 'Recent') {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      return new Date(result.createdAt) >= twoDaysAgo
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Imaging Results & Reports</h2>
          <p className="mt-1 text-sm text-slate-500">View radiology reports for your patients</p>
        </div>
        <div className="flex gap-2">
          {(['All', 'Critical', 'Recent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Error loading results</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filteredResults.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-lg font-medium">No imaging results found</p>
          <p className="text-sm">Try adjusting your filter</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredResults.map((result) => (
          <div
            key={result._id}
            className={`cursor-pointer rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${
              result.isCritical ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
            }`}
            onClick={() => setSelectedResult(result)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {result.isCritical && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 ring-2 ring-red-600/20">
                      CRITICAL
                    </span>
                  )}
                  <span className="font-mono text-xs font-medium text-slate-500">{result.reportId}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      result.status === 'Final'
                        ? 'bg-emerald-100 text-emerald-700'
                        : result.status === 'Preliminary'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{result.patient.fullName}</h3>
                    <p className="text-sm text-slate-500">MRN: {result.patient.mrn}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-slate-700">Study:</span> {result.studyType}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-slate-700">Date:</span>{' '}
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-slate-700">Radiologist:</span> {result.radiologist.fullName}
                    </p>
                    <div className="mt-2 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Impression</p>
                      <p className="mt-1 text-sm text-slate-900">{result.impression}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                View Full Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedResult(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">Radiology Report</h3>
                  {selectedResult.isCritical && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">CRITICAL</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">Report ID: {selectedResult.reportId}</p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Patient</p>
                  <p className="mt-1 text-slate-900">{selectedResult.patient.fullName}</p>
                  <p className="text-sm text-slate-500">MRN: {selectedResult.patient.mrn}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Study Date</p>
                  <p className="mt-1 text-slate-900">{new Date(selectedResult.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">Study Type</p>
                <p className="mt-1 text-slate-900">{selectedResult.studyType}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">Radiologist</p>
                <p className="mt-1 text-slate-900">{selectedResult.radiologist.fullName}</p>
              </div>

              {selectedResult.technique && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">TECHNIQUE</p>
                  <p className="mt-2 text-slate-700">{selectedResult.technique}</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">FINDINGS</p>
                <p className="mt-2 text-slate-700">{selectedResult.findings}</p>
              </div>

              <div className={`rounded-lg p-4 ${selectedResult.isCritical ? 'bg-red-50' : 'bg-blue-50'}`}>
                <p className="font-semibold text-slate-900">IMPRESSION</p>
                <p className="mt-2 text-slate-900">{selectedResult.impression}</p>
              </div>

              {selectedResult.recommendations && (
                <div className="rounded-lg bg-amber-50 p-4">
                  <p className="font-semibold text-slate-900">RECOMMENDATIONS</p>
                  <p className="mt-2 text-slate-900">{selectedResult.recommendations}</p>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                  Download PDF
                </button>
                <button className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Print Report
                </button>
                <button className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Share with Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPanel
