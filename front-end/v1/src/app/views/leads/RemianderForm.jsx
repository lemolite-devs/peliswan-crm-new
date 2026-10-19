import { useState, useEffect } from 'react'
import moment from 'moment-timezone'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'

const ReminderForm = ({
  title = 'Form',
  contentText = 'Please enter your details below.',
  buttonTextOpen = 'Open form dialog',
  buttonTextCancel = 'Cancel',
  buttonTextSubmit = 'Submit',
  onSubmit = () => {},
  fields = [],
  includeDropdowns = false,
  open = false,
  handleClose = () => {},
  editReminder
}) => {
  const [formData, setFormData] = useState(() => {
    const initialData = {}
    fields.forEach((field) => {
      initialData[field.id] = ''
    })
    return initialData
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editReminder) {
      setFormData({
        message: editReminder.message,
        baseDate: editReminder.baseDate || '',
        _id: editReminder._id
      })
    } else {
      const initialData = {}
      fields.forEach((field) => {
        initialData[field.id] = ''
      })
      setFormData(initialData)
    }
  }, [editReminder])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const validate = () => {
    const newErrors = {}
    const minDateStr = moment.tz('Asia/Kolkata').format('YYYY-MM-DD')
    fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label || field.id} is required`
      }
      if (
        field.type === 'date' &&
        formData[field.id] &&
        formData[field.id] < minDateStr
      ) {
        newErrors[field.id] = 'Date cannot be in the past'
      }
    })
    return newErrors
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
    } else {
      setErrors({})
      onSubmit(formData)
      handleClose()
    }
  }

  const handleDialogClose = () => {
    setErrors({})
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{contentText}</DialogContentText>
        {fields.map((field) => {
          return field.type === 'select' ? (
            <FormControl
              fullWidth
              margin="dense"
              key={field.id}
              error={!!errors[field.id]}
            >
              <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
              <Select
                labelId={`${field.id}-label`}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                label={field.label}
              >
                {field.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors[field.id] && (
                <Box color="red" mt={1}>
                  {errors[field.id]}
                </Box>
              )}
            </FormControl>
          ) : (
            <TextField
              key={field.id}
              fullWidth
              id={field.id}
              name={field.id}
              type={field.type || 'text'}
              margin="dense"
              label={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
              inputProps={
                field.type === 'date'
                  ? {
                      min: moment.tz('Asia/Kolkata').format('YYYY-MM-DD')
                    }
                  : {}
              }
              error={!!errors[field.id]}
              helperText={errors[field.id] || ''}
            />
          )
        })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDialogClose}
        >
          {buttonTextCancel}
        </Button>
        <Button variant="contained" onClick={handleSubmit} color="primary">
          {buttonTextSubmit}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReminderForm
