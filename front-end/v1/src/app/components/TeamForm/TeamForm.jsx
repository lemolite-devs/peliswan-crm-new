import React, { useState, useEffect } from 'react'
import { Formik, Form, Field } from 'formik'
import {
  TextField,
  MenuItem,
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material'
import * as Yup from 'yup'
import axiosInstance from 'axiosInstance'
import { useNavigate } from 'react-router-dom'

// Define validation schema
const validationSchema = Yup.object({
  target: Yup.number()
    .required('Target is required')
    .min(0, 'Target must be positive'),
  quantity: Yup.string().required('Quantity is required')
})

// Month and Year dropdown options
const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const years = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - 5 + i
) // Create year options dynamically from current year

const TeamForm = ({
  onClose,
  team,
  teamId,
  salesTarget,
  setSalesTarget,
  states,
  setTrackIsSubmited,
  trackIsSubmited
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // Default to current month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Default to current year
  const [stateSelect, setSelectState] = useState(null)
  const navigate = useNavigate()

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Function to get current month and year (updated to use dropdown values)
  const getCurrentMonthYear = () => {
    return { currentMonth: selectedMonth, currentYear: selectedYear }
  }

  // Fetch sales target for the selected month when the modal opens
  useEffect(() => {
    const fetchSalesTarget = async () => {
      const { currentMonth, currentYear } = getCurrentMonthYear()

      try {
        const response = await axiosInstance.get(
          `/api/sales-targets/${teamId}?month=${currentMonth}&year=${currentYear}`
        )
        if (response.data) {
          setSalesTarget(response.data) // Prefill with existing data

          setIsEditMode(true)
        } else {
          setSalesTarget(null) // No existing target, empty form
          setIsEditMode(false)
        }
      } catch (error) {
        console.error('Error fetching sales target:', error)
      } finally {
        setTrackIsSubmited(true)
      }
    }

    fetchSalesTarget()
  }, [teamId, selectedMonth, selectedYear, setSalesTarget, trackIsSubmited])

  const handleSubmit = async (values, { setSubmitting }) => {
    const { target, quantity, month, year, state } = values

    try {
      // Update the existing target
      await axiosInstance.put(`/api/sales-targets/${teamId}`, {
        salesExecutiveId: teamId,
        targetQuantity: target,
        unit: quantity,
        state: stateSelect,
        month,
        year
      })
      setTrackIsSubmited(true)
      setSubmitting(false)
      onClose() // Close modal after submission
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitting(false)
    } finally {
      setTrackIsSubmited(false)
    }
  }

  const handleButtonClick = () => {
    navigate(`/details-page/${teamId}`, {
      state: {
        team,
        salesTarget,
        month: selectedMonth,
        year: selectedYear
      }
    })
  }

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
        <Tab label={isEditMode ? 'Edit Sales Target' : 'Add Sales Target'} />
      </Tabs>

      {/* Form tab */}
      {activeTab === 0 && (
        <Formik
          initialValues={{
            target: salesTarget?.targetQuantity || '',
            quantity: salesTarget?.unit || '',
            state: salesTarget?.state || stateSelect,
            month: selectedMonth,
            year: selectedYear
          }}
          validationSchema={validationSchema}
          enableReinitialize={true} // Reinitialize form when salesTarget or month/year changes
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" component="h2">
                    {team.toUpperCase()}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleButtonClick}
                  >
                    Orders
                  </Button>
                </Box>
                {/* Month and Year Dropdowns in one row */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field
                    as={TextField}
                    select
                    label="Month"
                    name="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    error={touched.month && Boolean(errors.month)}
                    helperText={touched.month && errors.month}
                    fullWidth // Ensure the dropdown takes the full width available
                  >
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Field>

                  <Field
                    as={TextField}
                    select
                    label="Year"
                    name="year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    error={touched.year && Boolean(errors.year)}
                    helperText={touched.year && errors.year}
                    fullWidth // Ensure the dropdown takes the full width available
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Field>
                </Box>

                {/* <Autocomplete
                  options={states}
                  value={
                    salesTarget?.state ? salesTarget?.state : values?.state
                  }
                  onChange={(event, newValue) => {
                    setSelectState(newValue)
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                /> */}

                {/* Target Field */}
                <Field
                  as={TextField}
                  label="Target"
                  name="target"
                  type="number"
                  value={values.target}
                  error={touched.target && Boolean(errors.target)}
                  helperText={touched.target && errors.target}
                />

                {/* Quantity Dropdown */}
                <Field
                  as={TextField}
                  select
                  label="Quantity"
                  name="quantity"
                  value={values.quantity}
                  error={touched.quantity && Boolean(errors.quantity)}
                  helperText={touched.quantity && errors.quantity}
                >
                  <MenuItem value="KL">KL</MenuItem>
                  <MenuItem value="MTS">MTS</MenuItem>
                </Field>

                {/* Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      )}
    </Box>
  )
}

export default TeamForm
