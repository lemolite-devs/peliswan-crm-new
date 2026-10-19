import {
  Box,
  Button,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormControl,
  Grid,
  Radio
} from '@mui/material'
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useState, useEffect, useContext } from 'react'
import axiosInstance from 'axiosInstance'
import AuthContext from 'app/contexts/JWTAuthContext'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'app/snakebarContext'
import { COUNTRY_NAMES } from 'app/utils/constant'

const FilterComponent = ({
  filter,
  setFilter,
  dropdownOptions,
  states,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  handleFilterChange,
  allCities,
  allSalesExecutives = []
}) => {
  const { stateCityMap, definitions, countries, countryStateMap } =
    useContext(AuthContext)

  const [options, setOptions] = useState([])
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { user } = useContext(AuthContext)

  const resetForm = () => {
    setFilter({
      status: '',
      country: '',
      state: '',
      city: '',
      customerName: '',
      companyName: '',
      mobileNumber: '',
      quantity: '',
      representative: '',
      remark: '',
      inquiries: '',
      products: [],
      meeting: false,
      meetingType: '',
      requestSample: false,
      visitPlant: false,
      visitOffice: false,
      deliveryDestination: [],
      assignedTo: [],
      startDate: '',
      endDate: ''
    })
  }

  const handleAutocompleteChange = (name, newValue) => {
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: newValue
    }))
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

  const getCityOptions = () => {
    if (filter.state && stateCityMap[filter.state]) {
      return stateCityMap[filter.state]
    }
    return []
  }

  // With no country picked, "All" spans every country's states/provinces.
  const getStateOptions = () => {
    if (!filter.country) return states
    return countryStateMap?.[filter.country] || []
  }

  return (
    <Modal
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      aria-labelledby="filter-modal"
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          margin: 'auto',
          padding: 3,
          marginTop: '80px',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: '4px'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            marginBottom: '56px'
          }}
        >
          <TextField
            fullWidth
            margin="normal"
            label="Customer Name"
            name="customerName"
            value={filter.customerName}
            onChange={handleFilterChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Company Name"
            name="companyName"
            style={{ marginTop: '5px' }}
            value={filter.companyName}
            onChange={handleFilterChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Mobile Number"
            name="mobileNumber"
            style={{ marginTop: '5px' }}
            value={filter.mobileNumber}
            onChange={handleFilterChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email Address"
            name="email"
            style={{ marginTop: '5px' }}
            value={filter.email}
            onChange={handleFilterChange}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}>
                <DesktopDatePicker
                  label="From Date"
                  value={filter.startDate ? dayjs(filter.startDate) : null}
                  format="DD-MM-YYYY"
                  maxDate={filter.endDate ? dayjs(filter.endDate) : undefined}
                  onChange={(date) =>
                    setFilter((prev) => ({
                      ...prev,
                      startDate: date ? date.format('YYYY-MM-DD') : ''
                    }))
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: () =>
                        setFilter((prev) => ({ ...prev, startDate: '' }))
                    },
                    textField: { fullWidth: true }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <DesktopDatePicker
                  label="To Date"
                  value={filter.endDate ? dayjs(filter.endDate) : null}
                  format="DD-MM-YYYY"
                  minDate={filter.startDate ? dayjs(filter.startDate) : undefined}
                  onChange={(date) =>
                    setFilter((prev) => ({
                      ...prev,
                      endDate: date ? date.format('YYYY-MM-DD') : ''
                    }))
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: () =>
                        setFilter((prev) => ({ ...prev, endDate: '' }))
                    },
                    textField: { fullWidth: true }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
          <FormControl fullWidth margin="normal" sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              {definitions?.values?.map((option) => (
                <MenuItem key={option.type} value={option.type}>
                  {option.type}
                </MenuItem>
              ))}
              <MenuItem value="Customer">Customer</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mt: -3 }}>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Country</InputLabel>
                <Select
                  name="country"
                  value={filter.country || ''}
                  onChange={handleFilterChange}
                  label="Country"
                >
                  <MenuItem value="">All</MenuItem>
                  {(countries || COUNTRY_NAMES).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>
                  {filter.country === 'Nepal' ? 'Province' : 'State'}
                </InputLabel>
                <Select
                  name="state"
                  value={filter.state}
                  onChange={handleFilterChange}
                  label={filter.country === 'Nepal' ? 'Province' : 'State'}
                >
                  <MenuItem value="">All</MenuItem>
                  {getStateOptions().map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>City</InputLabel>
                <Select
                  name="city"
                  value={filter.city}
                  onChange={handleFilterChange}
                  label="City"
                >
                  {filter.state ? (
                    getCityOptions().map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No cities</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth margin="normal" sx={{ mt: 1 }}>
            <InputLabel>Representative</InputLabel>
            <Select
              name="representative"
              value={filter.representative}
              onChange={handleFilterChange}
              label="Representative"
            >
              <MenuItem value="">All</MenuItem>
              {dropdownOptions.representative.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            id="products"
            options={options}
            getOptionLabel={(option) => option.value || ''}
            renderOption={(props, option) => (
              <li {...props} key={option.key}>
                {option.value}
              </li>
            )}
            value={filter.products}
            sx={{ mt: 1 }}
            onChange={(event, newValue) =>
              handleAutocompleteChange('products', newValue)
            }
            renderInput={(params) => <TextField {...params} label="Products" />}
          />

          {user.role !== 'Sales Executive' && (
            <Autocomplete
              multiple
              id="assignedTo"
              options={allSalesExecutives}
              getOptionLabel={(option) => option.value || ''}
              renderOption={(props, option) => (
                <li {...props} key={option.key}>
                  {option.value}
                </li>
              )}
              value={filter.assignedTo}
              sx={{ mt: 1 }}
              onChange={(event, newValue) =>
                handleAutocompleteChange('assignedTo', newValue)
              }
              renderInput={(params) => (
                <TextField {...params} label="Assigned To" />
              )}
            />
          )}
          <Grid container spacing={2} sx={{ mt: -2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Quantity"
                name="quantity"
                value={filter.quantity}
                onChange={handleFilterChange}
                type="number"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unit"
                  value={filter.unit}
                  onChange={handleFilterChange}
                  label="Unit"
                >
                  <MenuItem value="">All</MenuItem>
                  {dropdownOptions.units.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth margin="normal">
            <InputLabel>Inquiries</InputLabel>
            <Select
              name="inquiries"
              value={filter.inquiries}
              onChange={handleFilterChange}
              label="Inquiries"
            >
              <MenuItem value="">All</MenuItem>
              {dropdownOptions.inquiries.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" sx={{ mt: 1 }}>
            <InputLabel>Remark</InputLabel>
            <Select
              name="remark"
              value={filter.remark}
              onChange={handleFilterChange}
              label="Remark"
            >
              <MenuItem value="">All</MenuItem>
              {dropdownOptions.remark.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            id="deliveryDestination"
            options={allCities}
            getOptionLabel={(option) => option.value || ''}
            renderOption={(props, option) => (
              <li {...props} key={option.key}>
                {option.value}
              </li>
            )}
            value={filter.deliveryDestination}
            sx={{ mt: 1 }}
            onChange={(event, newValue) =>
              handleAutocompleteChange('deliveryDestination', newValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Delivery Destination" />
            )}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="meeting"
                  checked={filter.meeting}
                  onChange={(e) => {
                    handleFilterChange({
                      target: { name: 'meeting', value: e.target.checked }
                    })
                    if (!e.target.checked) {
                      handleFilterChange({
                        target: { name: 'meetingType', value: '' }
                      })
                    }
                  }}
                />
              }
              label="Meeting"
            />
            {filter.meeting && (
              <Box sx={{ display: 'flex', flexDirection: 'row', ml: 3 }}>
                <FormControlLabel
                  control={
                    <Radio
                      size="small"
                      checked={filter.meetingType === ''}
                      onChange={() =>
                        handleFilterChange({
                          target: { name: 'meetingType', value: '' }
                        })
                      }
                    />
                  }
                  label="All"
                />
                <FormControlLabel
                  control={
                    <Radio
                      size="small"
                      checked={filter.meetingType === 'regularMeeting'}
                      onChange={() =>
                        handleFilterChange({
                          target: {
                            name: 'meetingType',
                            value: 'regularMeeting'
                          }
                        })
                      }
                    />
                  }
                  label="Regular Meeting"
                />
                <FormControlLabel
                  control={
                    <Radio
                      size="small"
                      checked={filter.meetingType === 'hotMeeting'}
                      onChange={() =>
                        handleFilterChange({
                          target: { name: 'meetingType', value: 'hotMeeting' }
                        })
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
                name="requestSample"
                checked={filter.requestSample}
                onChange={(e) =>
                  handleFilterChange({
                    target: { name: 'requestSample', value: e.target.checked }
                  })
                }
              />
            }
            label="Request for sample"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="visitPlant"
                checked={filter.visitPlant}
                onChange={(e) =>
                  handleFilterChange({
                    target: { name: 'visitPlant', value: e.target.checked }
                  })
                }
              />
            }
            label="Visit Plant"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="visitOffice"
                checked={filter.visitOffice}
                onChange={(e) =>
                  handleFilterChange({
                    target: { name: 'visitOffice', value: e.target.checked }
                  })
                }
              />
            }
            label="Visit Office"
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            margin: '16px',
            zIndex: 1,
            background: 'white',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={resetForm}
            style={{ marginTop: '10px' }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setIsFilterOpen(false)
              applyFilters()
            }}
            style={{ marginTop: '10px' }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default FilterComponent
