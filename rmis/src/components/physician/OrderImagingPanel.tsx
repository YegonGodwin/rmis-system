import { useState, useEffect } from 'react'
import type { Patient } from '../../services/patient.service'
import { patientService } from '../../services/patient.service'
import type { ImagingRequest, Modality, Priority } from '../../services/imagingRequest.service'
import { imagingRequestService } from '../../services/imagingRequest.service'

const OrderImagingPanel = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [orders, setOrders] = useState<ImagingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isQuickRegister, setIsQuickRegister] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const response = await patientService.list({ limit: 100, isActive: true })
        setPatients(response.patients)
      } catch (err) {
        setError('Failed to load patients')
      } finally {
        setLoading(false)
      }
    }

    const fetchOrders = async () => {
      try {
        const response = await imagingRequestService.list({ limit: 10 })
        setOrders(response.requests)
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      }
    }

    fetchPatients()
    fetchOrders()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      setSubmitting(true)
      setError(null)

      let patientId: string

      if (isQuickRegister) {
        // Register new patient first
        const newPatientData = {
          mrn: String(formData.get('mrn')),
          fullName: String(formData.get('fullName')),
          dob: String(formData.get('dob')),
          gender: String(formData.get('gender')) as 'Male' | 'Female' | 'Other',
          contact: {
            phone: String(formData.get('phone')) || undefined,
          },
        }
        const { patient } = await patientService.create(newPatientData)
        patientId = patient._id
        
        // Update local patients list
        setPatients((prev) => [...prev, patient])
      } else {
        patientId = String(formData.get('patientId'))
        if (!patientId) {
          setError('Please select a valid patient')
          setSubmitting(false)
          return
        }
      }

      await imagingRequestService.create({
        patientId,
        modality: String(formData.get('modality')) as Modality,
        bodyPart: String(formData.get('bodyPart')),
        priority: String(formData.get('priority')) as Priority,
        clinicalIndication: String(formData.get('clinicalIndication')),
        specialInstructions: String(formData.get('specialInstructions')) || undefined,
      })

      // Refresh orders list
      const response = await imagingRequestService.list({ limit: 10 })
      setOrders(response.requests)

      setShowSuccess(true)
      setIsQuickRegister(false)
      e.currentTarget.reset()

      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-semibold">Order submitted successfully!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Imaging Order</h2>
            <p className="mt-1 text-sm text-slate-500">Request radiology studies for your patients</p>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickRegister(!isQuickRegister)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isQuickRegister
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {isQuickRegister ? 'Select Existing Patient' : '+ Register New Patient'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isQuickRegister ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-4">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Quick Patient Registration</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Full Name *</label>
                  <input
                    name="fullName"
                    required
                    placeholder="Patient's legal name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">MRN *</label>
                  <input
                    name="mrn"
                    required
                    placeholder="Unique record number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Date of Birth *</label>
                  <input
                    name="dob"
                    type="date"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Gender *</label>
                  <select
                    name="gender"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-600">Phone Number</label>
                  <input
                    name="phone"
                    placeholder="Contact information"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select Patient</label>
              <select
                name="patientId"
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName} (MRN: {patient.mrn})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Modality</label>
              <select
                name="modality"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select modality</option>
                <option value="X-Ray">X-Ray</option>
                <option value="CT">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Mammography">Mammography</option>
                <option value="Fluoroscopy">Fluoroscopy</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Body Part / Region</label>
              <input
                name="bodyPart"
                type="text"
                required
                placeholder="e.g., Chest, Brain, Abdomen"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Priority Level</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Routine', 'Urgent', 'STAT'].map((priority) => (
                <label
                  key={priority}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3 transition hover:bg-slate-50"
                >
                  <input type="radio" name="priority" value={priority} required className="text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Clinical Indication</label>
            <textarea
              name="clinicalIndication"
              required
              rows={4}
              placeholder="Reason for exam, relevant history, and clinical question..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Special Instructions (Optional)</label>
            <textarea
              name="specialInstructions"
              rows={2}
              placeholder="Contrast requirements, patient conditions, etc..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>

      {orders.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{order.patient.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {order.modality} - {order.bodyPart}
                    </p>
                    <p className="text-xs text-slate-400">{order.requestId}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.priority === 'STAT'
                          ? 'bg-red-100 text-red-700'
                          : order.priority === 'Urgent'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.priority}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{order.clinicalIndication}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderImagingPanel
