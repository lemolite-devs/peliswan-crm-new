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
import BasicBarChartMuix from 'app/views/charts/muix/BasicBarChartMuix'
import axiosInstance from 'axiosInstance'
import { HandleError } from 'app/utils/handleError'

const SalesRecords = ({
  years,
  months,
  states,
  allCities,
  allProducts,
  allSalesExecutives,
  showSnackbar,
  navigate
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const currantMonth = new Date().getMonth() + 1
  const [loading, setLoading] = useState(false)
  const [overAllSalesData, setOverAllSalesData] = useState([])
  const [salesRecordfilter, setSalesRecordfilter] = useState({
    year: new Date().getFullYear(),
    month: {
      label:
        months.find((month) => month.value === currantMonth)?.label || null,
      value: currantMonth
    },
    state: null,
    city: null,
    product: null,
    executive: null
  })

  const getOverAllSalesData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/sales/charts', {
        params: {
          ...salesRecordfilter,
          executive: salesRecordfilter?.executive?.id,
          month: salesRecordfilter?.month?.value,
          product: salesRecordfilter?.product?.key,
          chartType: 'sales-records'
        }
      })

      setOverAllSalesData(response.data?.data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getOverAllSalesData()
  }, [salesRecordfilter])

  const getFieldWidth = () => {
    if (isMobile) return '100%'
    if (isTablet) return '45%'
    return '22%'
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        component="h2"
        sx={{ fontWeight: 'light', color: '#333', mb: 3 }}
      >
        Sales Record
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <FormControl sx={{ width: getFieldWidth() }} size="small">
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={salesRecordfilter?.year}
            label="Year"
            onChange={(event) => {
              setSalesRecordfilter((prev) => ({
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
            value={salesRecordfilter?.month.value}
            label="Month"
            onChange={(event) => {
              const selectedMonth = months.find(
                (month) => month.value === event.target.value
              )
              setSalesRecordfilter((prev) => ({
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
          size="small"
          options={allProducts}
          value={salesRecordfilter?.product?.value}
          onChange={(event, newValue) =>
            setSalesRecordfilter((prev) => ({ ...prev, product: newValue }))
          }
          getOptionLabel={(option) => option.value}
          renderInput={(params) => (
            <TextField {...params} label="Product" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={allSalesExecutives}
          value={salesRecordfilter?.executive}
          onChange={(event, newValue) =>
            setSalesRecordfilter((prev) => ({
              ...prev,
              executive: newValue
            }))
          }
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label="Executive" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={states}
          value={salesRecordfilter?.state}
          onChange={(event, newValue) =>
            setSalesRecordfilter((prev) => ({ ...prev, state: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="State" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />

        <Autocomplete
          size="small"
          options={allCities}
          value={salesRecordfilter?.city}
          onChange={(event, newValue) =>
            setSalesRecordfilter((prev) => ({ ...prev, city: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="City" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          height: isMobile ? '300px' : '400px'
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : !!overAllSalesData && overAllSalesData.length !== 0 ? (
          <BasicBarChartMuix
            overAllSalesData={overAllSalesData}
            isMonthly={!!salesRecordfilter.month?.value}
            quantityRecordData={null}
            height="100%"
            width="100%"
          />
        ) : (
          'No data available'
        )}
      </Box>
    </Box>
  )
}

export default SalesRecords
