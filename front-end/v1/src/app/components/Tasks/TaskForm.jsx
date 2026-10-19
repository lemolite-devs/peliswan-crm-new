import React from 'react'
import * as Yup from 'yup'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  TextField,
  InputLabel,
  Select,
  Box,
  Autocomplete
} from '@mui/material'
import { Formik, Form, ErrorMessage } from 'formik'

import InputTextField from '../InputFields/InputTextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'

// Task Validation Schema
const taskValidationSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Task Name must be at least 3 characters long.')
    .max(100, 'Task Name can be at most 100 characters long.')
    .required('Task Name is required.'),

  priority: Yup.string()
    .oneOf(
      ['Low', 'Medium', 'High'],
      'Priority must be one of Low, Medium, High.'
    )
    .required('Priority is required.'),

  startDate: Yup.date()
    .required('Start Date is required.')
    .typeError('Start Date must be a valid date.'),

  dueDate: Yup.date()
    .required('Due Date is required.')
    .typeError('Due Date must be a valid date.')
    .min(Yup.ref('startDate'), 'Due Date cannot be before Start Date.'),

  status: Yup.string()
    .oneOf(
      ['Not Started', 'In Progress', 'Completed'],
      'Status must be one of Not Started, In Progress, Completed.'
    )
    .required('Status is required.'),

  assignedTo: Yup.array()
    .of(Yup.string().required('Invalid user selected.'))
    .min(1, 'At least one user must be assigned.')
    .required('Assigned To is required.'),

  description: Yup.string().max(
    500,
    'Description can be at most 500 characters long.'
  )
})

const priorityOptions = ['High', 'Medium', 'Low']
const statusOptions = ['Not Started', 'In Progress', 'Completed']

const TaskForm = ({
  open,
  users = [],
  handleClose,
  handleTask,
  initialTask,
  isSubmitting,
  submitingFinish
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        {initialTask ? 'Edit Task' : 'Add Task'}
      </DialogTitle>

      <Formik
        initialValues={{
          name: initialTask ? initialTask?.name : '',
          priority: initialTask ? initialTask?.priority : '',
          startDate: initialTask ? dayjs(initialTask?.startDate) : null,
          dueDate: initialTask ? dayjs(initialTask?.dueDate) : null,
          status: initialTask ? initialTask?.status : '',
          assignedTo: initialTask
            ? Array.isArray(initialTask.assignedTo)
              ? initialTask.assignedTo.map((user) => user._id)
              : []
            : [],
          description: initialTask ? initialTask?.description : ''
        }}
        validationSchema={taskValidationSchema}
        onSubmit={(values, { resetForm }) => {
          handleTask(values)
          isSubmitting.setSubmitting(true)
          if (!isSubmitting.submitting) {
            if (submitingFinish) {
              resetForm()
              handleClose()
            }
          }
        }}
      >
        {({
          handleChange,
          handleBlur,
          setFieldValue,
          values,
          errors,
          touched
        }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                {initialTask
                  ? 'Edit the Task details below.'
                  : 'Please fill out the form to add a new task.'}
              </DialogContentText>

              {/* form fields */}
              <InputTextField
                id="name"
                name="name"
                label="Task Name"
                margin="dense"
                formik={{ values, handleChange, handleBlur, errors, touched }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  name="priority"
                  labelId="priority-label"
                  label="Priority"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.priority}
                  error={Boolean(errors.priority && touched.priority)}
                >
                  {priorityOptions.map((option) => {
                    return (
                      <MenuItem value={option} key={option}>
                        {option}
                      </MenuItem>
                    )
                  })}
                </Select>
                <ErrorMessage
                  name="priority"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl>
              <Box
                component="form"
                display="flex"
                justifyContent="space-between"
                gap={2} // adds space between the fields
                flexDirection={{ xs: 'column', sm: 'row' }} // Stack vertically on small screens, horizontally on larger screens
                sx={{
                  '& > *': {
                    flex: 1,
                    minWidth: '0',
                    width: { xs: '100%', sm: '48%' } // 100% width on small screens, 48% on larger screens
                  },
                  margin: '10px auto 0px auto'
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ width: '100%' }}>
                    <DatePicker
                      label="Start Date"
                      format="DD/MM/YYYY"
                      value={values.startDate}
                      onChange={(date) => setFieldValue('startDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          fullWidth
                          error={Boolean(errors.startDate && touched.startDate)}
                          helperText={
                            errors.startDate && touched.startDate
                              ? errors.startDate
                              : ''
                          }
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                    <ErrorMessage
                      name="startDate"
                      component="div"
                      style={{
                        color: '#FF3D57',
                        fontWeight: 400,
                        fontSize: '0.75rem',
                        lineHeight: 1.66,
                        letterSpacing: '0.03333em',
                        textAlign: 'left',
                        marginTop: '3px',
                        marginRight: '14px',
                        marginBottom: '0',
                        marginLeft: '14px'
                      }}
                    />
                  </Box>
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ width: '100%' }}>
                    <DatePicker
                      label="Due Date"
                      format="DD/MM/YYYY"
                      value={values.dueDate}
                      onChange={(date) => setFieldValue('dueDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          fullWidth
                          error={Boolean(errors.startDate && touched.startDate)}
                          helperText={
                            errors.startDate && touched.startDate
                              ? errors.startDate
                              : ''
                          }
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                    <ErrorMessage
                      name="dueDate"
                      component="div"
                      style={{
                        color: '#FF3D57',
                        fontWeight: 400,
                        fontSize: '0.75rem',
                        lineHeight: 1.66,
                        letterSpacing: '0.03333em',
                        textAlign: 'left',
                        marginTop: '3px',
                        marginRight: '14px',
                        marginBottom: '0',
                        marginLeft: '14px'
                      }}
                    />
                  </Box>
                </LocalizationProvider>
              </Box>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  name="status"
                  labelId="status-label"
                  label="Status"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.status}
                  error={Boolean(errors.status && touched.status)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem value={option} key={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorMessage
                  name="status"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl>
              {/* <FormControl fullWidth margin="normal">
                <InputLabel id="assigned-to-label">Assigned To</InputLabel>
                <Select
                  name="assignedTo"
                  labelId="assigned-to-label"
                  label="Assigned To"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.assignedTo}
                  error={Boolean(errors.assignedTo && touched.assignedTo)}
                >
                  {users.map((user) => (
                    <MenuItem value={user.id} key={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorMessage
                  name="assignedTo"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl> */}
              <Autocomplete
                multiple
                id="assigned-to"
                options={users}
                getOptionLabel={(option) => option?.name || ''} // Safely access name
                value={
                  Array.isArray(values.assignedTo)
                    ? values.assignedTo.map((id) =>
                        users.find((user) => user.id === id)
                      )
                    : [] // Ensure it's always an array of user objects
                }
                onChange={(event, newValue) => {
                  const selectedIds = newValue.map((item) => item.id) // Extract IDs
                  setFieldValue('assignedTo', selectedIds) // Ensure array of IDs
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned To"
                    error={Boolean(touched.assignedTo && errors.assignedTo)}
                    helperText={touched.assignedTo && errors.assignedTo}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id} // Compare by ID
              />

              <InputTextField
                id="description"
                name="description"
                label="Description"
                margin="dense"
                rows={2}
                formik={{ values, handleChange, handleBlur, errors, touched }}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting.submitting}
              >
                {isSubmitting.submitting ? (
                  <CircularProgress size={18} />
                ) : initialTask ? (
                  'Save Changes'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}

export default TaskForm
