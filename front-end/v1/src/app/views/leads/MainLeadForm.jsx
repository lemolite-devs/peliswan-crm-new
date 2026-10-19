import React, { useContext, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  FormHelperText,
  Grid,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Radio
} from '@mui/material'
import { styled } from '@mui/system'
import ReminderForm from './RemianderForm'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import axiosInstance from 'axiosInstance'
import { useEffect } from 'react'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'
import { HandleError } from 'app/utils/handleError'
import {
  COUNTRY_NAMES,
  DIAL_CODES,
  DEFAULT_COUNTRY,
  DEFAULT_DIAL_CODE,
  SUPPORTED_COUNTRIES,
  getCountryConfig
} from 'app/utils/constant'
import InputTextField from 'app/components/InputFields/InputTextField'
import moment from 'moment-timezone'
import AuthContext from 'app/contexts/JWTAuthContext'
import GstDetails from './GstDetails'
import ShippingAndBilling from './ShippingAndBilling'

const StyledTable = styled(Table)(({ theme }) => ({
  whiteSpace: 'pre',
  '& thead': {
    '& tr': { '& th': { paddingLeft: 0, paddingRight: 0 } }
  },
  '& tbody': {
    '& tr': { '& td': { paddingLeft: 0, textTransform: 'capitalize' } }
  }
}))

const TabsContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%'

  // background:"red"
})

const TabContentContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1
})

const StyledTabs = styled(Tabs)({
  flexShrink: 0,
  position: 'sticky',
  top: '0px',
  zIndex: 2,
  padding: '8px',
  background: '#fff',
  paddingLeft: 0,
  paddingRight: 0
})

const TabPanel = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflowY: 'auto',
  paddingLeft: 0,
  paddingRight: 0
}))

