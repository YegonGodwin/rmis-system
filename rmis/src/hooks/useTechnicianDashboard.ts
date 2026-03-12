import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../services/studies.service'
import type { Study } from '../services/studies.service'
import { roomsService } from '../services/rooms.service'
import type { ImagingRoom } from '../services/rooms.service'
import { qcLogService } from '../services/qcLog.service'
import type { QCLog } from '../services/qcLog.service'

export const useTechnicianDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<Study[]>([])
  const [rooms, setRooms] = useState<ImagingRoom[]>([])
  const [recentQC, setRecentQC] = useState<QCLog[]>([])
  const [stats, setStats] = useState({
    todayScans: 0,
    queueLength: 0,
    statCount: 0,
    activeRooms: 0,
    totalRooms: 0,
    maintenanceCount: 0,
    avgScanTime: '18m', // Mock for now as backend might not support this calculation easily
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [queueRes, roomsRes, qcRes, allTodayStudies] = await Promise.all([
        studiesService.getTechnicianQueue({ limit: 5 }),
        roomsService.getRooms(),
        qcLogService.list({ limit: 5 }),
        studiesService.getStudies({ from: new Date().toISOString().split('T')[0], limit: 100 })
      ])

      setQueue(queueRes.studies)
      setRooms(roomsRes.rooms)
      setRecentQC(qcRes.logs)

      const activeRooms = roomsRes.rooms.filter(r => r.status === 'Active').length
      const maintenanceCount = roomsRes.rooms.filter(r => r.status === 'Maintenance').length
      const statCount = queueRes.studies.filter(s => s.priority === 'STAT').length
      const todayScans = allTodayStudies.studies.filter(s => s.status === 'Completed').length

      setStats(prev => ({
        ...prev,
        todayScans,
        queueLength: queueRes.studies.length,
        statCount,
        activeRooms,
        totalRooms: roomsRes.rooms.length,
        maintenanceCount,
      }))

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    error,
    queue,
    rooms,
    recentQC,
    stats,
    refresh: fetchData,
  }
}
