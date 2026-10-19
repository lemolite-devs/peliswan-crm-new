import React, { useState, useEffect } from 'react'
import axiosInstance from 'axiosInstance'
import { HandleError } from 'app/utils/handleError'
import BasicBarChartMuix from 'app/views/charts/muix/BasicBarChartMuix'
import { Box, useTheme } from '@mui/system'
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

const QuantityRecords = ({
  showSnackbar,
  navigate,
  years,
  months,
  allProducts,
  allSalesExecutives,
  allClients
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const currantMonth = new Date().getMonth() + 1
  const [loading, setLoading] = useState(false)
  const [quantityRecordData, setQuantityRecordData] = useState([])

  const [quantityRecordfilter, setQuantityRecordfilter] = useState({
    year: new Date().getFullYear(),
    fromMonth: null,
    toMonth: null,
    state: null,
    city: null,
    quantity: 'KL',
    product: null,
    executive: null,
    customerName: null
  })
  const [totalQuantitySum, setTotalQuantitySum] = useState(0)

  const getAllQuantityData = async () => {
    try {
      setLoading(true)

      const { year, fromMonth, toMonth, product, executive, customerName } =
        quantityRecordfilter
      const params = {
        ...quantityRecordfilter,
        product: product?.key,
        executive: executive?.id,
        customerName: customerName?.customerName,
        chartType: 'quantity-records'
      }

      if (fromMonth && !toMonth) {
        params.month = fromMonth
        params.year = year
      } else if (fromMonth && toMonth) {
        params.month = undefined
        params.year = year
      } else {
        params.month = undefined
        params.year = year
      }

      const response = await axiosInstance.get('/api/customers/charts', {
        params
      })
      const data = response.data?.data || []
      if (fromMonth && toMonth) {
        const summedData = sumDataBetweenMonths(data)
        setQuantityRecordData(summedData)
        setTotalQuantitySum(
          summedData.reduce((acc, item) => acc + item.totalQuantity, 0)
        )
      } else {
        setQuantityRecordData(data)
        setTotalQuantitySum(
          data.reduce((acc, item) => acc + item.totalQuantity, 0)
        )
      }
    } catch (error) {
      console.log('my error', error)
      setLoading(false)
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }
  const sumDataBetweenMonths = (data) => {
    const from = parseInt(quantityRecordfilter.fromMonth, 10)
    const to = parseInt(quantityRecordfilter.toMonth, 10)

    if (!from || !to || from > to) {
      return []
    }
    const relevantData = data.filter((item) => {
      const monthNum = parseInt(item.month, 10)
      return monthNum >= from && monthNum <= to
    })
    relevantData.sort((a, b) => parseInt(a.month, 10) - parseInt(b.month, 10))

    let runningTotal = 0
    return relevantData.map((item) => {
      runningTotal = parseInt(item.totalQuantity, 10) || 0
      return {
        ...item,
        totalQuantity: runningTotal
      }
    })
  }
  useEffect(() => {
    getAllQuantityData()
  }, [quantityRecordfilter])

  const getFieldWidth = () => {
    if (isMobile) return '100%'
    if (isTablet) return '45%'
    return '22%'
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h2"
          sx={{
            fontWeight: 'light',
            color: '#333',
            mb: 3
          }}
        >
          Quantity Record
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <FormControl sx={{ width: getFieldWidth() }} size="small">
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={quantityRecordfilter?.year}
            label="Year"
            onChange={(event) => {
              setQuantityRecordfilter((prev) => ({
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
          <InputLabel id="fromMonth-select-label">From Month</InputLabel>
          <Select
            labelId="fromMonth-select-label"
            value={quantityRecordfilter.fromMonth || ''}
            label="From Month"
            onChange={(event) => {
              const val = event.target.value
              setQuantityRecordfilter((prev) => ({
                ...prev,
                fromMonth: val,
                toMonth: val ? prev.toMonth : null
              }))
            }}
          >
            <MenuItem value="">
              <em>No select</em>
            </MenuItem>
            {months?.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ width: getFieldWidth() }} size="small">
          <InputLabel id="toMonth-select-label">To Month</InputLabel>
          <Select
            labelId="toMonth-select-label"
            value={quantityRecordfilter.toMonth || ''}
            label="To Month"
            onChange={(event) => {
              const val = event.target.value
              setQuantityRecordfilter((prev) => ({
                ...prev,
                toMonth: val
              }))
            }}
          >
            <MenuItem value="">
              <em>No select</em>
            </MenuItem>
            {months?.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          size="small"
          options={allProducts}
          value={quantityRecordfilter?.product?.value}
          onChange={(event, newValue) =>
            setQuantityRecordfilter((prev) => ({
              ...prev,
              product: newValue
            }))
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
          value={quantityRecordfilter?.executive}
          onChange={(event, newValue) =>
            setQuantityRecordfilter((prev) => ({
              ...prev,
              executive: newValue
            }))
          }
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label="Users" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />
        {/* 
        <Autocomplete
          size="small"
          options={states}
          value={quantityRecordfilter?.state}
          onChange={(event, newValue) =>
            setQuantityRecordfilter((prev) => ({ ...prev, state: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="State" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        /> */}

        {/* <Autocomplete
          size="small"
          options={allCities}
          value={quantityRecordfilter?.city}
          onChange={(event, newValue) =>
            setQuantityRecordfilter((prev) => ({ ...prev, city: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="City" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        /> */}
        <Autocomplete
          size="small"
          options={['KL', 'MTS']}
          value={quantityRecordfilter?.quantity || 'KL'} // Default to null if nothing is selected
          onChange={(event, newValue) => {
            setQuantityRecordfilter((prev) => ({
              ...prev,
              quantity: newValue || 'KL'
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Quantity" variant="outlined" />
          )}
          sx={{ width: getFieldWidth() }}
        />
        <Autocomplete
          size="small"
          options={allClients}
          value={
            allClients.find(
              (c) => c.customerName === quantityRecordfilter.customerName
            ) || null
          }
          onChange={(event, newValue) =>
            setQuantityRecordfilter((prev) => ({
              ...prev,
              customerName: newValue ? newValue.customerName : ''
            }))
          }
          getOptionLabel={(option) => {
            if (!option) return ''
            const company = Array.isArray(option.companyName)
              ? option.companyName.join(', ')
              : option.companyName
            return `${company} (${option.customerName})`
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Company"
              variant="outlined"
              fullWidth
              autoComplete="off"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'chrome-off', // 👈 Trick for Chrome/Edge
                form: {
                  autoComplete: 'off'
                }
              }}
            />
          )}
          sx={{ width: getFieldWidth() }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          justifyContent: 'center',
          width: '100%',
          height: isMobile ? '300px' : '400px'
        }}
      >
        <Typography
          sx={{
            fontSize: '1.1rem',
            fontWeight: 'light',
            position: 'absolute',
            top: 0,
            right: 0
          }}
        >
          <span> Total :</span>{' '}
          <span style={{ marginLeft: '4px', fontWeight: '400' }}>
            {totalQuantitySum?.toFixed(2)} {quantityRecordfilter?.quantity}
          </span>
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : !!quantityRecordData && quantityRecordData.length !== 0 ? (
          <BasicBarChartMuix
            quantityRecordData={quantityRecordData}
            overAllSalesData={null}
            isMonthly={quantityRecordData?.length >= 28 ? true : false}
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

export default QuantityRecords
