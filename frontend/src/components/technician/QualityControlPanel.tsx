import { useState, useEffect, useCallback } from 'react'
import { qcLogService } from '../../services/qcLog.service'
import type { QCLog, QCResult } from '../../services/qcLog.service'
import { roomsService } from '../../services/rooms.service'
import type { ImagingRoom } from '../../services/rooms.service'

const QualityControlPanel = () => {
  const [qcTests, setQcTests] = useState<QCLog[]>([])
  const [rooms, setRooms] = useState<ImagingRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTestModal, setShowNewTestModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [qcRes, roomsRes] = await Promise.all([
        qcLogService.list(),
        roomsService.getRooms()
      ])
      setQcTests(qcRes.logs)
      setRooms(roomsRes.rooms)
    } catch (err) {
      console.error('Failed to fetch QC data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmitTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      setSubmitting(true)
      await qcLogService.create({
        roomId: String(formData.get('roomId')),
        testType: String(formData.get('testType')),
        result: String(formData.get('result')) as QCResult,
        notes: String(formData.get('notes')),
      })
      await fetchData()
      setShowNewTestModal(false)
    } catch (err) {
      console.error('Failed to log test:', err)
      alert('Failed to log test results.')
    } finally {
      setSubmitting(false)
    }
  }

  const passCount = qcTests.filter((t) => t.result === 'Pass').length
  const failCount = qcTests.filter((t) => t.result === 'Fail').length
  const warningCount = qcTests.filter((t) => t.result === 'Warning').length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-slate-500">Loading QC logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tests Passed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{passCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Warnings</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{warningCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Failed Tests</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{failCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quality Control</h2>
          <p className="mt-1 text-sm text-slate-500">Equipment testing and quality assurance</p>
        </div>
        <button
          onClick={() => setShowNewTestModal(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
        >
          Log New Test
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Test ID</th>
                <th className="px-6 py-3 font-semibold">Equipment</th>
                <th className="px-6 py-3 font-semibold">Test Type</th>
                <th className="px-6 py-3 font-semibold">Performed By</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Result</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qcTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No QC tests logged yet.
                  </td>
                </tr>
              ) : (
                qcTests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{test.qcLogId}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{test.room.name}</td>
                    <td className="px-6 py-4 text-slate-700">{test.testType}</td>
                    <td className="px-6 py-4 text-slate-600">{test.performedBy.fullName}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(test.performedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          test.result === 'Pass'
                            ? 'bg-emerald-100 text-emerald-700'
                            : test.result === 'Warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {test.result}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-teal-600 hover:text-teal-800 hover:underline text-xs font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewTestModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-slate-900">Log Quality Control Test</h3>
            <form onSubmit={handleSubmitTest} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Equipment</label>
                  <select
                    name="roomId"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Select equipment</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name} ({room.modality})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Test Type</label>
                  <select
                    name="testType"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Select test type</option>
                    <option value="Daily Calibration">Daily Calibration</option>
                    <option value="Image Quality Check">Image Quality Check</option>
                    <option value="Radiation Dose Check">Radiation Dose Check</option>
                    <option value="Safety Inspection">Safety Inspection</option>
                    <option value="Phantom Test">Phantom Test</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Result</label>
                  <select
                    name="result"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Warning">Warning</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  name="notes"
                  required
                  rows={4}
                  placeholder="Detailed findings and observations..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTestModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


export default QualityControlPanel
