import React, { useContext, useState, useCallback, useMemo } from 'react'
import {
  Button,
  Tab,
  Tabs,
  Badge,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import AuthContext from 'app/contexts/JWTAuthContext'
import useAuth from 'app/hooks/useAuth'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import axiosInstance from 'axiosInstance'
import { useNavigate } from 'react-router-dom'
import TaskForm from '../Tasks/TaskForm'
import UpdateForm from '../Updates/UpdateForm'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import ReminderConfirmDialog from '../Charts/ReminderConfirmDialog'
import LeadDetailsModal from 'app/views/leads/LeadDetailsModal'
import MainLeadForm from 'app/views/leads/MainLeadForm'
import { dropdownOptions } from 'app/utils/constant'
import { useSocket } from 'app/contexts/SocketContext'
import { TABLE_COLUMNS, INITIAL_LEAD_VALUES } from './constants'
import TabPanel from './TabPanel'
import DashboardTable from './DashboardTable'
import { useDashboardData } from './hooks/useDashboardData'

const DashboardTableComponent = () => {
  const { hasPermission } = useAuth()
  const {
    user: authUser,
    states,
    stateCityMap,
    allCities
  } = useContext(AuthContext)

  const [tabIndex, setTabIndex] = useState(0)
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { socket } = useSocket()

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitingFinish, setSubmitingFinish] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateSubmitting, setUpdateSubmitting] = useState(false)
  const [updateSubmitingFinish, setUpdateSubmitingFinish] = useState(false)
  const [initialUpdate, setInitialUpdate] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [docIdToDelete, setDocIdToDelete] = useState(null)
  const [reminderConfirmDialogOpen, setReminderConfirmDialogOpen] =
    useState(false)
  const [reminderToMark, setReminderToMark] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [leadViewActiveTab, setLeadViewActiveTab] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCall, setIsCall] = useState(false)
  const [editId, setEditId] = useState('')
  const [initialValues, setInitialValues] = useState(INITIAL_LEAD_VALUES)
  const [activeTab, setActiveTab] = useState(0)
  const [gstDetailsData, setGstDetailsData] = useState(null)
  const [isCallTrue, setIsCallTrue] = useState(false)
  const [reminderAddedByFilter, setReminderAddedByFilter] = useState('all')

  // Use custom hook for data fetching
  const {
    loading,
    reminderData,
    taskData,
    announcementData,
    activityData,
    updates,
    users,
    setReminderData,
    setTaskData,
    refetchTasks,
    refetchUpdates
  } = useDashboardData(tabIndex)

  // Memoize tab content to avoid recreating on every render
  const tabContent = useMemo(
    () => ({
      reminders: reminderData,
      tasks: taskData,
      updates: updates,
      announcements: announcementData,
      latestActivity: activityData
    }),
    [reminderData, taskData, updates, announcementData, activityData]
  )

  // Memoize columns - they never change
  const columns = useMemo(() => TABLE_COLUMNS, [])

  // Distinct "Added By" values to populate the reminders filter
  const reminderAddedByOptions = useMemo(() => {
    const names = new Set(
      reminderData
        .map((reminder) => reminder.addedBy)
        .filter((name) => name && name !== 'N / A' && name !== 'N/A')
    )
    return Array.from(names).sort()
  }, [reminderData])

  // Filter reminders by selected "Added By"
  const filteredReminderData = useMemo(() => {
    if (reminderAddedByFilter === 'all') return reminderData
    return reminderData.filter(
      (reminder) => reminder.addedBy === reminderAddedByFilter
    )
  }, [reminderData, reminderAddedByFilter])

  // Task handlers
  const handleClickOpen = useCallback(() => {
    setTaskModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setTaskModalOpen(false)
    setSubmitingFinish(false)
    setSubmitting(false)
  }, [])

  const handleAddTask = useCallback(
    async (task) => {
      setSubmitting(true)
      setSubmitingFinish(false)
      try {
        const result = await axiosInstance.post('/api/tasks', task)
        if (result.status === 201) {
          showSnackbar({
            message: 'Task added successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          setSubmitingFinish(true)
          handleClose()
          refetchTasks()
        }
      } catch (error) {
        setSubmitingFinish(false)
        HandleError(error, showSnackbar, navigate)
      } finally {
        setSubmitting(false)
      }
    },
    [showSnackbar, navigate, handleClose, refetchTasks]
  )

  // Update handlers
  const handleUpdateModalClose = useCallback(() => {
    setInitialUpdate(null)
    setUpdateModalOpen(false)
    setUpdateSubmitingFinish(false)
    setUpdateSubmitting(false)
  }, [])

  const handleUpdate = useCallback(
    async (data) => {
      setUpdateSubmitting(true)
      setUpdateSubmitingFinish(false)
      try {
        const result = await axiosInstance.put(
          `/api/update/${initialUpdate?._id}`,
          data
        )
        if (result.status === 200) {
          showSnackbar({
            message: 'Message updated successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          setUpdateSubmitingFinish(true)
          handleUpdateModalClose()
          refetchUpdates()
        }
      } catch (error) {
        setUpdateSubmitingFinish(false)
        HandleError(error, showSnackbar, navigate)
      } finally {
        setUpdateSubmitting(false)
      }
    },
    [
      initialUpdate,
      showSnackbar,
      navigate,
      handleUpdateModalClose,
      refetchUpdates
    ]
  )

  const handleAddUpdate = useCallback(
    async (update) => {
      setUpdateSubmitting(true)
      setUpdateSubmitingFinish(false)
      try {
        const result = await axiosInstance.post('/api/update', update)
        if (result.status === 201) {
          showSnackbar({
            message: 'Message added successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          setUpdateSubmitingFinish(true)
          handleUpdateModalClose()
          refetchUpdates()
        }
      } catch (error) {
        setUpdateSubmitingFinish(false)
        HandleError(error, showSnackbar, navigate)
      } finally {
        setUpdateSubmitting(false)
      }
    },
    [showSnackbar, navigate, handleUpdateModalClose, refetchUpdates]
  )

  // Lead handlers
  const handleViewDetails = useCallback(
    async (leadId) => {
      try {
        const response = await axiosInstance.get(`/api/leads/${leadId}`)
        setSelectedLead(response.data.lead)
        setIsDetailsModalOpen(true)
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
        console.error('Error fetching lead details:', error)
      }
    },
    [showSnackbar, navigate]
  )

  const handleCloseDetailsModal = useCallback(() => {
    setSelectedLead(null)
    setIsDetailsModalOpen(false)
  }, [])

  const handleEditModal = useCallback((id) => {
    setEditId(id)
    setIsModalOpen(true)
    setIsCall(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditId('')
    setIsCall(false)
  }, [])

  const handleSubmitEdit = useCallback(
    async (values, formik) => {
      try {
        const result = await axiosInstance.put(`/api/leads/${editId}`, values)
        if (result.status === 200) {
          setEditId('')
          setIsModalOpen(false)
          showSnackbar({
            message: 'Lead updated successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          socket.emit('update_leads_overview')
          formik.resetForm()
        }
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
        console.error('Error : ', error)
      }
    },
    [editId, showSnackbar, navigate, socket]
  )

  // Task field update
  const handleUpdateTaskField = useCallback(
    async (event, taskData, field) => {
      const userId = taskData.id
      const value = event.target.value

      try {
        const response = await axiosInstance.patch(
          `/api/tasks/update-field/${userId}`,
          { field: field, value: value }
        )
        if (response.status === 200) {
          showSnackbar({
            message: `Task ${field} updated successfully!`,
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          setTaskData((prevData) =>
            prevData
              .map((task) =>
                task.id === userId ? { ...task, [field]: value } : task
              )
              .filter((task) => task.status !== 'Completed')
          )
        }
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
      }
    },
    [showSnackbar, navigate, setTaskData]
  )

  // Delete handlers
  const handleDelete = useCallback(
    async (id) => {
      try {
        const response = await axiosInstance.delete(`/api/update/${id}`)
        if (response.data.success) {
          showSnackbar({
            message: 'Message deleted successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
        }
      } catch (error) {
        console.error(error)
        HandleError(error, showSnackbar, navigate)
      }
    },
    [showSnackbar, navigate]
  )

  const handleOpenDeleteDialog = useCallback((id) => {
    setDocIdToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setDocIdToDelete(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await handleDelete(docIdToDelete)
      refetchUpdates()
      handleCloseDeleteDialog()
    } catch (error) {
      console.error('Failed to delete update', error)
    }
  }, [docIdToDelete, handleDelete, refetchUpdates, handleCloseDeleteDialog])

  // Reminder handlers
  const handleCloseReminderConfirmDialog = useCallback(() => {
    setReminderConfirmDialogOpen(false)
    setReminderToMark(null)
  }, [])

  const handleToggleReminderReadStatus = useCallback(
    async (leadId, reminderId) => {
      try {
        const response = await axiosInstance.patch(
          `/api/leads/reminder/${reminderId}/mark-read`,
          { leadId }
        )

        if (response.status === 200) {
          showSnackbar({
            message: response.data.message,
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })

          setReminderData((prevData) =>
            prevData.filter(
              (reminder) =>
                !(
                  reminder.leadId === leadId &&
                  reminder.reminderId === reminderId
                )
            )
          )
        }
      } catch (error) {
        console.error('Error toggling reminder read status:', error)
        HandleError(error, showSnackbar, navigate)
      }
    },
    [showSnackbar, navigate, setReminderData]
  )

  const handleConfirmMarkAsRead = useCallback(async () => {
    if (reminderToMark) {
      await handleToggleReminderReadStatus(
        reminderToMark.leadId,
        reminderToMark.reminderId
      )
      handleCloseReminderConfirmDialog()
    }
  }, [
    reminderToMark,
    handleToggleReminderReadStatus,
    handleCloseReminderConfirmDialog
  ])

  const handleCheckboxChange = useCallback((row) => {
    setReminderToMark({
      leadId: row.leadId,
      reminderId: row.reminderId
    })
    setReminderConfirmDialogOpen(true)
  }, [])

  const handleEditUpdate = useCallback((row) => {
    setUpdateModalOpen(true)
    setInitialUpdate(row)
  }, [])

  const handleDeleteUpdate = useCallback(
    (id) => {
      handleOpenDeleteDialog(id)
    },
    [handleOpenDeleteDialog]
  )

  // Tab change handler
  const handleTabChange = useCallback((_, newValue) => {
    setTabIndex(newValue)
  }, [])

  // Navigation handler
  const handleButtonClick = () => {
    navigate('/tasks')
  }

  // Permission checks
  const hasViewPermission = hasPermission('Leads:view')
  const hasEditPermission = hasPermission('Leads:edit')
  const canDelete = authUser?.role !== 'Sales Executive'

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
          alignItems: 'center',
          margin: 2
        }}
      >
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            width: '100%',
            '& .MuiTab-root': {
              minWidth: { xs: '60%', sm: '60%', md: '10%', lg: '10%' }
            }
          }}
        >
          <Tab label="Reminders" />
          <Tab
            label={
              <Badge badgeContent={taskData?.length} color="primary">
                Tasks
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={updates?.length} color="primary">
                Updates
              </Badge>
            }
          />
          <Tab label="Events" />
          <Tab label="Latest Activity" />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <TabPanel value={tabIndex} index={0}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            mb: 2
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="reminder-added-by-label">Added By</InputLabel>
            <Select
              labelId="reminder-added-by-label"
              label="Added By"
              value={reminderAddedByFilter}
              onChange={(e) => setReminderAddedByFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {reminderAddedByOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <DashboardTable
          columns={columns.reminders}
          data={filteredReminderData}
          loading={loading}
          onCheckboxChange={handleCheckboxChange}
          onViewDetails={handleViewDetails}
          onEditLead={handleEditModal}
          onStatusChange={handleUpdateTaskField}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
        />
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            mb: 2
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleButtonClick}
          >
            See All
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginLeft: '1rem' }}
            onClick={handleClickOpen}
          >
            Add Task
          </Button>
        </Box>
        <DashboardTable
          columns={columns.tasks}
          data={tabContent.tasks}
          loading={loading}
          onStatusChange={handleUpdateTaskField}
        />
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            mb: 2
          }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ marginLeft: '1rem' }}
            onClick={() => setUpdateModalOpen(true)}
          >
            Add
          </Button>
        </Box>
        <DashboardTable
          columns={columns.updates}
          data={tabContent.updates}
          loading={loading}
          onEditUpdate={handleEditUpdate}
          onDeleteUpdate={handleDeleteUpdate}
          canDelete={canDelete}
        />
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <DashboardTable
          columns={columns.announcements}
          data={tabContent.announcements}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={tabIndex} index={4}>
        <DashboardTable
          columns={columns.latestActivity}
          data={tabContent.latestActivity}
          loading={loading}
        />
      </TabPanel>

      {/* Modals */}
      <TaskForm
        open={taskModalOpen}
        users={users}
        initialTask={null}
        isSubmitting={{ setSubmitting, submitting }}
        submitingFinish={submitingFinish}
        handleTask={handleAddTask}
        handleClose={handleClose}
      />

      <UpdateForm
        open={updateModalOpen}
        initialUpdate={initialUpdate}
        isSubmitting={{ setUpdateSubmitting, updateSubmitting }}
        submitingFinish={updateSubmitingFinish}
        handleUpdate={initialUpdate ? handleUpdate : handleAddUpdate}
        handleClose={handleUpdateModalClose}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        itemName=""
      />

      <ReminderConfirmDialog
        open={reminderConfirmDialogOpen}
        onConfirm={handleConfirmMarkAsRead}
        onCancel={handleCloseReminderConfirmDialog}
      />

      <LeadDetailsModal
        leadViewActiveTab={leadViewActiveTab}
        isOpen={isDetailsModalOpen}
        handleClose={handleCloseDetailsModal}
        lead={selectedLead}
        any={authUser}
        setLeadViewActiveTab={setLeadViewActiveTab}
      />

      <MainLeadForm
        title="Edit Lead"
        buttonTextOpen="Edit"
        buttonTextSubmit="Save"
        buttonTextCancel="Cancel"
        dropdownOptions={dropdownOptions}
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        getLeads={() => {}}
        initialValues={initialValues}
        editId={editId}
        handleAdd={() => {}}
        handleEdit={handleSubmitEdit}
        resetEdit={() => setEditId('')}
        setInitialValues={setInitialValues}
        loading={loading}
        states={states}
        stateCityMap={stateCityMap}
        allCities={allCities}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gstDetailsData={gstDetailsData}
        setGstDetailsData={setGstDetailsData}
        isCallTrue={isCallTrue}
        setIsCallTrue={setIsCallTrue}
        isCall={isCall}
        setIsCall={setIsCall}
      />
    </>
  )
}

export default DashboardTableComponent
