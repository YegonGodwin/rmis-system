import { useEffect, useState } from 'react'
import { reportsService } from '../services/reports.service'

export const useReportsStats = () => {
  const [stats, setStats] = useState({
    reportsToday: 0,
    pendingReports: 0,
    avgTurnaround: '0h 0m',
    loading: true,
    error: null as string | null,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportsService.getReports({ limit: 200, page: 1 })

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const reportsToday = data.reports.filter((r) => {
          const createdAt = new Date(r.createdAt)
          return createdAt >= today
        })

        const pendingReports = data.reports.filter(
          (r) => r.status === 'Draft' || r.status === 'Preliminary',
        )

        const finalizedReports = data.reports.filter((r) => r.finalizedAt && r.createdAt)
        let totalTurnaroundMs = 0
        finalizedReports.forEach((r) => {
          const created = new Date(r.createdAt).getTime()
          const finalized = new Date(r.finalizedAt!).getTime()
          totalTurnaroundMs += finalized - created
        })
        const avgTurnaroundMs =
          finalizedReports.length > 0 ? totalTurnaroundMs / finalizedReports.length : 0
        const avgHours = Math.floor(avgTurnaroundMs / (1000 * 60 * 60))
        const avgMinutes = Math.floor((avgTurnaroundMs % (1000 * 60 * 60)) / (1000 * 60))

        setStats({
          reportsToday: reportsToday.length,
          pendingReports: pendingReports.length,
          avgTurnaround: `${avgHours}h ${avgMinutes}m`,
          loading: false,
          error: null,
        })
      } catch (err) {
        setStats({
          reportsToday: 0,
          pendingReports: 0,
          avgTurnaround: 'N/A',
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch reports',
        })
      }
    }

    fetchStats()
  }, [])

  return stats
}
