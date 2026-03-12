import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../services/studies.service'
import type { Study } from '../services/studies.service'
import { reportsService } from '../services/reports.service'
import type { Report } from '../services/reports.service'

export const useRadiologistDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [worklist, setWorklist] = useState<Study[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [stats, setStats] = useState({
    pendingStudies: 0,
    statPriority: 0,
    reportsToday: 0,
    reportsFinalized: 0,
    pendingReview: 0,
    criticalFindings: 0,
    avgReadTime: '12m', // Mock for now
    productivity: '96%', // Mock for now
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [worklistRes, reportsTodayRes, pendingReviewRes, criticalRes] = await Promise.all([
        studiesService.getStudies({ status: 'Completed', limit: 10 }), // Completed studies need reporting
        reportsService.getReports({ status: 'Final', limit: 50 }), // Reports finalized
        reportsService.getReports({ status: 'Draft', limit: 50 }), // Pending review/drafts
        reportsService.getReports({ isCritical: true, limit: 10 }) // Critical findings
      ])

      setWorklist(worklistRes.studies)
      
      const statPriority = worklistRes.studies.filter(s => s.priority === 'STAT').length
      const reportsFinalized = reportsTodayRes.total
      const pendingReview = pendingReviewRes.total
      const criticalFindings = criticalRes.total

      setRecentReports(reportsTodayRes.reports.slice(0, 5))

      setStats(prev => ({
        ...prev,
        pendingStudies: worklistRes.total,
        statPriority,
        reportsToday: reportsFinalized,
        reportsFinalized,
        pendingReview,
        criticalFindings,
      }))

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch radiologist dashboard data')
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
    worklist,
    recentReports,
    stats,
    refresh: fetchData,
  }
}