const MainLeadForm = ({
  title,
  buttonTextOpen,
  buttonTextSubmit,
  handleEdit,
  handleAdd,
  dropdownOptions,
  initialValues,
  isModalOpen,
  getLeads,
  loading,
  editId,
  resetEdit,
  intialLead,
  states,
  stateCityMap,
  allCities,
  handleCloseModal,
  setActiveTab,
  activeTab,
  gstDetailsData,
  setGstDetailsData,
  isCallTrue,
  setIsCallTrue,
  isCall
}) => {
  const [tableData, setTableData] = useState([])
  const [options, setOptions] = useState([])
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false)
  const [isUpdateReminderOpen, setIsUpdateReminderOpen] = useState(false)
  const [editReminder, setEditReminder] = useState(null)
  const [reminderTitle, setReminderTitle] = useState('Add Reminder')
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [localCities, setLocalCities] = useState([])
  const { definitions, countries, countryStateMap } = useContext(AuthContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [shippingAndBilling, setShippingAndBilling] = useState(null)
  const [validatedNumbers, setValidatedNumbers] = useState({})

  const validationSchema = Yup.object({
    customerName: Yup.string()
      .min(2, 'Name must contain at least 2 letters')
      .max(100, 'Name must contain at most 100 characters')
      .required('Name is required'),
    companyName: Yup.array().of(
      Yup.string()
        .min(3, ' company name must contain at least 3 characters')
        .max(100, ' company name must contain at most 100 characters')
    ),
    // .required('At least one company name is required'),
    country: Yup.string()
      .oneOf(COUNTRY_NAMES, 'Select a valid country')
      .required('Country is required'),
    phoneCountryCode: Yup.string()
      .oneOf(DIAL_CODES, 'Select a valid country code')
      .required('Country code is required'),
    mobileNumber: Yup.array()
      .of(
        Yup.string()
          .required('Mobile no. is required')
          .matches(/^[0-9]{10}$/, 'Mobile no. must be 10 digits')
          .test(
            'unique-mobile',
            'Mobile number already exists',
            async function (value) {
              try {
                if (!value || value.length !== 10) return true

                // Formik passes the whole form as Yup context, so the dial code
                // scopes the check: the same digits under +91 and +977 are
                // different phone numbers.
                const dialCode =
                  this.options?.context?.phoneCountryCode || DEFAULT_DIAL_CODE

                // Check cache first
                const cacheKey = `${dialCode}-${value}-${editId || ''}`
                if (validatedNumbers[cacheKey] !== undefined) {
                  return validatedNumbers[cacheKey]
                }

                // Make API call if not in cache
                const response = await axiosInstance.get(
                  `/api/leads/exists-by-mobile?mobileNumbers=${value}&leadId=${editId || ''}&phoneCountryCode=${encodeURIComponent(dialCode)}`
                )

                // Cache the result
                setValidatedNumbers((prev) => ({
                  ...prev,
                  [cacheKey]: response.status === 200
                }))

                return response.status === 200
              } catch (error) {
                if (error.response?.status === 400) {
                  const addedBy =
                    error.response.data.existingLeads?.[0]?.addedBy
                  throw this.createError({
                    message: `Mobile number already added by ${addedBy || 'another user'}`
                  })
                }
                return true
              }
            }
          )
      )
      .min(1, 'At least one mobile number is required'),
    // .required('At least one mobile number is required'),
    email: Yup.string().email('Invalid email format').notRequired(),
    state: Yup.string().required('State is required'),
    city: Yup.string().notRequired(),
    // India's PIN code is 6 digits, Nepal's postal code is 5.
    zipCode: Yup.string()
      .when('country', ([country], schema) => {
        const { zipLength } = getCountryConfig(country)
        return schema.matches(
          new RegExp(`^[0-9]{${zipLength}}$`),
          `Zip Code must be ${zipLength} digits`
        )
      })
      .notRequired(),
    status: Yup.string().required('Status is required'),
    representative: Yup.string().required('Representative is required'),
    inquiries: Yup.string().required('Inquiries is required'),
    products: Yup.array()
      .min(1, 'At least one product is required')
      .max(10, 'A maximum of 10 products can be selected'),
    competitorName: Yup.string().notRequired(),
    competitorRate: Yup.number()
      .transform((value, originalValue) =>
        originalValue === '' || originalValue == null ? undefined : value
      )
      .min(0, 'Rate cannot be negative')
      .notRequired(),
    remark: Yup.string().required('Remark is required'),
    quantity: Yup.string().required('Quantity is required'),
    unit: Yup.string().required('Unit is required'),
    meeting: Yup.boolean().notRequired(),
    meetingType: Yup.string().notRequired(),
    requestSample: Yup.boolean().notRequired(),
    visitPlant: Yup.boolean().notRequired(),
    visitOffice: Yup.boolean().notRequired(),
    deliveryDestination: Yup.array().notRequired()
  })
  const formik = useFormik({
    initialValues: initialValues,
    validationSchema,
    onSubmit: async (values) => {
      const finalValue = {
        ...values,
        products: values.products.map((i) => i.key),
        deliveryDestination: values?.deliveryDestination.map((i) => i.value),
        competitorRate:
          values.competitorRate === '' || values.competitorRate == null
            ? null
            : Number(values.competitorRate)
      }

      if (editId) {
        handleEdit(finalValue, formik)
      } else {
        handleAdd(finalValue, formik)
        setActiveTab(1)
      }
    }
  })

  const baseDateToUtcIso = (baseDateStr) =>
    moment.tz(baseDateStr, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day').utc().format()

  const handleEditReminder = async (editData) => {
    try {
      const utcTime = baseDateToUtcIso(editData.baseDate)

      const apiData = {
        dueDate: utcTime,
        baseDate: editData.baseDate,
        message: editData.message
      }

      await axiosInstance.put(
        `/api/leads/${editId}/reminder/${editData._id}`,
        apiData
      )
      getLeadById()
      setIsUpdateReminderOpen(false)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  const handleDelete = async (reminderId) => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this entry?'
    )

    if (isConfirmed) {
      try {
        const response = await axiosInstance.delete(
          `/api/leads/${editId}/reminder/${reminderId}`
        )

        await getLeadById()
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
        console.error('Error deleting reminder:', error)
      }
    }
  }

  const handleRemainderSubmit = async (formData, resetForm) => {
    const { baseDate, message } = formData
    const utcTime = baseDateToUtcIso(baseDate)

    const apiData = {
      dueDate: utcTime,
      baseDate,
      message
    }

    try {
      await axiosInstance.post(`/api/leads/${editId}/reminder`, apiData)
      await getLeadById()
      setIsAddReminderOpen(false)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/api/items/lookUps')
        const data = response.data.items || []
        setOptions(data)
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleAutocompleteChange = (field, newValue) => {
    formik.setFieldValue(field, newValue)
  }

  const getLeadById = async () => {
    try {
      const response = await axiosInstance.get(`/api/leads/${editId}`)

      if (response.status === 200) {
        const lead = response.data.lead
        const leadProducts = lead.products || []
        const leadDestination = lead?.deliveryDestination || []

        const filteredProducts = options.filter((item) =>
          leadProducts.some((product) => product._id === item.key)
        )

        const filteredDestinations = allCities.filter((item) =>
          leadDestination.includes(item.value)
        )
        setGstDetailsData(lead.gstDetails)
        setShippingAndBilling(lead.addresses)
        formik.setValues({
          customerName: lead.customerName,
          companyName: lead?.companyName?.length > 0 ? lead.companyName : [''],
          mobileNumber: lead.mobileNumber,
          email: lead.email,
          status: lead.status,
          // Leads saved before countries existed are Indian.
          country: lead.country || DEFAULT_COUNTRY,
          phoneCountryCode:
            lead.phoneCountryCode ||
            getCountryConfig(lead.country).dialCode ||
            DEFAULT_DIAL_CODE,
          state: lead.state,
          city: lead.city,
          products: filteredProducts,
          zipCode: lead.zipCode,
          representative: lead.representative,
          inquiries: lead.inquiries,
          competitorName: lead.competitorName,
          competitorRate: lead.competitorRate ?? '',
          remark: lead.remark,
          quantity: lead.quantity,
          unit: lead.unit,
          comments: lead.comments,
          meeting: lead.meeting,
          meetingType: lead.meetingType,
          requestSample: lead.requestSample,
          visitPlant: lead.visitPlant,
          visitOffice: lead.visitOffice,
          deliveryDestination: filteredDestinations
        })

        const formattedReminders = lead.reminders.map((r) => {
          const indianTime = moment.tz(r.dueDate, 'Asia/Kolkata')
          return {
            dueDate: indianTime.format('YYYY-MM-DD'), // Format date in Indian timezone
            baseDate: r.baseDate || indianTime.format('YYYY-MM-DD'), // original date
            time: indianTime.format('HH:mm'), // Format time in Indian timezone
            message: r.message,
            _id: r._id
          }
        })

        setTableData(formattedReminders)
      }
    } catch (err) {
      HandleError(err, showSnackbar, navigate)
      console.error('Error fetching lead details:', err)
    }
  }

  useEffect(() => {
    if (editId) {
      getLeadById(editId)
    }
  }, [editId])

  const handleCloseReminderDialog = () => {
    setIsAddReminderOpen(false)
    setIsUpdateReminderOpen(false)
    setEditReminder(null)
  }

  const handleAddReminderOpen = () => {
    setReminderTitle('Add Reminder')
    setIsAddReminderOpen(true)
  }

  const handleUpdateClick = (reminder) => {
    setEditReminder(reminder)
    setReminderTitle('Update Reminder')
    setIsUpdateReminderOpen(true)
  }

  // States/provinces available for the selected country. Falls back to the
  // full list so the dropdown still works if the country data hasn't loaded.
  const localStates = useMemo(() => {
    const scoped = countryStateMap?.[formik.values.country]
    if (scoped?.length) return scoped
    return formik.values.country === DEFAULT_COUNTRY ? states : []
  }, [countryStateMap, formik.values.country, states])

  useEffect(() => {
    if (formik.values.state && stateCityMap[formik.values.state]) {
      if (!editId) {
        formik.setFieldValue('city', '')
      }
      setLocalCities(stateCityMap[formik.values.state])
    } else {
      formik.setFieldValue('city', '')
      setLocalCities([])
    }
  }, [formik.values.state, stateCityMap])

  // Changing country invalidates the state/city beneath it, and moves the
  // phone code to that country's dial code.
  const handleCountryChange = (nextCountry) => {
    if (!nextCountry || nextCountry === formik.values.country) return

    formik.setFieldValue('country', nextCountry)
    formik.setFieldValue(
      'phoneCountryCode',
      getCountryConfig(nextCountry).dialCode
    )
    formik.setFieldValue('state', '')
    formik.setFieldValue('city', '')
    formik.setFieldValue('zipCode', '')
  }

  // Custom styled MenuItem to include background color, border radius, and adjusted width
  const ColoredMenuItem = styled(MenuItem)(({ color }) => ({
    color: color
  }))

  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState('')

  useEffect(() => {
    if (editId) {
      fetchActvities()
    }
  }, [editId])

  const fetchActvities = async () => {
    try {
      const response = await axiosInstance.get(`/api/leads/${editId}/activity`)
      setActivities(response.data)
    } catch (error) {
      console.error('Failed to fetch acitivty', error)
    }
  }

  const handleActivity = async (event) => {
    event.preventDefault()
    try {
      const response = await axiosInstance.post(
        `/api/leads/${editId}/activity`,
        {
          leadId: editId,
          description: newActivity,
          isCallTrue: isCallTrue
        }
      )
      setActivities((prevActivities) => [...prevActivities, response.data])
      setNewActivity('')
      setIsCallTrue(false)
      fetchActvities()
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Failed to add activity', error)
    }
  }
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleActivity(event)
    }
  }

  return (
    <div>
      <Dialog
        open={isModalOpen}
        onClose={() => {
          if (editId) {
            formik.resetForm(intialLead)
            resetEdit()
            setTableData([])
          }

          handleCloseModal()
          setActiveTab(0)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}
        >
          <TabsContainer>
            <StyledTabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              aria-label="form tabs"
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              allowScrollButtonsMobile={true}
              sx={{
                justifyContent: 'flex-start',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <Tab label="Main Form" />
              <Tab label="Reminder" />
              <Tab label="Shipping & Billing Address" />
              <Tab label="GST DETAILS" />
              {editId && <Tab label="Activity Log" />}
            </StyledTabs>
            <TabContentContainer>
              <TabPanel>
                {activeTab === 0 && (
                  <form onSubmit={formik.handleSubmit}>
                    <InputTextField
                      id="customerName"
                      name="customerName"
                      label="Name"
                      formik={formik}
                      required={true}
                    />
                    <Box>
                      {formik.values.companyName.map((name, index) => (
                        <Box
                          key={index}
                          display="flex"
                          alignItems="center"
                          mb={1}
                        >
                          <Box style={{ flex: 1 }}>
                            <InputTextField
                              id={`companyName-${index}`}
                              name={`companyName[${index}]`}
                              label={`Company Name ${index + 1}`}
                              value={formik.values.companyName[index]}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur} // Capture blur events for validation
                              required={true}
                              formik={formik}
                            />
                            {/* Error message for this field */}
                            {formik.errors.companyName &&
                              formik.touched.companyName &&
                              formik.touched.companyName[index] && (
                                <Typography
                                  variant="caption" // Makes text smaller
                                  color="error"
                                  style={{ marginTop: '4px', display: 'block' }} // Adjust spacing
                                >
                                  {formik.errors.companyName[index]}
                                </Typography>
                              )}
                          </Box>

                          <Box display="flex" alignItems="center" ml={2}>
                            {index === 0 && (
                              <Button
                                variant="outlined"
                                size="medium"
                                onClick={() =>
                                  formik.setFieldValue('companyName', [
                                    ...formik.values.companyName,
                                    '' // Add a new empty field
                                  ])
                                }
                                style={{ marginRight: '10px' }}
                              >
                                +
                              </Button>
                            )}
                            {index > 0 && (
                              <Button
                                variant="outlined"
                                size="medium"
                                color="error"
                                onClick={() => {
                                  const updatedNames =
                                    formik.values.companyName.filter(
                                      (_, i) => i !== index
                                    )
                                  formik.setFieldValue(
                                    'companyName',
                                    updatedNames
                                  )
                                }}
                                style={{ marginLeft: '10px' }}
                              >
                                -
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ))}

                      {/* General error message for the entire array */}
                      {formik.errors.companyName &&
                        typeof formik.errors.companyName === 'string' && (
                          <Typography
                            variant="caption"
                            color="error"
                            style={{ marginTop: '8px' }}
                          >
                            {formik.errors.companyName}
                          </Typography>
                        )}
                    </Box>

                    {/* <InputTextField
                      id="mobileNumber"
                      name="mobileNumber"
                      label="Mobile no."
                      formik={formik}
                      required={true}
                    /> */}

                    <Box>
                      {formik.values.mobileNumber.map((name, index) => (
                        <Box key={index} mb={1}>
                          <Box display="flex" alignItems="center">
                            {/* One dial code per lead: the selector sits beside
                                the first number, and the rest align under it. */}
                            {index === 0 ? (
                              <FormControl
                                margin="dense"
                                sx={{ width: 150, mr: 2, flexShrink: 0 }}
                              >
                                <InputLabel id="phone-country-code-label">
                                  Country Code
                                </InputLabel>
                                <Select
                                  labelId="phone-country-code-label"
                                  id="phoneCountryCode"
                                  name="phoneCountryCode"
                                  label="Country Code"
                                  value={
                                    formik.values.phoneCountryCode ||
                                    DEFAULT_DIAL_CODE
                                  }
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.phoneCountryCode &&
                                    Boolean(formik.errors.phoneCountryCode)
                                  }
                                >
                                  {SUPPORTED_COUNTRIES.map((country) => (
                                    <MenuItem
                                      key={country.dialCode}
                                      value={country.dialCode}
                                    >
                                      {`${country.dialCode} (${country.name})`}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {formik.touched.phoneCountryCode &&
                                  formik.errors.phoneCountryCode && (
                                    <FormHelperText error>
                                      {formik.errors.phoneCountryCode}
                                    </FormHelperText>
                                  )}
                              </FormControl>
                            ) : (
                              <Box sx={{ width: 150, mr: 2, flexShrink: 0 }} />
                            )}

                            <Box style={{ flex: 1 }}>
                              <InputTextField
                                id={`mobileNumber-${index}`}
                                name={`mobileNumber[${index}]`}
                                label={`Mobile Number ${index + 1}`}
                                value={formik.values.mobileNumber[index]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur} // Ensure blur events are captured
                                required={true}
                                formik={formik}
                              />
                            </Box>

                            <Box display="flex" alignItems="center" ml={2}>
                              {index === 0 && (
                                <Button
                                  variant="outlined"
                                  size="medium"
                                  onClick={() =>
                                    formik.setFieldValue('mobileNumber', [
                                      ...formik.values.mobileNumber,
                                      ''
                                    ])
                                  }
                                  style={{ marginRight: '10px' }}
                                >
                                  +
                                </Button>
                              )}
                              {index > 0 && (
                                <Button
                                  variant="outlined"
                                  size="medium"
                                  color="error"
                                  onClick={() => {
                                    const updatedNames =
                                      formik.values.mobileNumber.filter(
                                        (_, i) => i !== index
                                      )
                                    formik.setFieldValue(
                                      'mobileNumber',
                                      updatedNames
                                    )
                                  }}
                                  style={{ marginLeft: '10px' }}
                                >
                                  -
                                </Button>
                              )}
                            </Box>
                          </Box>

                          {/* Outside the flex row so a validation message can't
                              knock the code selector out of alignment. */}
                          {formik.errors.mobileNumber &&
                            formik.touched.mobileNumber &&
                            formik.touched.mobileNumber[index] && (
                              <Typography
                                variant="caption" // Makes text smaller
                                color="error"
                                // ml clears the code selector so the message
                                // lines up under the number field
                                sx={{ display: 'block', mt: '4px', ml: '166px' }}
                              >
                                {formik.errors.mobileNumber[index]}
                              </Typography>
                            )}
                        </Box>
                      ))}

                      {/* General error message for the entire mobileNumber array */}
                      {formik.errors.mobileNumber &&
                        typeof formik.errors.mobileNumber === 'string' && (
                          <Typography
                            variant="caption"
                            color="error"
                            style={{ marginTop: '8px' }}
                          >
                            {formik.errors.mobileNumber}
                          </Typography>
                        )}
                    </Box>

                    <InputTextField
                      id="email"
                      name="email"
                      label="Email Address"
                      formik={formik}
                      required={true}
                    />

                    <Box mt={1} mb={1}>
                      <Grid
                        container
                        spacing={2} // Default spacing
                      >
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth margin="dense">
                            <Autocomplete
                              id="country-select"
                              options={countries || COUNTRY_NAMES}
                              value={formik.values.country || DEFAULT_COUNTRY}
                              disableClearable
                              onChange={(event, newValue) =>
                                handleCountryChange(newValue)
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Country"
                                  error={
                                    formik.touched.country &&
                                    Boolean(formik.errors.country)
                                  }
                                  helperText={
                                    formik.touched.country &&
                                    formik.errors.country
                                  }
                                />
                              )}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth margin="dense">
                            <Autocomplete
                              id="state-select"
                              options={localStates}
                              value={formik.values.state}
                              onChange={(event, newValue) =>
                                formik.setFieldValue('state', newValue || '')
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={
                                    formik.values.country === 'Nepal'
                                      ? 'Province'
                                      : 'State'
                                  }
                                  error={
                                    formik.touched.state &&
                                    Boolean(formik.errors.state)
                                  }
                                  helperText={
                                    formik.touched.state && formik.errors.state
                                  }
                                />
                              )}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth margin="dense">
                            <Autocomplete
                              id="city-select"
                              options={localCities}
                              value={formik.values.city}
                              onChange={(event, newValue) =>
                                formik.setFieldValue('city', newValue || '')
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="City"
                                  error={
                                    formik.touched.city &&
                                    Boolean(formik.errors.city)
                                  }
                                  helperText={
                                    formik.touched.city && formik.errors.city
                                  }
                                />
                              )}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            margin="dense"
                            id="zipCode"
                            label="Zip Code"
                            type="text"
                            fullWidth
                            value={formik.values.zipCode}
                            onChange={formik.handleChange}
                            error={
                              formik.touched.zipCode &&
                              Boolean(formik.errors.zipCode)
                            }
                            helperText={
                              formik.touched.zipCode && formik.errors.zipCode
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>
                    <Box mt={1} mb={1}>
                      <Grid
                        container
                        spacing={2} // Default spacing
                      >
                        {/* Status Field */}
                        <Grid item xs={12} sm={4}>
                          <FormControl
                            fullWidth
                            margin="dense"
                            error={
                              formik.touched.status &&
                              Boolean(formik.errors.status)
                            }
                          >
                            <InputLabel id="status">Status</InputLabel>
                            <Select
                              labelId="status"
                              name="status"
                              value={formik.values.status}
                              onChange={formik.handleChange}
                              label="Status"
                            >
                              {definitions?.values?.map((option) => (
                                <MenuItem key={option.type} value={option.type}>
                                  {option.type}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.status && formik.errors.status && (
                              <FormHelperText>
                                {formik.errors.status}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <FormControl
                            fullWidth
                            margin="dense"
                            error={
                              formik.touched.representative &&
                              Boolean(formik.errors.representative)
                            }
                          >
                            <InputLabel id="representative">
                              Representative
                            </InputLabel>
                            <Select
                              labelId="representative"
                              name="representative"
                              value={formik.values.representative}
                              onChange={formik.handleChange}
                              label="Representative"
                            >
                              {dropdownOptions.representative.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.representative &&
                              formik.errors.representative && (
                                <FormHelperText>
                                  {formik.errors.representative}
                                </FormHelperText>
                              )}
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <FormControl
                            fullWidth
                            margin="dense"
                            error={
                              formik.touched.inquiries &&
                              Boolean(formik.errors.inquiries)
                            }
                          >
                            <InputLabel id="inquiries">Inquiries</InputLabel>
                            <Select
                              labelId="inquiries"
                              name="inquiries"
                              value={formik.values.inquiries}
                              onChange={formik.handleChange}
                              label="inquiries"
                            >
                              {dropdownOptions.inquiries.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.inquiries &&
                              formik.errors.inquiries && (
                                <FormHelperText>
                                  {formik.errors.inquiries}
                                </FormHelperText>
                              )}
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                    <Box mt={1} mb={1}>
                      <Grid
                        container
                        spacing={2} // Default spacing
                      >
                        <Grid item xs={12} sm={4}>
                          <InputTextField
                            id="quantity"
                            name="quantity"
                            label="Quantity"
                            formik={formik}
                            required={true}
                            type="number"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl
                            fullWidth
                            margin="dense"
                            error={
                              formik.touched.unit && Boolean(formik.errors.unit)
                            }
                          >
                            <InputLabel id="unit">Units</InputLabel>
                            <Select
                              labelId="unit"
                              name="unit"
                              value={formik.values.unit}
                              onChange={formik.handleChange}
                              label="Units"
                            >
                              {dropdownOptions.units.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.unit && formik.errors.unit && (
                              <FormHelperText>
                                {formik.errors.unit}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl
                            fullWidth
                            margin="dense"
                            error={
                              formik.touched.remark &&
                              Boolean(formik.errors.remark)
                            }
                          >
                            <InputLabel id="remark">Remark</InputLabel>
                            <Select
                              labelId="remark"
                              name="remark"
                              value={formik.values.remark}
                              onChange={formik.handleChange}
                              label="Remark"
                            >
                              {dropdownOptions.remark.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.remark && formik.errors.remark && (
                              <FormHelperText>
                                {formik.errors.remark}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                    <Autocomplete
                      multiple
                      id="products"
                      options={options}
                      getOptionLabel={(option) => option.value || ''}
                      value={formik.values.products}
                      onChange={(event, newValue) =>
                        handleAutocompleteChange('products', newValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product Name"
                          placeholder="Select multiple products"
                          error={
                            formik.touched.products &&
                            Boolean(formik.errors.products)
                          }
                          helperText={
                            formik.touched.products && formik.errors.products
                          }
                        />
                      )}
                    />

                    <Box mt={1}>
                      <Autocomplete
                        multiple
                        id="deliveryDestination"
                        options={allCities}
                        getOptionLabel={(option) => option.value || ''}
                        value={formik.values?.deliveryDestination}
                        onChange={(event, newValue) =>
                          handleAutocompleteChange(
                            'deliveryDestination',
                            newValue
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Delivery Destination"
                            placeholder="Select multiple destination"
                            error={
                              formik.touched.products &&
                              Boolean(formik.errors?.deliveryDestination)
                            }
                            helperText={
                              formik.touched?.deliveryDestination &&
                              formik.errors?.deliveryDestination
                            }
                          />
                        )}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <InputTextField
                            id="competitorName"
                            name="competitorName"
                            label="Competitor's Name"
                            formik={formik}
                            required={true}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <InputTextField
                            id="competitorRate"
                            name="competitorRate"
                            label="Competitor's Rate"
                            type="number"
                            formik={formik}
                            inputProps={{ min: 0, step: 'any' }}
                          />
                        </Box>
                      </Box>
                      <InputTextField
                        id="comments"
                        name="comments"
                        label="Comments (if any)"
                        rows={2}
                        required={true}
                        formik={formik}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      {isCall ? null : (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isCallTrue}
                              onChange={(e) => setIsCallTrue(e.target.checked)}
                            />
                          }
                          label="Have you call ?"
                        />
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formik.values.meeting}
                              onChange={(e) => {
                                formik.setFieldValue(
                                  'meeting',
                                  e.target.checked
                                )
                                if (!e.target.checked)
                                  formik.setFieldValue('meetingType', '')
                              }}
                            />
                          }
                          label="Meeting"
                        />
                        {formik.values.meeting && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              ml: 2
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Radio
                                  size="small"
                                  checked={
                                    formik.values.meetingType ===
                                    'regularMeeting'
                                  }
                                  onChange={() =>
                                    formik.setFieldValue(
                                      'meetingType',
                                      'regularMeeting'
                                    )
                                  }
                                />
                              }
                              label="Regular Meeting"
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  size="small"
                                  checked={
                                    formik.values.meetingType === 'hotMeeting'
                                  }
                                  onChange={() =>
                                    formik.setFieldValue(
                                      'meetingType',
                                      'hotMeeting'
                                    )
                                  }
                                />
                              }
                              label="Hot Meeting"
                            />
                          </Box>
                        )}
                      </Box>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formik.values.requestSample}
                            onChange={(e) =>
                              formik.setFieldValue(
                                'requestSample',
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Request for sample"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formik.values.visitPlant}
                            onChange={(e) =>
                              formik.setFieldValue(
                                'visitPlant',
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Visit Plant"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formik.values.visitOffice}
                            onChange={(e) =>
                              formik.setFieldValue(
                                'visitOffice',
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Visit Office"
                      />
                    </Box>
                  </form>
                )}
              </TabPanel>
              <TabPanel>
                {activeTab === 1 && (
                  <>
                    {/* Conditional rendering of the message "hello user" */}
                    {!editId && (
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        style={{ marginBottom: '15px' }}
                      >
                        Note: Reminder can be only added after saving the lead
                        information!
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddReminderOpen}
                      style={{ width: '150px' }}
                    >
                      Add Reminder
                    </Button>

                    <ReminderForm
                      title={reminderTitle}
                      buttonTextOpen={reminderTitle}
                      buttonTextSubmit={reminderTitle}
                      editReminder={editReminder}
                      onSubmit={
                        editReminder
                          ? handleEditReminder
                          : handleRemainderSubmit
                      }
                      fields={[
                        {
                          id: 'baseDate',
                          label: 'Due date',
                          type: 'date',
                          required: true
                        },
                        {
                          id: 'message',
                          label: 'Message',
                          type: 'text',
                          required: true
                        }
                      ]}
                      open={isAddReminderOpen || isUpdateReminderOpen}
                      handleClose={handleCloseReminderDialog}
                    />

                    <Box width="100%" overflow="auto">
                      <StyledTable>
                        <TableHead>
                          <TableRow>
                            <TableCell align="center">Due date</TableCell>
                            <TableCell align="center">Notes</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableData?.map((reminder, reminderIndex) => (
                            <TableRow key={reminderIndex}>
                              <TableCell align="center">
                                {moment(
                                  reminder.dueDate || reminder.baseDate
                                ).format('DD-MM-YYYY')}
                              </TableCell>
                              <TableCell align="center">
                                {reminder.message}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  onClick={() => handleUpdateClick(reminder)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDelete(reminder._id)}
                                  sx={{ color: 'red' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </StyledTable>
                    </Box>
                  </>
                )}
              </TabPanel>
              <TabPanel>
                {activeTab === 2 && (
                  <>
                    <ShippingAndBilling
                      states={states}
                      countryStates={localStates}
                      stateCityMap={stateCityMap}
                      allCities={allCities}
                      editId={editId}
                      setLocalCities={setLocalCities}
                      buttonTextSubmit="Save"
                      buttonTextCancel="Cancel"
                      handleCloseModal={handleCloseModal}
                      setShippingAndBilling={setShippingAndBilling}
                      shippingAndBilling={shippingAndBilling}
                      setActiveTab={setActiveTab}
                      companyNames={formik.values.companyName}
                    />
                  </>
                )}
              </TabPanel>
              <TabPanel>
                {activeTab === 3 && (
                  <GstDetails
                    buttonTextSubmit="Save"
                    buttonTextCancel="Cancel"
                    editId={editId}
                    handleCloseModal={handleCloseModal}
                    gstDetailsData={gstDetailsData}
                  />
                )}
              </TabPanel>
              {editId && (
                <TabPanel>
                  {activeTab === 4 && (
                    <>
                      <div style={{ padding: '0', margin: '0' }}>
                        {activities.map((activity, index) => (
                          <React.Fragment key={index}>
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px',
                                borderRadius: '2px',
                                borderLeft: '2px solid #66E066',
                                borderTop: '1px solid #f0f0f0',
                                borderBottom: '1px solid #f0f0f0',
                                borderRight: '1px solid #f0f0f0',
                                marginBottom: '3px',
                                marginLeft: '10px',
                                marginRight: '10px',
                                position: 'relative',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '-7px',
                                  left: '-5px',
                                  width: '10px',
                                  height: '10px',
                                  backgroundColor: 'transparent',
                                  borderRadius: '50%',
                                  border: '2px solid #66E066'
                                }
                              }}
                            >
                              <Avatar
                                alt={activity.user?.name || 'Unknown User'}
                                src={
                                  activity.user?.profileImage || '/user (3).png'
                                }
                                sx={{ marginRight: '10px' }}
                              />

                              {/* Content Section */}
                              <Box sx={{ flexGrow: 1 }}>
                                {/* Time Ago */}
                                <Tooltip
                                  title={moment(activity.createdAt).format(
                                    'MMMM Do YYYY, h:mm:ss A'
                                  )}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#808080' }}
                                  >
                                    {moment(activity.createdAt).fromNow()}
                                  </Typography>
                                </Tooltip>

                                {/* User Name and Message */}
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {activity.user?.name || 'Unknown User'} -{' '}
                                  {activity.description}
                                </Typography>
                              </Box>
                            </Box>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Text Field and Save Button */}
                      <TextField
                        variant="outlined"
                        placeholder="Enter Activity"
                        multiline
                        rows={4}
                        fullWidth
                        value={newActivity}
                        onKeyPress={handleKeyPress}
                        onChange={(e) => setNewActivity(e.target.value)}
                        sx={{
                          marginTop: '10px',
                          padding: '10px',
                          borderRadius: '4px',
                          borderColor: '#e0e0e0'
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '10px',
                          paddingLeft: '10px',
                          paddingRight: '10px'
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isCallTrue}
                              onChange={(e) => setIsCallTrue(e.target.checked)}
                            />
                          }
                          label="Have you call ?"
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{
                            padding: '10px 35px',
                            width: '150px'
                          }}
                          onClick={handleActivity}
                        >
                          Save
                        </Button>
                      </Box>
                    </>
                  )}
                </TabPanel>
              )}
            </TabContentContainer>
          </TabsContainer>
        </DialogContent>
        <DialogActions>
          {activeTab === 0 && (
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleCloseModal()

                  if (editId) {
                    formik.resetForm(intialLead)
                    resetEdit()
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={formik.handleSubmit}
              >
                {loading ? <CircularProgress size={24} /> : buttonTextSubmit}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default MainLeadForm
