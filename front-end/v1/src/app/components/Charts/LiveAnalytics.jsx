import React, { useState, useEffect } from 'react'
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material'
import { Box, useTheme } from '@mui/system'
import { HandleError } from 'app/utils/handleError'
import BasicLineChartMuix from 'app/views/charts/muix/BasicLineChartMuix'
import axiosInstance from 'axiosInstance'

const LiveAnalytics = ({
  years,
  months,
  states,
  allCities,
  allProducts,
  showSnackbar,
  navigate
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const currantMonth = new Date().getMonth() + 1
  const [loading, setLoading] = useState(false)
  const [liveAnalyticsData, setLiveAnalyticsData] = useState([])
  const [liveAnalyticsfilter, setLiveAnalyticsfilter] = useState({
    year: new Date().getFullYear(),
    month: {
      label:
        months.find((month) => month.value === currantMonth)?.label || null,
      value: currantMonth
    },
    quantity: null,
    state: null,
    city: null,
    product: [{ value: 'All', label: 'All' }] // Initialize as array with 'All' selected
  })

  const getLiveAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/sales/charts', {
        params: {
          ...liveAnalyticsfilter,
          month: liveAnalyticsfilter?.month?.value,
          // Join multiple products with comma or handle according to your API
          product:
            liveAnalyticsfilter?.product?.length > 0
              ? liveAnalyticsfilter.product
                  .filter((p) => p.value !== 'All')
                  .map((p) => p.key)
                  .join(',')
              : null,
          chartType: 'live-analytics'
        }
      })
      setLiveAnalyticsData(response.data?.data)
    } catch (error) {
      setLoading(false)
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching graph data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getLiveAnalyticsData()
  }, [liveAnalyticsfilter])

  const getFieldWidth = () => {
    if (isMobile) return '80%'
    if (isTablet) return '45%'
    return '22%'
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        component="h2"
        sx={{ fontWeight: 'light', color: '#333', mb: 2 }}
      >
        Live Analytics
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        <FormControl sx={{ width: getFieldWidth() }} size="small">
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={liveAnalyticsfilter?.year}
            label="Year"
            onChange={(event) => {
              setLiveAnalyticsfilter((prev) => ({
                ...prev,
                year: event.target.value
              }))
            }}
          >
            {years?.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ width: getFieldWidth() }} size="small">
          <InputLabel id="month-select-label">Month</InputLabel>
          <Select
            labelId="month-select-label"
            value={liveAnalyticsfilter?.month.value}
            label="Month"
            onChange={(event) => {
              const selectedMonth = months.find(
                (month) => month.value === event.target.value
              )
              setLiveAnalyticsfilter((prev) => ({
                ...prev,
                month: {
                  label: selectedMonth ? selectedMonth.label : 'No select',
                  value: selectedMonth ? selectedMonth.value : null
                }
              }))
            }}
          >
            <MenuItem value="">
              <em>No select</em>
            </MenuItem>
            {months?.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          multiple // Add this prop
          size="small"
          options={[{ value: 'All', label: 'All' }, ...allProducts]}
          value={
            liveAnalyticsfilter?.product || [{ value: 'All', label: 'All' }]
          }
          onChange={(event, newValue) => {
            // Handle "All" selection logic
            let updatedValue
            const hasAll = newValue.some((item) => item.value === 'All')
            const hadAll = liveAnalyticsfilter.product?.some(
              (item) => item.value === 'All'
            )

            if (hasAll && !hadAll) {
              // If "All" is newly selected, clear other selections
              updatedValue = [{ value: 'All', label: 'All' }]
            } else if (hasAll && newValue.length > 1) {
              // If "All" is already selected and user selects something else, remove "All"
              updatedValue = newValue.filter((item) => item.value !== 'All')
            } else {
              // Normal case: just update with the new selection
              updatedValue = newValue
            }

            setLiveAnalyticsfilter((prev) => ({
              ...prev,
              product: updatedValue
            }))
          }}
          getOptionLabel={(option) => option?.value || ''}
          renderInput={(params) => (
            <TextField {...params} label="Product" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={['All', 'KL', 'MTS']}
          value={liveAnalyticsfilter?.quantity || 'All'} // Default to null if nothing is selected
          onChange={(event, newValue) => {
            // Set quantity to null if "All" is selected, otherwise set to the selected value
            const quantityValue = newValue === 'All' ? null : newValue
            setLiveAnalyticsfilter((prev) => ({
              ...prev,
              quantity: quantityValue
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Quantity" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={states}
          value={liveAnalyticsfilter?.state}
          onChange={(event, newValue) =>
            setLiveAnalyticsfilter((prev) => ({ ...prev, state: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="State" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={allCities}
          value={liveAnalyticsfilter?.city}
          onChange={(event, newValue) =>
            setLiveAnalyticsfilter((prev) => ({ ...prev, city: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="City" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: isMobile ? '300px' : '450px'
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : !!liveAnalyticsData && liveAnalyticsData.length !== 0 ? (
          <BasicLineChartMuix
            height={isMobile ? 300 : 400}
            width={isMobile ? 600 : 800}
            xAxisData={liveAnalyticsData?.map((data) =>
              data?.label ? data?.label : data?.shortName
            )}
            seriesData={liveAnalyticsData?.map((data) => data?.data)}
            xAxisLabel={liveAnalyticsfilter.month?.value ? 'Days' : 'Years'}
            yAxisLabel="Overall Sales"
          />
        ) : (
          'No data available'
        )}
      </Box>
    </Box>
  )
}

export default LiveAnalytics
