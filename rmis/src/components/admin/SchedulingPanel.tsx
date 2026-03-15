import { useState, useEffect, useMemo } from 'react'
import { studiesService, type Study, type StudyStatus } from '../../services/studies.service'
import { roomsService, type ImagingRoom, type RoomStatus } from '../../services/rooms.service'
import { patientService, type Patient } from '../../services/patient.service'
import { userService, type User } from '../../services/user.service'
import type { ImagingRequest } from '../../services/imagingRequest.service'
type SchedulingPanelProps = {
    initialDate?: string
    prefillRequest?: ImagingRequest | null
    onClearPrefill?: () => void
}

const SchedulingPanel = ({ initialDate, prefillRequest, onClearPrefill }: SchedulingPanelProps) => {
    const [selectedDate, setSelectedDate] = useState<string>(
        initialDate || new Date().toISOString().split('T')[0],
    )
    const [studies, setStudies] = useState<Study[]>([])
    const [rooms, setRooms] = useState<ImagingRoom[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [physicians, setPhysicians] = useState<User[]>([])
    const [radiologists, setRadiologists] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newStudy, setNewStudy] = useState({
        patientId: '',
        accessionNumber: '',
        modality: 'CT' as Study['modality'],
        bodyPart: '',
        priority: 'Routine' as Study['priority'],
        clinicalIndication: '',
        referringPhysicianId: '',
        scheduledTime: '',
        roomId: '',
        imagingRequestId: '',
    })

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => room.modality === newStudy.modality)
    }, [rooms, newStudy.modality])

    const selectedRoomDetails = useMemo(() => {
        return rooms.find(r => r._id === newStudy.roomId)
    }, [rooms, newStudy.roomId])

    useEffect(() => {
        if (prefillRequest) {
            setNewStudy({
                patientId: prefillRequest.patient._id,
                accessionNumber: `ACC-${Date.now()}`,
                modality: prefillRequest.modality as Study['modality'],
                bodyPart: prefillRequest.bodyPart || '',
                priority: prefillRequest.priority as Study['priority'],
                clinicalIndication: prefillRequest.clinicalIndication,
                referringPhysicianId: prefillRequest.requestedBy?._id || '',
                scheduledTime: '09:00',
                roomId: '',
                imagingRequestId: prefillRequest._id,
            })
            setIsAddModalOpen(true)
            onClearPrefill?.()
        }
    }, [prefillRequest, onClearPrefill])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const startDate = new Date(selectedDate)
                const endDate = new Date(startDate)
                endDate.setDate(endDate.getDate() + 1)
                
                const [studiesData, roomsData, patientsData, physiciansData, radiologistsData] = await Promise.all([
                    studiesService.getStudies({
                        from: startDate.toISOString(),
                        to: endDate.toISOString(),
                        limit: 100,
                    }),
                    roomsService.getRooms(),
                    patientService.list(),
                    userService.listUsers({ role: 'Physician' }),
                    userService.listUsers({ role: 'Radiologist' }),
                ])
                setStudies(studiesData.studies)
                setRooms(roomsData.rooms)
                setPatients(patientsData.patients)
                setPhysicians(physiciansData)
                setRadiologists(radiologistsData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch scheduling data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selectedDate])

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            const scheduledStartAt = new Date(`${selectedDate}T${newStudy.scheduledTime}`).toISOString()
            await studiesService.createStudy({
                patientId: newStudy.patientId,
                accessionNumber: newStudy.accessionNumber,
                modality: newStudy.modality,
                bodyPart: newStudy.bodyPart || undefined,
                priority: newStudy.priority,
                clinicalIndication: newStudy.clinicalIndication || undefined,
                referringPhysicianId: newStudy.referringPhysicianId || undefined,
                scheduledStartAt,
                roomId: newStudy.roomId || undefined,
                imagingRequestId: newStudy.imagingRequestId || undefined,
            })
            setIsAddModalOpen(false)
            setNewStudy({
                patientId: '',
                accessionNumber: '',
                modality: 'CT',
                bodyPart: '',
                priority: 'Routine',
                clinicalIndication: '',
                referringPhysicianId: '',
                scheduledTime: '',
                roomId: '',
                imagingRequestId: '',
            })
            const startDate = new Date(selectedDate)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + 1)
            const [studiesData] = await Promise.all([
                studiesService.getStudies({
                    from: startDate.toISOString(),
                    to: endDate.toISOString(),
                    limit: 100,
                }),
            ])
            setStudies(studiesData.studies)        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create appointment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStatusChange = async (studyId: string, newStatus: StudyStatus) => {
        try {
            await studiesService.updateStudyStatus(studyId, newStatus)
            await refreshStudies()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update status')
        }
    }

    const handleAssignRadiologist = async (studyId: string, radiologistId: string) => {
        try {
            await studiesService.assignStudy(studyId, radiologistId || null)
            await refreshStudies()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to assign radiologist')
        }
    }

    const refreshStudies = async () => {
        const startDate = new Date(selectedDate)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        const data = await studiesService.getStudies({
            from: startDate.toISOString(),
            to: endDate.toISOString(),
            limit: 100,
        })
        setStudies(data.studies)
    }

    const sortedStudies = useMemo(() => {
        return [...studies].sort((a, b) => {
            const timeA = new Date(a.scheduledStartAt).getTime()
            const timeB = new Date(b.scheduledStartAt).getTime()
            return timeA - timeB
        })
    }, [studies])

    const getStatusColor = (status: StudyStatus) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-100 text-emerald-700'
            case 'In Progress':
                return 'bg-blue-100 text-blue-700'
            case 'Checked In':
                return 'bg-violet-100 text-violet-700'
            case 'Canceled':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-amber-100 text-amber-700'
        }
    }

    const getRoomStatusColor = (status: RoomStatus) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-50 text-emerald-700'
            case 'Idle':
                return 'bg-slate-50 text-slate-700'
            case 'Maintenance':
                return 'bg-orange-50 text-orange-700'
            case 'Offline':
                return 'bg-red-50 text-red-700'
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-slate-500">Loading schedule...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                    <p className="font-semibold">Error loading schedule</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Calendar Section */}
            <div className="w-80 flex-shrink-0 rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Calendar</h3>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-6">
                    <h4 className="mb-2 text-sm font-semibold text-slate-700">Resources</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        {rooms.map((room) => (
                            <li
                                key={room._id}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${getRoomStatusColor(room.status)}`}
                            >
                                <span>{room.name}</span>
                                <span className="text-xs font-bold">{room.status}</span>
                            </li>
                        ))}
                        {rooms.length === 0 && (
                            <li className="text-slate-400">No resources available</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Schedule Grid */}
            <div className="flex-1 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <h2 className="text-xl font-bold text-slate-900">
                        Schedule for{' '}
                        {new Date(selectedDate).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        Add Appointment
                    </button>
                </div>

                <div className="h-full overflow-y-auto p-5">
                    <div className="space-y-3">
                        {sortedStudies.map((study) => (
                            <div
                                key={study._id}
                                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex w-16 flex-col items-center justify-center rounded-lg bg-slate-100 py-2 text-slate-700">
                                    <span className="text-xs font-bold">
                                        {new Date(study.scheduledStartAt).toLocaleTimeString(undefined, {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">
                                                {study.patient.fullName}
                                            </h4>
                                            <p className="text-sm text-slate-500">
                                                {study.modality}
                                                {study.bodyPart ? ` - ${study.bodyPart}` : ''} •{' '}
                                                {study.room?.name || 'Unassigned Room'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={study.status}
                                                onChange={(e) =>
                                                    handleStatusChange(study._id, e.target.value as StudyStatus)
                                                }
                                                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none"
                                            >
                                                <option value="Scheduled">Scheduled</option>
                                                <option value="Checked In">Checked In</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Canceled">Canceled</option>
                                            </select>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(study.status)}`}
                                            >
                                                {study.status}
                                            </span>
                                            {study.status === 'Completed' && (
                                                <select
                                                    value={study.assignedRadiologist?._id || ''}
                                                    onChange={(e) => handleAssignRadiologist(study._id, e.target.value)}
                                                    className={`rounded border px-2 py-1 text-xs focus:outline-none ${
                                                        study.assignedRadiologist
                                                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                    }`}
                                                    title="Assign radiologist"
                                                >
                                                    <option value="">Assign radiologist...</option>
                                                    {radiologists.map((r) => (
                                                        <option key={r.id} value={r.id}>{r.fullName}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sortedStudies.length === 0 && (
                            <div className="flex h-40 items-center justify-center text-slate-400">
                                No appointments scheduled for this day.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Appointment Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-900">Add New Appointment</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleAddAppointment} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Patient *
                                </label>
                                <select
                                    required
                                    value={newStudy.patientId}
                                    onChange={(e) => setNewStudy({ ...newStudy, patientId: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map((patient) => (
                                        <option key={patient._id} value={patient._id}>
                                            {patient.fullName} (MRN: {patient.mrn})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Accession Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudy.accessionNumber}
                                        onChange={(e) =>
                                            setNewStudy({ ...newStudy, accessionNumber: e.target.value })
                                        }
                                        placeholder="ACC-YYYYMMDD-XXX"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Modality *
                                    </label>
                                    <select
                                        required
                                        value={newStudy.modality}
                                        onChange={(e) =>
                                            setNewStudy({ ...newStudy, modality: e.target.value as Study['modality'] })
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="CT">CT</option>
                                        <option value="MRI">MRI</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="Ultrasound">Ultrasound</option>
                                        <option value="Mammography">Mammography</option>
                                        <option value="Fluoroscopy">Fluoroscopy</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Body Part
                                </label>
                                <input
                                    type="text"
                                    value={newStudy.bodyPart}
                                    onChange={(e) => setNewStudy({ ...newStudy, bodyPart: e.target.value })}
                                    placeholder="e.g., Brain, Chest, Knee"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Priority *
                                    </label>
                                    <select
                                        required
                                        value={newStudy.priority}
                                        onChange={(e) =>
                                            setNewStudy({ ...newStudy, priority: e.target.value as Study['priority'] })
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="Routine">Routine</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="STAT">STAT</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Scheduled Time *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={newStudy.scheduledTime}
                                        onChange={(e) =>
                                            setNewStudy({ ...newStudy, scheduledTime: e.target.value })
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Referring Physician (Optional)
                                </label>
                                <select
                                    value={newStudy.referringPhysicianId}
                                    onChange={(e) =>
                                        setNewStudy({ ...newStudy, referringPhysicianId: e.target.value })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Select a physician</option>
                                    {physicians.map((physician) => (
                                        <option key={physician.id} value={physician.id}>
                                            {physician.fullName} ({physician.username})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Clinical Indication
                                </label>
                                <textarea
                                    value={newStudy.clinicalIndication}
                                    onChange={(e) =>
                                        setNewStudy({ ...newStudy, clinicalIndication: e.target.value })
                                    }
                                    rows={3}
                                    placeholder="Describe the clinical reason for this study..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Room (Required) *
                                </label>
                                <select
                                    required
                                    value={newStudy.roomId}
                                    onChange={(e) => setNewStudy({ ...newStudy, roomId: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Select an available {newStudy.modality} room</option>
                                    {filteredRooms.map((room) => (
                                        <option key={room._id} value={room._id}>
                                            {room.name} {room.assignedTechnician ? `(Tech: ${room.assignedTechnician.fullName})` : '(No Tech Assigned)'} - {room.status}
                                        </option>
                                    ))}
                                </select>
                                {selectedRoomDetails && (
                                    <div className={`mt-2 rounded-lg p-2 text-xs flex items-center gap-2 ${selectedRoomDetails.assignedTechnician ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        <div className={`h-2 w-2 rounded-full ${selectedRoomDetails.assignedTechnician ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        {selectedRoomDetails.assignedTechnician 
                                            ? `Assigned: ${selectedRoomDetails.assignedTechnician.fullName} is ready for this scan.`
                                            : `Warning: No technician is currently deployed to this room.`}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 border-t border-slate-200 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Appointment'}
                                </button>
                            </div>
                            </form>
                        </div>

                        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-6">
                            <p className="text-xs text-slate-500">
                                * Required fields. The appointment will be scheduled for the selected date and time.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SchedulingPanel
