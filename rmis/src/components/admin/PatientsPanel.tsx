import { useState, useEffect, useCallback } from 'react'
import { patientService, type Patient } from '../../services/patient.service'
import PatientTimelineModal from '../PatientTimelineModal'

const PatientsPanel = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [patients, setPatients] = useState<Patient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [newPatient, setNewPatient] = useState({
        mrn: '',
        fullName: '',
        dob: '',
        gender: 'Male' as const,
        contact: {
            phone: '',
            email: '',
            address: ''
        }
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchPatients = useCallback(async (query: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await patientService.list({ q: query })
            setPatients(response.patients)
        } catch (err) {
            console.error('Failed to fetch patients:', err)
            setError('Failed to load patients. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPatients(searchTerm)
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchTerm, fetchPatients])

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await patientService.create(newPatient)
            setIsAddModalOpen(false)
            setNewPatient({
                mrn: '',
                fullName: '',
                dob: '',
                gender: 'Male',
                contact: { phone: '', email: '', address: '' }
            })
            fetchPatients(searchTerm)
        } catch (err: any) {
            alert(err.message || 'Failed to add patient')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-slate-900">Patient Directory</h2>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search name or MRN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none sm:w-64"
                        />
                        {isLoading && searchTerm && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                    >
                        Add New Patient
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                    <p className="font-medium">{error}</p>
                    <button 
                        onClick={() => fetchPatients(searchTerm)}
                        className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4 hover:text-red-800"
                    >
                        Try Again
                    </button>
                </div>
            ) : isLoading && patients.length === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex justify-between">
                                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                                <div className="h-5 w-20 rounded bg-slate-100"></div>
                            </div>
                            <div className="h-5 w-3/4 rounded bg-slate-200"></div>
                            <div className="mt-2 h-4 w-1/2 rounded bg-slate-100"></div>
                            <div className="mt-6 space-y-2">
                                <div className="h-3 w-full rounded bg-slate-50"></div>
                                <div className="h-3 w-2/3 rounded bg-slate-50"></div>
                            </div>
                            <div className="mt-6 h-9 w-full rounded-lg bg-slate-100"></div>
                        </div>
                    ))}
                </div>
            ) : patients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No patients found</h3>
                    <p className="mt-1 text-slate-500">
                        {searchTerm ? `No results match "${searchTerm}"` : "Get started by adding your first patient."}
                    </p>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-500"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {patients.map((patient) => (
                        <div
                            key={patient._id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                                    {patient.fullName.charAt(0)}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-500">
                                        {patient.mrn}
                                    </span>
                                    {!patient.isActive && (
                                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1" title={patient.fullName}>
                                    {patient.fullName}
                                </h3>
                                <div className="mt-1 text-sm text-slate-500">
                                    {patient.gender}, Born {new Date(patient.dob).getFullYear()}
                                </div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <span className="text-xs font-semibold uppercase text-slate-400 min-w-[60px]">Contact</span>
                                        <span className="truncate">{patient.contact?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <span className="text-xs font-semibold uppercase text-slate-400 min-w-[60px]">Last Visit</span>
                                        <span>{patient.lastVisitAt ? new Date(patient.lastVisitAt).toLocaleDateString() : 'New Patient'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-slate-100 pt-4">
                                <button 
                                    onClick={() => setSelectedPatientId(patient._id)}
                                    className="w-full rounded-lg bg-slate-50 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                                >
                                    View History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPatientId && (
                <PatientTimelineModal 
                    patientId={selectedPatientId} 
                    onClose={() => setSelectedPatientId(null)} 
                />
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl overflow-hidden">
                        <div className="mb-6 flex items-center justify-between border-b pb-4">
                            <h3 className="text-lg font-bold text-slate-900">Add New Patient</h3>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddPatient} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">MRN</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newPatient.mrn}
                                        onChange={(e) => setNewPatient({ ...newPatient, mrn: e.target.value.toUpperCase() })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="MRN-1234"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">Gender</label>
                                    <select 
                                        value={newPatient.gender}
                                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newPatient.fullName}
                                    onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Date of Birth</label>
                                <input 
                                    type="date" 
                                    required
                                    value={newPatient.dob}
                                    onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Phone Number</label>
                                <input 
                                    type="tel" 
                                    value={newPatient.contact.phone}
                                    onChange={(e) => setNewPatient({ ...newPatient, contact: { ...newPatient.contact, phone: e.target.value } })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="+254 7XX XXX XXX"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                                <input 
                                    type="email" 
                                    value={newPatient.contact.email}
                                    onChange={(e) => setNewPatient({ ...newPatient, contact: { ...newPatient.contact, email: e.target.value } })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="jane@example.com"
                                />
                            </div>

                            <div className="pt-4 border-t flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Create Patient'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientsPanel
