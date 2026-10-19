import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  Box,
  Slide
} from '@mui/material'
import InputTextField from '../InputFields/InputTextField'
import { Formik, Form, ErrorMessage } from 'formik'
import dayjs from 'dayjs'
import { DateTimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import * as Yup from 'yup'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'

const eventValidationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters long.')
    .max(20, 'Title can be at most 20 characters long.')
    .required('Title is required.'),
  description: Yup.string().max(
    500,
    'Description can be at most 500 characters long.'
  ),
  startDate: Yup.date()
    .required('Start Date is required.')
    .typeError('Start Date must be a valid date.'),
  endDate: Yup.date()
    .required('End Date is required.')
    .typeError('End Date must be a valid date.')
    .min(Yup.ref('startDate'), 'End Date cannot be before Start Date.')
})

const CalendarForm = ({
  open,
  selectedStartDate,
  selectedEndDate,
  editEvent,
  deleteLoading,
  handleClose,
  handleAddAnnouncement,
  handleUpdateAnnouncement,
  handleDeleteAnnouncement
}) => {
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementIdToDelete, setAnnouncementIdToDelete] = useState(null)
  const handleOpenDeleteDialog = (id) => {
    setAnnouncementIdToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setAnnouncementIdToDelete(null)
  }

  const handleConfirmDelete = async () => {
    try {
      await handleDeleteAnnouncement(announcementIdToDelete, false, true)
      handleCloseDeleteDialog()
    } catch (error) {
      console.log('Failed to delete user', error)
    }
  }
  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth
        TransitionComponent={Slide} // Use Slide transition component for animation
        TransitionProps={{
          direction: 'down', // Slide down animation
          timeout: 400
        }}
      >
        <DialogTitle id="form-dialog-title">
          {editEvent ? 'Edit Event' : 'Add Event'}
        </DialogTitle>
        <Formik
          initialValues={{
            title: editEvent ? editEvent?.title : '',
            startDate: editEvent
              ? dayjs(editEvent?.start)
              : selectedStartDate
                ? dayjs(selectedStartDate)
                : null,
            endDate: editEvent
              ? dayjs(editEvent?.end)
              : selectedEndDate
                ? dayjs(selectedEndDate)
                : null,
            description: editEvent ? editEvent?.extendedProps.description : ''
          }}
          validationSchema={eventValidationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setSubmitting(true) // Set submitting state to true

            try {
              if (editEvent?.id) {
                await handleUpdateAnnouncement(editEvent.id, values)
              } else {
                await handleAddAnnouncement(values)
              }
              resetForm()
              handleClose()
            } catch (error) {
              HandleError(error, showSnackbar, navigate)
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({
            handleChange,
            handleBlur,
            setFieldValue,
            values,
            errors,
            touched,
            isSubmitting
          }) => (
            <Form>
              <DialogContent>
                <DialogContentText>
                  {editEvent
                    ? 'Edit the Event details below.'
                    : 'Please fill out the form to add a new Event.'}
                </DialogContentText>
                <InputTextField
                  id="title"
                  name="title"
                  label="Title"
                  margin="dense"
                  formik={{ values, handleChange, handleBlur, errors, touched }}
                />
                <Box
                  component="form"
                  display="flex"
                  justifyContent="space-between"
                  gap={2}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  sx={{
                    '& > *': {
                      flex: 1,
                      minWidth: '0',
                      width: { xs: '100%', sm: '48%' }
                    },
                    margin: '10px auto 0px auto'
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ width: '100%' }}>
                      <DateTimePicker
                        label="Start Date"
                        name="startDate"
                        value={values.startDate}
                        onChange={(date) => setFieldValue('startDate', date)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            fullWidth
                            error={Boolean(
                              errors.startDate && touched.startDate
                            )}
                            helperText={
                              errors.startDate && touched.startDate
                                ? errors.startDate
                                : ''
                            }
                          />
                        )}
                        // inputFormat="YYYY-MM-DDTHH:mm:ss.SSSZ" // Set the input format
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
                      <DateTimePicker
                        label="End Date"
                        name="endDate"
                        value={values.endDate}
                        onChange={(date) => setFieldValue('endDate', date)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            fullWidth
                            error={Boolean(errors.endDate && touched.endDate)}
                            helperText={
                              errors.endDate && touched.endDate
                                ? errors.endDate
                                : ''
                            }
                          />
                        )}
                        // inputFormat="YYYY-MM-DDTHH:mm:ss.SSSZ" // Set the input format
                        sx={{ width: '100%' }}
                      />
                      <ErrorMessage
                        name="endDate"
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
                <Box sx={{ marginTop: '5px' }}>
                  <InputTextField
                    id="description"
                    name="description"
                    label="Description"
                    margin="dense"
                    rows={4}
                    formik={{
                      values,
                      handleChange,
                      handleBlur,
                      errors,
                      touched
                    }}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                {editEvent?.id ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      handleOpenDeleteDialog(editEvent?.id)
                    }}
                    disabled={deleteLoading} // Disable if clicked before API call finishes
                  >
                    {deleteLoading ? <CircularProgress size={18} /> : 'Delete'}
                  </Button>
                ) : null}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={18} />
                  ) : editEvent?.id ? (
                    'Update'
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        itemName={editEvent?.title}
      />
    </>
  )
}

export default CalendarForm
