import React from 'react'
import {
  Dialog,
  TextField,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  MenuItem,
  CircularProgress // Import CircularProgress for the loader
} from '@mui/material'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'

const validationSchema = Yup.object({
  name: Yup.string()
    .matches(
      /^(?=.*[A-Za-z])[A-Za-z0-9 ]+$/,
      'Name must contain at least one letter and can include numbers and spaces'
    )
    .min(2, 'Name must contain at least 2 letters')
    .required('Name is required'),
  description: Yup.string()
    .matches(
      /^[A-Za-z0-9 ]+$/,
      'Description must contain only letters and numbers'
    )
    .min(6, 'Description must be at least 6 characters')
    .max(500, 'Description can be at most 500 characters')
    .required('Description is required'),
  rate: Yup.number()
    .required('Rate is required')
    .positive('Rate must be a positive number')
    .min(0, 'Rate must be greater than zero'),
  gst: Yup.number()
    .oneOf([18, 12, 5], 'Invalid GST value')
    .required('GST is required'),
  units: Yup.string()
    .oneOf(['KL', 'MTS'], 'Invalid unit')
    .required('Units are required'),
  group: Yup.string()
    .oneOf(
      ['oil', 'solvent', 'glycols', 'aromatics', 'plastic granules'],
      'Invalid group'
    )
    .required('Group is required')
})

const ItemForm = ({ open, handleClose, handleAddItem, initialItem }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {initialItem ? 'Edit Item' : 'Add Item'}
      </DialogTitle>

      <Formik
        initialValues={{
          name: initialItem ? initialItem.name : '',
          description: initialItem ? initialItem.description : '',
          rate: initialItem ? initialItem.rate : '',
          gst: initialItem ? initialItem.gst : 18,
          units: initialItem ? initialItem.units : '',
          group: initialItem ? initialItem.group : ''
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          handleAddItem(values)
          setSubmitting(true) // Set submitting to true when form is being processed
          setTimeout(() => {
            setSubmitting(false) // Simulate async operation
            resetForm()
            handleClose()
          }, 1000) // Simulate a delay
        }}
      >
        {({
          isSubmitting,
          handleChange,
          handleBlur,
          values,
          errors,
          touched
        }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                {initialItem
                  ? 'Edit the item details below.'
                  : 'Please fill out the form to add a new item.'}
              </DialogContentText>

              <TextField
                fullWidth
                autoFocus
                id="name"
                name="name"
                label="Name"
                type="text"
                margin="dense"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                type="text"
                margin="dense"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description && Boolean(errors.description)}
                helperText={touched.description && errors.description}
              />
              <TextField
                fullWidth
                id="rate"
                name="rate"
                label="Rate"
                type="number"
                margin="dense"
                value={values.rate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.rate && Boolean(errors.rate)}
                helperText={touched.rate && errors.rate}
              />
              <TextField
                fullWidth
                id="gst"
                name="gst"
                label="GST"
                select
                margin="dense"
                value={values.gst}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.gst && Boolean(errors.gst)}
                helperText={touched.gst && errors.gst}
              >
                <MenuItem value={18}>18%</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
              </TextField>
              <TextField
                fullWidth
                id="units"
                name="units"
                label="Units"
                select
                margin="dense"
                value={values.units}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.units && Boolean(errors.units)}
                helperText={touched.units && errors.units}
              >
                <MenuItem value="KL">KL</MenuItem>
                <MenuItem value="MTS">MTS</MenuItem>
              </TextField>
              <TextField
                fullWidth
                id="group"
                name="group"
                label="Group"
                select
                margin="dense"
                value={values.group}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.group && Boolean(errors.group)}
                helperText={touched.group && errors.group}
              >
                <MenuItem value="oil">Oil</MenuItem>
                <MenuItem value="solvent">Solvent</MenuItem>
                <MenuItem value="glycols">Glycols</MenuItem>
                <MenuItem value="aromatics">Aromatics</MenuItem>
                <MenuItem value="plastic granules">Plastic Granules</MenuItem>
              </TextField>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} />
                ) : initialItem ? (
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

export default ItemForm
