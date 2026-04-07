import { useEffect, useState } from 'react'
import { studiesService, type Study } from '../services/studies.service'
import { imagingRequestService } from '../services/imagingRequest.service'
import { reportsService } from '../services/reports.service'
import { roomsService } from '../services/rooms.service'

export type WorkflowStats = {
  requested: { count: number; items: string[] }
  scheduled: { count: number; items: string[] }
  inReporting: { count: number; items: string[] }
  completed: { count: number; items: string[] }
}

export type DashboardAlert = {
  title: string
  detail: string
  priority: 'High' | 'Medium'
}

export const useDashboardOverview = () => {
  const [stats, setStats] = useState({
    todayRequests: 0,
    pendingReports: 0,
    avgTurnaround: '0h 0m',
    activePatients: 0,
  })
  const [workflow, setWorkflow] = useState<WorkflowStats>({
    requested: { count: 0, items: [] },
    scheduled: { count: 0, items: [] },
    inReporting: { count: 0, items: [] },
    completed: { count: 0, items: [] },
  })
  const [recentStudies, setRecentStudies] = useState<Study[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const [studiesData, requestsData, reportsData, roomsData] = await Promise.all([
          studiesService.getStudies({ limit: 200 }),
          imagingRequestService.list({ limit: 200 }),
          reportsService.getReports({ limit: 200 }),
          roomsService.getRooms(),
        ])

        const allStudies = studiesData.studies
        const allRequests = requestsData.requests
        const allReports = reportsData.reports
        const allRooms = roomsData.rooms

        // Calculate KPIs
        const requestsToday = allRequests.filter((r) => {
          const createdAt = new Date(r.createdAt)
          return createdAt >= today
        })

        const pendingReports = allReports.filter(
          (r) => r.status === 'Draft' || r.status === 'Preliminary',
        )

        const finalizedReports = allReports.filter((r) => r.finalizedAt && r.createdAt)
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

        // Active patients (those with studies today)
        const activePatientsToday = allStudies.filter((s) => {
          const scheduled = new Date(s.scheduledStartAt)
          return scheduled >= today
        })

        setStats({
          todayRequests: requestsToday.length,
          pendingReports: pendingReports.length,
          avgTurnaround: `${avgHours}h ${avgMinutes}m`,
          activePatients: activePatientsToday.length,
        })

        // Calculate workflow stats
        const requestedStudies = allStudies.filter((s) => s.status === 'Scheduled')
        const scheduledStudies = allStudies.filter((s) => s.status === 'Checked In')
        const inReportingStudies = allStudies.filter(
          (s) => s.status === 'In Progress' || s.status === 'Completed',
        )
        const completedStudies = allStudies.filter((s) => s.status === 'Completed')

        const formatStudyItem = (study: Study) => {
          const time = new Date(study.scheduledStartAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })
          return `${study.modality} ${study.bodyPart || ''} - ${time}`.trim()
        }

        setWorkflow({
          requested: {
            count: requestedStudies.length,
            items: requestedStudies.slice(0, 5).map(formatStudyItem),
          },
          scheduled: {
            count: scheduledStudies.length,
            items: scheduledStudies.slice(0, 5).map((s) => {
              const time = new Date(s.scheduledStartAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
              return `${s.modality} - ${time}`
            }),
          },
          inReporting: {
            count: inReportingStudies.length,
            items: inReportingStudies.slice(0, 5).map((s) => {
              const radiologist = s.room?.name || 'Pending'
              return `${s.modality} ${s.bodyPart || ''} - ${radiologist}`.trim()
            }),
          },
          completed: {
            count: completedStudies.length,
            items: completedStudies.slice(0, 5).map((s) => `${s.modality} - Finalized`),
          },
        })

        // Recent studies (last 10)
        const sortedStudies = [...allStudies].sort(
          (a, b) =>
            new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime(),
        )
        setRecentStudies(sortedStudies.slice(0, 10))

        // Generate alerts based on real data
        const generatedAlerts: DashboardAlert[] = []

        // Check for rooms in maintenance
        const maintenanceRooms = allRooms.filter((r) => r.status === 'Maintenance')
        if (maintenanceRooms.length > 0) {
          generatedAlerts.push({
            title: `${maintenanceRooms.length} room(s) under maintenance`,
            detail: maintenanceRooms.map((r) => r.name).join(', '),
            priority: 'Medium',
          })
        }

        // Check for pending requests
        const pendingRequests = allRequests.filter((r) => r.status === 'Pending')
        if (pendingRequests.length > 5) {
          generatedAlerts.push({
            title: `${pendingRequests.length} imaging requests pending approval`,
            detail: 'Review and approve requests to avoid scheduling delays',
            priority: 'High',
          })
        }

        // Check for STAT priority studies
        const statStudies = allStudies.filter((s) => s.priority === 'STAT' && s.status !== 'Completed')
        if (statStudies.length > 0) {
          generatedAlerts.push({
            title: `${statStudies.length} STAT studies pending completion`,
            detail: statStudies.map((s) => `${s.modality} - ${s.patient.fullName}`).join(', '),
            priority: 'High',
          })
        }

        // Check for studies without assigned rooms
        const unassignedStudies = allStudies.filter(
          (s) => !s.room && s.status === 'Scheduled',
        )
        if (unassignedStudies.length > 3) {
          generatedAlerts.push({
            title: `${unassignedStudies.length} studies without room assignment`,
            detail: 'Assign rooms to scheduled studies to proceed',
            priority: 'Medium',
          })
        }

        setAlerts(generatedAlerts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return { stats, workflow, recentStudies, alerts, loading, error }
}
