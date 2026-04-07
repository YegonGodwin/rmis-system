import { useState, useEffect, useCallback } from 'react'
import { studiesService } from '../services/studies.service'
import type { Study } from '../services/studies.service'
import { reportsService } from '../services/reports.service'
import type { Report } from '../services/reports.service'
import { auth } from '../services/auth'
import type { AuthUser } from '../services/auth'

export const useRadiologistDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [worklist, setWorklist] = useState<Study[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
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
      let user = currentUser
      if (!user) {
        const res = await auth.me()
        user = res.user
        setCurrentUser(user)
      }

      const [worklistRes, reportsTodayRes, pendingReviewRes, criticalRes] = await Promise.all([
        studiesService.getStudies({ status: 'Completed', limit: 200 }),
        reportsService.getReports({ status: 'Final', limit: 50 }),
        reportsService.getReports({ status: 'Draft', limit: 50 }),
        reportsService.getReports({ isCritical: true, limit: 10 }),
      ])

      // Only show studies assigned to this radiologist
      const myStudies = worklistRes.studies.filter(
        (s) => s.assignedRadiologist?._id === user!.id,
      )
      setWorklist(myStudies)
      
      const statPriority = myStudies.filter(s => s.priority === 'STAT').length
      const reportsFinalized = reportsTodayRes.total
      const pendingReview = pendingReviewRes.total
      const criticalFindings = criticalRes.total

      setRecentReports(reportsTodayRes.reports.slice(0, 5))

      setStats(prev => ({
        ...prev,
        pendingStudies: myStudies.length,
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
