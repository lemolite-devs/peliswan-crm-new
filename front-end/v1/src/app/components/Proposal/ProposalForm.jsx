import React from 'react'
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  FormHelperText
} from '@mui/material'
import { Formik, Form, Field } from 'formik'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import * as Yup from 'yup'
import moment from 'moment'
import { UploadFile } from '@mui/icons-material'

import AuthContext from 'app/contexts/JWTAuthContext'
import { useContext } from 'react'
import { useState, useEffect } from 'react'

// Validation schema for the form
const ProposalSchema = Yup.object().shape({
  proposalTo: Yup.string()
    .required('Proposal To is required')
    .matches(
      /^(?=.*[A-Za-z])(?=.*[0-9]).+$/,
      'ProposalTo must contain letters and cannot be only numbers'
    )
    .min(2, 'Proposal To must be at least 2 characters')
    .max(10, 'Proposal To must be at most 50 characters'),
  subject: Yup.string()
    .required('Subject is required')
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject must be at most 50 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*[0-9]).+$/,
      'Subject must contain letters and cannot be only numbers'
    ),
  relatedTo: Yup.string().required('Related field is required'),
  date: Yup.date()
    .required('Date is required')
    .min(new Date('1900-01-01'), 'Year must be after 1900')
    .max(new Date('2100-12-31'), 'Year must be before 2100')
    .test('valid-year', 'Year must be 4 digits', function (value) {
      if (!value) return true // Skip validation if no date is entered
      const year = value.getFullYear().toString()
      return year.length === 4
    }),
  mobileNumber: Yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  state: Yup.string().required('State is required'),
  city: Yup.string().required('City is required')
})

