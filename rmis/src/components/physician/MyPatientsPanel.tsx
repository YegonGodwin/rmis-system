import { useState, useEffect } from 'react'
import type { Patient } from '../../services/patient.service'
import { patientService } from '../../services/patient.service'
import { imagingRequestService } from '../../services/imagingRequest.service'
import { reportsService } from '../../services/reports.service'

export type PhysicianPatient = Patient & {
  pendingStudies: number
  completedStudies: number
}

const MyPatientsPanel = () => {
  const [patients, setPatients] = useState<PhysicianPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PhysicianPatient | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await patientService.list({ limit: 100, isActive: true })
        
        const patientsWithStudies = await Promise.all(
          response.patients.map(async (patient) => {
            const [pendingResponse, reportsResponse] = await Promise.all([
              imagingRequestService.list({ patientId: patient._id, status: 'Pending', limit: 100 }),
              reportsService.getReports({ patientId: patient._id, limit: 100 }),
            ])
            
            return {
              ...patient,
              pendingStudies: pendingResponse.requests.length,
              completedStudies: reportsResponse.reports.length,
            }
          })
        )
        
        setPatients(patientsWithStudies)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Patients</h2>
          <p className="mt-1 text-sm text-slate-500">Patients under your care with imaging orders</p>
        </div>
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Error loading patients</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filteredPatients.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-lg font-medium">No patients found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPatients.map((patient) => {
          const age = new Date().getFullYear() - new Date(patient.dob).getFullYear()
          return (
            <div
              key={patient._id}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {patient.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">{patient.fullName}</h3>
                    <p className="text-sm text-slate-500">
                      {age}y, {patient.gender} • MRN: {patient.mrn}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {patient.lastVisitAt ? new Date(patient.lastVisitAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex-1 rounded-lg bg-amber-50 p-2 text-center">
                  <p className="font-bold text-amber-700">{patient.pendingStudies}</p>
                  <p className="text-xs text-amber-600">Pending</p>
                </div>
                <div className="flex-1 rounded-lg bg-emerald-50 p-2 text-center">
                  <p className="font-bold text-emerald-700">{patient.completedStudies}</p>
                  <p className="text-xs text-emerald-600">Completed</p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
                View Details
              </button>
            </div>
          )
        })}
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedPatient(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedPatient.fullName}</h3>
                <p className="text-slate-500">
                  {new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()}y, {selectedPatient.gender} • MRN: {selectedPatient.mrn}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {selectedPatient.contact && (selectedPatient.contact.phone || selectedPatient.contact.email) && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Contact Information</p>
                  {selectedPatient.contact.phone && (
                    <p className="mt-1 text-sm text-slate-900">Phone: {selectedPatient.contact.phone}</p>
                  )}
                  {selectedPatient.contact.email && (
                    <p className="text-sm text-slate-900">Email: {selectedPatient.contact.email}</p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Last Visit</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {selectedPatient.lastVisitAt ? new Date(selectedPatient.lastVisitAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Total Studies</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {selectedPatient.pendingStudies + selectedPatient.completedStudies}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                  Order New Study
                </button>
                <button className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPatientsPanel
