import React, { useState, useEffect } from 'react'
import {
  TextField,
  Box,
  Button,
  Grid,
  IconButton,
  Autocomplete,
  TablePagination
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import styled from '@emotion/styled'
import axiosInstance from 'axiosInstance'
import { Breadcrumb } from 'app/components'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import TaskForm from 'app/components/Tasks/TaskForm'
import TaskTable from 'app/components/Tasks/TaskTable'
import { useNavigate } from 'react-router-dom'
import useAuth from 'app/hooks/useAuth'
// import ViewListIcon from '@mui/icons-material/ViewList'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import TableViewIcon from '@mui/icons-material/TableView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import moment from 'moment'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { fontWeight } from '@mui/system'

// import ViewListIcon from '@mui/icons-material/ViewList'

const Container = styled('div')(({ theme }) => ({
  margin: '15px',
  [theme.breakpoints.down('md')]: { margin: '15px' },
  '& .breadcrumb': {
    marginBottom: '5px'
  }
}))

const priorityOptions = ['High', 'Medium', 'Low']
const statusOptions = ['Not Started', 'In Progress', 'Completed']

const TaskList = () => {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [statusCount, setStatusCount] = useState({})
  const [filteredTasks, setFilteredTasks] = useState([])
  const [status, setStatus] = useState(null)
  const [priority, setPriority] = useState(null)
  const [searchName, setSearchName] = useState('')
  const [totalTasks, setTotalTasks] = useState(0)
  const [page, setPage] = useState(0)
  const [rowPerPage, setRowPerPage] = useState(10) // Default to 10 rows per page
  const [submitting, setSubmitting] = useState(false)
  const [submitingFinish, setSubmitingFinish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [view, setView] = useState('table') // 'table' or 'kanban'

  // getStatusCounts for get status count

  const getStatusCounts = async () => {
    try {
      const response = await axiosInstance.get('/api/tasks/status-count')
      setStatusCount({ ...response.data })
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }
  const fetchAllTask = async (page = 1, rowPerPage = 10, searchName = '') => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/tasks', {
        params: { page, rowPerPage, status, priority, search: searchName }
      })
      if (searchName) {
        setTasks([])
        setFilteredTasks(() => response.data?.tasks)
      }
      setTasks(response.data?.tasks || [])
      setTotalTasks(() => response.data?.totalTasks)
      getStatusCounts()
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  // handleClickOpen for a open a modal to add task.
  const handleClickOpen = (taskId = null, task = null) => {
    setEditingTask(task)
    setOpen(true)
  }

  // handleClose for close the task modal.
  const handleClose = () => {
    setOpen(false)
    setEditingTask(null)
    setSubmitingFinish(false)
    setSubmitting(false)
  }

  // handleAddTask for an add the task.
  const handleAddTask = async (task) => {
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
        await fetchAllTask(1, rowPerPage)
        setSubmitingFinish(true)
        handleClose()
      }
    } catch (error) {
      setSubmitingFinish(false)
      HandleError(error, showSnackbar, navigate)
    } finally {
      setSubmitting(false)
    }
  }

  // handleUpdateTask for an update the task.
  const handleUpdateTask = async (task) => {
    setSubmitting(true)
    setSubmitingFinish(false)
    try {
      const result = await axiosInstance.put(
        `/api/tasks/${editingTask._id}`,
        task
      )
      if (result.status === 200) {
        showSnackbar({
          message: 'Task updated successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchAllTask(page + 1, rowPerPage, searchName)
        setSubmitingFinish(true)
        handleClose()
      }
    } catch (error) {
      setSubmitingFinish(false)
      HandleError(error, showSnackbar, navigate)
    } finally {
      setSubmitting(false)
    }
  }

  // handleDeleteTask for a delete a task.
  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true)
      const result = await axiosInstance.delete(`/api/tasks/${taskId}`)

      if (result.status === 200) {
        showSnackbar({
          message: 'Task deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchAllTask(page + 1, rowPerPage, searchName)
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
      handleClose()
    }
  }

  const fetchAllUser = async () => {
    try {
      const response = await axiosInstance.get('/api/users/lookUps')
      const data = response.data.users || []
      if (response.data?.users) {
        setUsers(data)
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  // handleChangeRowsPerPage for how many rows show in table
  const handleChangeRowsPerPage = (event) => {
    setRowPerPage(+event.target.value)
    setPage(0) // Reset page to 0 when rows per page changes
  }

  // handleChangePage for change page
  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  const handleUpdateTaskField = async (event, row, field) => {
    const value = event.target.value
    try {
      setLoading(true)
      const response = await axiosInstance.patch(
        `/api/tasks/update-field/${row._id}`,
        { field: field, value: value }
      )
      if (response.status === 200) {
        showSnackbar({
          message: `Task ${field} updated successfully!`,
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchAllTask(page + 1, rowPerPage, searchName)
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  // handleSearch for search
  const handleSearch = async () => {
    if (searchName.trim() === '') {
      await fetchAllTask(1, rowPerPage)
      setFilteredTasks([])
    } else {
      try {
        setLoading(true)
        const response = await axiosInstance.get('/api/tasks', {
          params: {
            page: page + 1,
            rowPerPage,
            search: searchName,
            status,
            priority
          }
        })
        setPage(0)
        setTasks(() => [])
        setFilteredTasks(() => response.data?.tasks)
        setTotalTasks(response.data?.totalTasks)
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
      } finally {
        setLoading(false)
      }
    }
  }

  const onChange = (event) => {
    setSearchName(event.target.value)
  }

  // fetch a all task and users when a task page load
  useEffect(() => {
    // fetchAllTask()
    fetchAllUser()
  }, [])

  // Trigger handleSearch when searchName is cleared
  useEffect(() => {
    if (searchName === '') {
      handleSearch()
      setPage(0)
    }
  }, [searchName])

  useEffect(() => {
    fetchAllTask(1, rowPerPage, searchName)
    setPage(0)
  }, [status, priority])

  const renderKanbanView = () => {
    const columns = {
      'Not Started': tasks.filter((task) => task.status === 'Not Started'),
      'In Progress': tasks.filter((task) => task.status === 'In Progress'),
      Completed: tasks.filter((task) => task.status === 'Completed')
    }

    return (
      <>
        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={2}>
            {Object.entries(columns).map(([status, tasks]) => (
              <Grid item xs={12} md={4} key={status}>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 2,
                    height: '600px',
                    display: 'flex',
                    overflowY: 'auto',
                    flexDirection: 'column',
                    boxShadow: 2,
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <h3>{status}</h3>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          minHeight: '400px',
                          flexGrow: 1,
                          overflowY: 'auto'
                        }}
                      >
                        {tasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleClickOpen(task._id, task)}
                                sx={{
                                  bgcolor: 'white',
                                  p: 2,
                                  mb: 1,
                                  borderRadius: 1,
                                  boxShadow: 1,
                                  borderTop: '4px solid',
                                  borderColor:
                                    status === 'Not Started'
                                      ? '#94a3b8'
                                      : status === 'In Progress'
                                        ? '#0ea5e9'
                                        : '#22c55e',
                                  transition: 'all 0.3s ease-in-out',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
                                    border: '2px solid',
                                    borderColor:
                                      status === 'Not Started'
                                        ? '#94a3b8'
                                        : status === 'In Progress'
                                          ? '#0ea5e9'
                                          : '#22c55e',
                                    borderTopWidth: '4px',
                                    zIndex: 1
                                  }
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <h4>{task.name}</h4>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <AccountCircleIcon fontSize="large" />
                                      <span
                                        sx={{
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {task.assignedTo?.name}
                                      </span>
                                    </Box>
                                    <Box
                                      component="span"
                                      sx={{
                                        display: 'inline-block',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        textTransform: 'capitalize',
                                        color: 'white',
                                        bgcolor:
                                          task.priority === 'Low'
                                            ? 'grey.500'
                                            : task.priority === 'Medium'
                                              ? 'info.main'
                                              : 'error.main'
                                      }}
                                    >
                                      {task.priority}
                                    </Box>
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  <p>
                                    Start Date:{' '}
                                    {moment(task.startDate).format(
                                      'DD MMM YYYY'
                                    )}
                                  </p>
                                  <p>
                                    Due Date:{' '}
                                    {moment(task.dueDate).format('DD MMM YYYY')}
                                  </p>
                                </Box>

                                <p>{task.description}</p>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
        <TablePagination
          sx={{ px: 2 }}
          component="div"
          page={page}
          rowsPerPage={rowPerPage}
          count={totalTasks}
          rowsPerPageOptions={[5, 10, 20, 30]}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          nextIconButtonProps={{ 'aria-label': 'Next Page' }}
          backIconButtonProps={{ 'aria-label': 'Previous Page' }}
        />
      </>
    )
  }

  const onDragEnd = async (result) => {
    console.log('Drag ended:', result)
    if (!result.destination) {
      console.log('No destination')
      return
    }

    const { source, destination, draggableId } = result

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId
      try {
        setLoading(true)
        await handleUpdateTaskField(
          { target: { value: newStatus } },
          { _id: draggableId },
          'status'
        )
        // Refresh the task list after updating
        await fetchAllTask(page + 1, rowPerPage, searchName)
      } catch (error) {
        console.error('Error updating task status:', error)
        showSnackbar({
          message: 'Error updating task status',
          severity: 'error',
          vertical: 'top',
          horizontal: 'right'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  // fetch an all task data when a page or rowPerPage change
  useEffect(() => {
    fetchAllTask(page + 1, rowPerPage, searchName)
  }, [page, rowPerPage])

  // useEffect(() => {
  //   fetchAllTask(page + 1, rowPerPage, '')
  // }, [page, rowPerPage])
  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Tasks' }]} />
      </Box>

      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left-aligned button */}
        <Grid
          item
          xs={12}
          sm={12}
          md={3}
          display="flex"
          // justifyContent="flex-start"
          // alignItems="center"
          gap={8}
        >
          {hasPermission('Tasks:add') && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleClickOpen()}
              disabled={submitting}
            >
              + Add Task
            </Button>
          )}
          <Box>
            <IconButton
              onClick={() => setView(view === 'table' ? 'kanban' : 'table')}
            >
              {view === 'table' ? <TableViewIcon /> : <TableRowsIcon />}
            </IconButton>
          </Box>
        </Grid>

        {/* Right-aligned filters  */}
        <Grid item xs={12} sm={12} md={3}>
          <Box
            sx={{
              marginRight: {
                xs: '0',
                sm: '0',
                md: '10px'
              },
              width: {
                xs: '100%',
                sm: '100%',
                md: '80%'
              }
            }}
          >
            <Autocomplete
              size="small"
              options={statusOptions}
              value={status}
              onChange={(event, newValue) => setStatus(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Status"
                  variant="outlined"
                  margin="normal"
                />
              )}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={3}>
          {' '}
          <Box
            sx={{
              marginRight: {
                xs: '0',
                sm: '0',
                md: '10px'
              },
              width: {
                xs: '100%',
                sm: '100%',
                md: '80%'
              }
            }}
          >
            <Autocomplete
              size="small"
              options={priorityOptions}
              value={priority}
              onChange={(event, newValue) => setPriority(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Priority"
                  variant="outlined"
                  margin="normal"
                />
              )}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={3}>
          <Box
            display="flex"
            alignItems="center"
            columnGap={2}
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            {/* Search Bar for filtering by name */}
            <TextField
              size="small"
              margin="dense"
              name="name"
              variant="outlined"
              value={searchName}
              onChange={onChange}
              fullWidth
              placeholder="Type task name for search..."
            />
            <IconButton
              color="primary"
              onClick={handleSearch}
              aria-label="search"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' }, // Hide on small screens
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                marginTop: '5px',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              <SearchIcon sx={{ fontSize: 24 }} />
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              sx={{
                display: { xs: 'inline-flex', sm: 'none', marginTop: '16px' }, // Show on small screens
                width: { xs: '100%', sm: 'auto' }
              }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/*  Here is a task summary  */}
      <Grid
        container
        sx={{
          marginTop: '20px',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}
      >
        <Grid
          item
          md={4}
          lg={4}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            p={1}
            sx={{
              marginRight: '20px',
              width: '127px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              className="not-started"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <h3 style={{ fontSize: 'x-large', margin: 0 }}>
                {statusCount?.['Not Started']}
              </h3>
              <p style={{ margin: 0, color: '#64748b' }}> Not Started</p>
            </div>
          </Box>
        </Grid>

        <Grid
          item
          md={4}
          lg={4}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            p={1}
            sx={{
              marginRight: '20px',
              width: '127px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              className="in-progress"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <h3 style={{ fontSize: 'x-large', margin: 0 }}>
                {statusCount?.['In Progress']}
              </h3>
              <p style={{ margin: 0, color: '#3b82f6' }}> In Progress</p>
            </div>
          </Box>
        </Grid>

        <Grid
          item
          md={4}
          lg={4}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            p={1}
            sx={{
              width: '127px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              className="completed"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <h3 style={{ fontSize: 'x-large', margin: 0 }}>
                {statusCount?.Completed}
              </h3>
              <p style={{ margin: 0, color: '#22c55e' }}> Completed</p>
            </div>
          </Box>
        </Grid>
      </Grid>

      {/* Task form for add or update a task  */}
      <TaskForm
        open={open}
        users={users}
        initialTask={editingTask}
        isSubmitting={{ setSubmitting, submitting }}
        submitingFinish={submitingFinish}
        handleTask={editingTask ? handleUpdateTask : handleAddTask}
        handleClose={handleClose}
      />

      {/* Task table for displaying tasks in tabular formate */}

      {view === 'table' ? (
        <TaskTable
          tasks={filteredTasks.length !== 0 ? filteredTasks : tasks}
          loading={{ loading, setLoading }}
          page={page}
          searchQuery={searchName}
          rowPerPage={rowPerPage}
          totalTasks={totalTasks}
          fetchAllTask={fetchAllTask}
          handleUpdateTaskField={handleUpdateTaskField}
          handleEdit={handleClickOpen}
          handleDelete={handleDeleteTask}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleChangePage={handleChangePage}
        />
      ) : (
        renderKanbanView()
      )}
    </Container>
  )
}

export default TaskList