const ProposalForm = ({
  editMode,
  handleClose,
  handleSubmit,
  initialValues = {}
}) => {
  const [fileName, setFileName] = React.useState('')
  const { states, stateCityMap } = useContext(AuthContext)
  const [localCities, setLocalCities] = useState([])

  // Update the initial values based on the data passed from ProposalList
  const initialProposalValues = {
    proposalTo: initialValues.proposalTo || '',
    subject: initialValues.subject || '',
    relatedTo: initialValues.relatedTo || '',
    date: initialValues.date
      ? moment(initialValues.date).format('YYYY-MM-DD')
      : '',
    mobileNumber: initialValues.mobileNumber || '',
    state: initialValues.state || '',
    city: initialValues.city || '',
    upload: null,
    UploadFileName: initialValues?.uploadedFile?.filename || ''
  }

  const handleFormSubmit = (values, { resetForm }) => {
    const formData = new FormData()

    // Append form fields to formData
    formData.append('proposalTo', values.proposalTo)
    formData.append('subject', values.subject)
    formData.append('relatedTo', values.relatedTo)
    formData.append('date', values.date)
    formData.append('mobileNumber', values.mobileNumber)
    formData.append('state', values.state)
    formData.append('city', values.city)

    // Append the file (if any)
    if (values.upload) {
      formData.append('upload', values.upload)
    }

    // Call the handleSubmit function passed from ProposalList
    handleSubmit(formData)

    resetForm()
    handleClose()
  }

  useEffect(() => {
    if (stateCityMap[initialValues.state]) {
      setLocalCities(stateCityMap[initialValues.state])
    }
    if (initialValues?.uploadedFile?.filename) {
      setFileName(initialValues.uploadedFile.filename)
    }
  }, [initialValues.state, initialValues.uploadedFile, stateCityMap])

  return (
    <>
      <DialogTitle>{editMode ? 'Edit Proposal' : 'New Proposal'}</DialogTitle>
      <DialogContent>
        <Formik
          initialValues={initialProposalValues}
          validationSchema={ProposalSchema}
          onSubmit={handleFormSubmit}
        >
          {({ errors, touched, setFieldValue, values }) => (
            <Form id="proposal-form">
              <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 2 }}>
                <Field
                  name="proposalTo"
                  as={TextField}
                  label="Proposal To"
                  fullWidth
                  error={touched.proposalTo && !!errors.proposalTo}
                  helperText={touched.proposalTo && errors.proposalTo}
                  onBlur={(e) =>
                    setFieldValue('proposalTo', e.target.value.trim())
                  }
                />
                <Field
                  name="subject"
                  as={TextField}
                  label="Subject"
                  fullWidth
                  error={touched.subject && !!errors.subject}
                  helperText={touched.subject && errors.subject}
                  onBlur={(e) =>
                    setFieldValue('subject', e.target.value.trim())
                  }
                />

                <FormControl
                  fullWidth
                  error={touched.relatedTo && !!errors.relatedTo}
                >
                  <InputLabel>Related (Lead/Customer)</InputLabel>
                  <Field
                    name="relatedTo"
                    as={Select}
                    label="Related (Lead/Customer)"
                    fullWidth
                  >
                    <MenuItem value="Lead">Lead</MenuItem>
                    <MenuItem value="Customer">Customer</MenuItem>
                  </Field>
                  {touched.relatedTo && errors.relatedTo && (
                    <FormHelperText>{errors.relatedTo}</FormHelperText>
                  )}
                </FormControl>

                <Field
                  name="date"
                  as={TextField}
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={touched.date && !!errors.date}
                  helperText={touched.date && errors.date}
                />

                <Field
                  name="mobileNumber"
                  as={TextField}
                  label="Mobile Number"
                  fullWidth
                  error={touched.mobileNumber && !!errors.mobileNumber}
                  helperText={touched.mobileNumber && errors.mobileNumber}
                  onBlur={(e) =>
                    setFieldValue('mobileNumber', e.target.value.trim())
                  }
                />

                <FormControl
                  fullWidth
                  margin="dense"
                  error={touched.state && !!errors.state}
                >
                  <InputLabel id="state-label">State</InputLabel>
                  <Field
                    name="state"
                    as={Select}
                    labelId="state-label"
                    id="state"
                    value={values.state}
                    onChange={(e) => {
                      setFieldValue('state', e.target.value)
                      setFieldValue('city', '')
                      setLocalCities(stateCityMap[e.target.value] || [])
                    }}
                    label="State"
                  >
                    {states.length > 0 ? (
                      states.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">
                        <em>No States Available</em>
                      </MenuItem>
                    )}
                  </Field>
                  {touched.state && errors.state && (
                    <FormHelperText>{errors.state}</FormHelperText>
                  )}
                </FormControl>

                <FormControl
                  fullWidth
                  margin="dense"
                  error={touched.city && !!errors.city}
                >
                  <InputLabel id="city-label">City</InputLabel>
                  <Field
                    name="city"
                    as={Select}
                    labelId="city-label"
                    id="city"
                    value={values.city}
                    label="City"
                  >
                    {localCities.length > 0 ? (
                      localCities.map((city) => (
                        <MenuItem key={city} value={city}>
                          {city}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">
                        <em>No City Available</em>
                      </MenuItem>
                    )}
                  </Field>
                  {touched.city && errors.city && (
                    <FormHelperText>{errors.city}</FormHelperText>
                  )}
                </FormControl>

                {/* File Upload */}
                <Box display="flex" alignItems="center" gap={2}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Proposal
                    <input
                      type="file"
                      hidden
                      onChange={(event) => {
                        setFieldValue('upload', event.currentTarget.files[0])
                        setFileName(event.currentTarget.files[0]?.name || '')
                      }}
                    />
                  </Button>

                  {/* Show the filename when there's one */}
                  {fileName && (
                    <span style={{ fontStyle: 'italic', color: '#555' }}>
                      {fileName}
                    </span>
                  )}
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="contained">
          Cancel
        </Button>
        <Button
          type="submit"
          form="proposal-form"
          color="primary"
          variant="contained"
        >
          {editMode ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </>
  )
}

export default ProposalForm
