import { useState, useEffect, useCallback, useRef } from 'react'
import axiosInstance from 'axiosInstance'
import moment from 'moment'
import { HandleError } from 'app/utils/handleError'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'

export const useDashboardData = (tabIndex) => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [reminderData, setReminderData] = useState([])
  const [taskData, setTaskData] = useState([])
  const [announcementData, setAnnouncementData] = useState([])
  const [activityData, setActivityData] = useState([])
  const [updates, setUpdates] = useState([])
  const [users, setUsers] = useState([])

  // Track which tabs have been loaded to avoid refetching
  const loadedTabsRef = useRef(new Set())
  // Track if initial load has happened
  const initialLoadRef = useRef(false)
  // Track if users have been loaded
  const usersLoadedRef = useRef(false)

  const fetchAllUser = useCallback(async () => {
    // Don't refetch if already loaded
    if (usersLoadedRef.current) return

    try {
      const response = await axiosInstance.get('/api/users/lookUps')
      const data = response.data.users || []
      if (response.data?.users) {
        setUsers(data)
        usersLoadedRef.current = true
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }, [showSnackbar, navigate])

  const fetchReminders = useCallback(async () => {
    if (loadedTabsRef.current.has('reminders')) return

    setLoading(true)
    try {
      const response = await axiosInstance.get('/api/leads/reminders')
      const reminders =
        response.data.reminders?.flatMap((lead) =>
          lead?.reminders?.map((reminder) => {
            const dueDate = new Date(reminder.dueDate)
            const now = new Date()
            const isOverdue = dueDate < now

            return {
              leadId: lead._id,
              reminderId: reminder._id,
              dueDate: moment(reminder.dueDate).format('DD-MM-YYYY') || 'N/A',
              createdAt:
                new Date(reminder.createdAt).toLocaleTimeString() || 'N/A',
              message: reminder.message || 'N/A',
              customerName: reminder.customerName || 'N / A',
              addedBy: reminder.addedBy || 'N / A',
              isReadTrue: reminder.isReadTrue || false,
              isOverdue: isOverdue,
              originalDueDate: reminder.dueDate
            }
          })
        ) || []

      // Sort reminders: overdue first, then by due date
      const sortedReminders = reminders.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1
        if (!a.isOverdue && b.isOverdue) return 1
        const dateA = new Date(a.originalDueDate)
        const dateB = new Date(b.originalDueDate)
        return dateA - dateB
      })

      setReminderData(sortedReminders)
      loadedTabsRef.current.add('reminders')
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/api/tasks', {
        params: { rowPerPage: 5 }
      })

      const tasks =
        response.data.tasks
          ?.map((task) => ({
            id: task._id,
            taskName: task.name,
            startDate: moment(task.startDate).format('DD-MM-YYYY'),
            dueDate: moment(task.dueDate).format('DD-MM-YYYY'),
            assignTo:
              task.assignedTo?.length > 0
                ? task.assignedTo.map((user) => user?.name).join(', ')
                : 'N/A',
            priority: task.priority,
            status: task.status
          }))
          .filter((task) => task.status !== 'Completed') || []

      setTaskData(tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUpdates = useCallback(async (force = false) => {
    if (!force && loadedTabsRef.current.has('updates')) return

    setLoading(true)
    try {
      const response = await axiosInstance.get('/api/updates')
      const updates =
        response.data?.updates?.map((item) => ({
          _id: item._id,
          message: item.message,
          updatedBy: item.updatedBy?.name,
          createdAt: moment(item.updatedAt)
            .local()
            .format('DD MMM, YYYY (hh:mm A)')
        })) || []

      setUpdates(updates)
      loadedTabsRef.current.add('updates')
    } catch (error) {
      console.error('Error fetching updates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    if (loadedTabsRef.current.has('announcements')) return

    setLoading(true)
    try {
      const response = await axiosInstance.get('/api/announcements')
      const announcements =
        response.data.announcements?.map((item) => ({
          title: item.title,
          startDate: moment(item.startDate).format('DD-MM-YYYY'),
          endDate: moment(item.endDate).format('DD-MM-YYYY'),
          addedBy: item.user?.name || 'N / A'
        })) || []

      setAnnouncementData(announcements)
      loadedTabsRef.current.add('announcements')
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    if (loadedTabsRef.current.has('activities')) return

    try {
      const response = await axiosInstance.get('/api/leads/activities')
      const formattedActivities =
        response.data.activities?.map((item) => ({
          customerName: item.customerName,
          description: item.activity.description,
          startDate: moment(item.activity.createdAt).format(
            'DD-MM-YYYY (h:mm A)'
          ),
          user: item.activity.user || 'N / A'
        })) || []

      setActivityData(formattedActivities)
      loadedTabsRef.current.add('activities')
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivityData([])
    }
  }, [])

  // Initial load for tasks and updates (needed for badge counts)
  useEffect(() => {
    if (!initialLoadRef.current) {
      fetchAllUser()
      fetchTasks()
      fetchUpdates()
      initialLoadRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Fetch data based on tab index
  useEffect(() => {
    switch (tabIndex) {
      case 0:
        if (!loadedTabsRef.current.has('reminders')) {
          fetchReminders()
        }
        break
      case 1:
        if (!loadedTabsRef.current.has('tasks')) {
          fetchAllUser()
          fetchTasks()
        }
        break
      case 2:
        if (!loadedTabsRef.current.has('updates')) {
          fetchUpdates()
        }
        break
      case 3:
        if (!loadedTabsRef.current.has('announcements')) {
          fetchAnnouncements()
        }
        break
      case 4:
        if (!loadedTabsRef.current.has('activities')) {
          fetchActivities()
        }
        break
      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex]) // Only depend on tabIndex, fetch functions are stable

  // Refetch functions that force reload
  const refetchUpdates = useCallback(() => {
    return fetchUpdates(true)
  }, [fetchUpdates])

  return {
    loading,
    reminderData,
    taskData,
    announcementData,
    activityData,
    updates,
    users,
    setReminderData,
    setTaskData,
    setUpdates,
    refetchTasks: fetchTasks,
    refetchUpdates
  }
}
