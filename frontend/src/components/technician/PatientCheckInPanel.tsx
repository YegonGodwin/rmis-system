import { useState, useEffect } from 'react'
import { patientService } from '../../services/patient.service'
import type { Patient } from '../../services/patient.service'
import { studiesService } from '../../services/studies.service'
import type { Study } from '../../services/studies.service'

const PatientCheckInPanel = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientStudies, setPatientStudies] = useState<Study[]>([])
  const [selectedStudyId, setSelectedStudyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [identityMethod, setIdentityMethod] = useState('Government ID')
  const [safetyNotes, setSafetyNotes] = useState('')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchPatients()
      } else {
        setPatients([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const searchPatients = async () => {
    try {
      setLoading(true)
      const res = await patientService.list({ q: searchTerm })
      setPatients(res.patients)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setPatients([])
    setSearchTerm('')
    
    try {
      setLoading(true)
      const res = await studiesService.getStudies({ patientId: patient._id, status: 'Scheduled' })
      setPatientStudies(res.studies)
      if (res.studies.length > 0) {
        setSelectedStudyId(res.studies[0]._id)
      }
    } catch (err) {
      console.error('Failed to fetch studies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedStudyId) return
    const formData = new FormData(e.currentTarget)
    const safetyScreeningCompleted = Boolean(formData.get('safetyScreeningCompleted'))
    const consentSigned = Boolean(formData.get('consentSigned'))

    try {
      setCheckingIn(true)
      await studiesService.updateStudyStatus(selectedStudyId, 'Checked In', {
        identityMethod,
        consentSigned,
        safetyScreeningCompleted,
        safetyScreeningNotes: safetyNotes.trim() || undefined,
      })
      setShowSuccess(true)
      setSelectedPatient(null)
      setPatientStudies([])
      setSelectedStudyId('')
      setSafetyNotes('')
      
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error('Check-in failed:', err)
      alert('Failed to complete check-in.')
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-semibold">Patient checked in successfully!</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Patient Check-In</h2>
          <p className="mt-1 text-sm text-slate-500">Search for scheduled patients and verify arrival</p>
        </div>

        <div className="relative mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Find Patient (Name or MRN)</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Start typing to search..."
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && (
              <div className="absolute right-3 top-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {patients.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
              {patients.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                >
                  <p className="font-semibold text-slate-900">{p.fullName}</p>
                  <p className="text-xs text-slate-500">MRN: {p.mrn} • DOB: {new Date(p.dob).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <form onSubmit={handleSubmit} className="space-y-6 border-t border-slate-100 pt-6 animate-in fade-in duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Patient</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedPatient.fullName}</p>
                <p className="text-sm text-slate-600">MRN: {selectedPatient.mrn}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Scheduled Study</label>
                {patientStudies.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    No scheduled studies found for today.
                  </div>
                ) : (
                  <select
                    value={selectedStudyId}
                    onChange={(e) => setSelectedStudyId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  >
                    {patientStudies.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.modality} {s.bodyPart} - {new Date(s.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="rounded-lg border-2 border-teal-200 bg-teal-50 p-4">
              <p className="mb-3 font-semibold text-teal-900">Pre-Scan Verification</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Identity Verification Method</label>
                  <select
                    value={identityMethod}
                    onChange={(e) => setIdentityMethod(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="Government ID">Government ID</option>
                    <option value="Insurance Card">Insurance Card</option>
                    <option value="Facility Bracelet">Facility Bracelet</option>
                    <option value="Biometric">Biometric</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="safetyScreeningCompleted"
                    required
                    className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">
                    Safety screening questionnaire completed (metal implants, allergies, pregnancy)
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="consentSigned"
                    required
                    className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Informed consent form signed and documented</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Safety Notes (Optional)</label>
                  <textarea
                    value={safetyNotes}
                    onChange={(e) => setSafetyNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergy notes, implants, pregnancy screening, special precautions..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checkingIn || !selectedStudyId}
                className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
              >
                {checkingIn ? 'Processing...' : 'Complete Check-In'}
              </button>
            </div>
          </form>
        )}

        {!selectedPatient && !searchTerm && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p>Search for a patient to begin check-in</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientCheckInPanel
