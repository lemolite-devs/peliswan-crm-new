import React, { useState, useEffect } from 'react'
import {
  useMediaQuery,
  Box,
  Button,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  TextField,
  Grid,
  Chip,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import UploadIcon from '@mui/icons-material/Upload'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'
import { HandleError } from 'app/utils/handleError'
import LinesChart from 'app/views/charts/muix/LinesChart'
import BarsChart from 'app/views/charts/muix/BarsChart'
import StateWiseBarChart from 'app/views/charts/muix/StateWiseBarChart'
import PieCharts from 'app/views/charts/muix/PieCharts'
import { Autocomplete } from '@mui/material'
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import IndiaMap from '../IndiaMap'
import {
  LocalGasStation,
  Payments,
  Receipt,
  ShowChart,
  AccountBalance
} from '@mui/icons-material'

const SalesHistory = () => {
  const isSmall = useMediaQuery('(max-width:600px)')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [chartData, setChartData] = useState([])
  const [statemapData, setStateMapData] = useState([])
  const [citymapData, setCityMapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [rangeFilter, setRangeFilter] = useState('monthly')
  const [metric, setMetric] = useState('quantity')
  const [itemName, setItemName] = useState([])
  const [partyName, setPartyName] = useState([])
  const [partyState, setPartyState] = useState([])
  const [destination, setDestination] = useState([])
  const [pieData, setPieData] = useState({})
  const [selectedChart, setSelectedChart] = useState('byItemName')
  const [filters, setFilters] = useState({
    items: [],
    parties: [],
    states: [],
    destinations: [],
    executives: []
  })
  const [startDate, setStartDate] = useState(dayjs().startOf('month'))
  const [endDate, setEndDate] = useState(dayjs())
  const [activeFilters, setActiveFilters] = useState([])
  const [destinationWiseData, setDestinationWiseData] = useState([])
  const [partyWiseData, setPartyWiseData] = useState([])
  const [itemWiseData, setItemWiseData] = useState([])
  const [stateWiseData, setStateWiseData] = useState([])
  const [summaryData, setSummaryData] = useState({})
  const [metricPieData, setMetricPieData] = useState([])

  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const iconMap = {
    'Total Quantity': <LocalGasStation sx={{ color: '#FF5722' }} />,
    'Total Amount': <Payments sx={{ color: '#4CAF50' }} />,
    'Avg. Rate': <ShowChart sx={{ color: '#FFC107' }} />,
    'Total Margin': <AccountBalance sx={{ color: '#9C27B0' }} />
  }

  // Function to update active filters
  const updateActiveFilters = () => {
    const filters = []

    if (rangeFilter) {
      filters.push({
        key: 'range',
        label: `Range: ${rangeFilter}`,
        value: rangeFilter
      })
    }

    if (itemName?.length) {
      itemName.forEach((val) =>
        filters.push({ key: `item-${val}`, label: `Item: ${val}` })
      )
    }

    if (partyName?.length) {
      partyName.forEach((val) =>
        filters.push({ key: `party-${val}`, label: `Party: ${val}` })
      )
    }

    if (partyState?.length) {
      partyState.forEach((val) =>
        filters.push({ key: `state-${val}`, label: `State: ${val}` })
      )
    }

    if (destination?.length) {
      destination.forEach((val) =>
        filters.push({ key: `dest-${val}`, label: `Destination: ${val}` })
      )
    }

    if (metric && metric !== 'amount') {
      filters.push({
        key: 'metric',
        label: `Metric: ${metric}`,
        value: metric
      })
    }

    if (rangeFilter === 'custom' && startDate) {
      filters.push({
        key: 'startDate',
        label: `From: ${startDate.format('MM/DD/YYYY')}`,
        value: startDate
      })
    }

    if (rangeFilter === 'custom' && endDate) {
      filters.push({
        key: 'endDate',
        label: `To: ${endDate.format('MM/DD/YYYY')}`,
        value: endDate
      })
    }

    setActiveFilters(filters) // ✅ नया array set करना है
  }

  const handleRemoveFilter = (filter) => {
    if (filter.key.startsWith('item-')) {
      setItemName((prev) =>
        prev.filter((v) => v !== filter.label.replace('Item: ', ''))
      )
    } else if (filter.key.startsWith('party-')) {
      setPartyName((prev) =>
        prev.filter((v) => v !== filter.label.replace('Party: ', ''))
      )
    } else if (filter.key.startsWith('state-')) {
      setPartyState((prev) =>
        prev.filter((v) => v !== filter.label.replace('State: ', ''))
      )
    } else if (filter.key.startsWith('dest-')) {
      setDestination((prev) =>
        prev.filter((v) => v !== filter.label.replace('Destination: ', ''))
      )
    } else {
      // single-value filters
      switch (filter.key) {
        case 'range':
          setRangeFilter('monthly')
          break
        case 'metric':
          setMetric('amount')
          break
        case 'startDate':
          setStartDate(dayjs().startOf('month'))
          break
        case 'endDate':
          setEndDate(dayjs())
          break
        default:
          break
      }
    }
  }

  const handleClearAllFilters = () => {
    setRangeFilter('monthly')
    setItemName([])
    setPartyName([])
    setPartyState([])
    setDestination([])
    setMetric('quantity')
    setStartDate(dayjs().startOf('month'))
    setEndDate(dayjs())
  }

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // 🔹 file select होते ही upload call करो
    await handleUpload(selectedFile)
  }

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return alert('Please select a file first.')

    const formData = new FormData()
    formData.append('excelFile', selectedFile)

    try {
      setUploading(true)

      const response = await axiosInstance.post('/api/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.status === 200) {
        showSnackbar({
          message: `${response?.data?.message} (${response?.data?.insertedCount} items inserted)`,
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setUploading(false)
    }
  }

  const fetchSalesData = async () => {
    try {
      setLoading(true)

      const params = {
        range: rangeFilter,
        itemName: itemName.length > 0 ? itemName : undefined,
        partyName: partyName.length > 0 ? partyName : undefined,
        partyState: partyState.length > 0 ? partyState : undefined,
        destination: destination.length > 0 ? destination : undefined,
        metric: metric || undefined
      }

      if (rangeFilter === 'custom') {
        params.startDate = startDate
          ? startDate.format('YYYY-MM-DD')
          : undefined
        params.endDate = endDate ? endDate.format('YYYY-MM-DD') : undefined
      }

      const response = await axiosInstance.get('/api/chart/sales', {
        params,
        paramsSerializer: (params) => {
          // ✅ serialize arrays as repeated params: ?itemName=A&itemName=B
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map((v) => `${key}=${encodeURIComponent(v)}`)
                  .join('&')
              }
              return value !== undefined
                ? `${key}=${encodeURIComponent(value)}`
                : ''
            })
            .filter(Boolean)
            .join('&')
        }
      })

      const data = response.data.data

      setChartData(data)
      setDestinationWiseData(response.data.destinationWiseData)
      setPartyWiseData(response.data.partyWiseData)
      setStateWiseData(response.data.stateWiseData)
      setItemWiseData(response.data.ItemWiseData)
      setStateMapData(response.data.mapData)
      setCityMapData(response.data.cityMapData)
      setMetricPieData(response.data.metricPieData)
      setSummaryData(response.data.summary)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
    updateActiveFilters()
  }, [
    rangeFilter,
    itemName,
    partyName,
    partyState,
    destination,
    startDate,
    endDate,
    metric
  ])

  useEffect(() => {
    const getAllUniqueFilters = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get('/api/allUniqueFilters')

        const data = response.data.data || {}
        setFilters(data)
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
      } finally {
        setLoading(false)
      }
    }
    getAllUniqueFilters()
  }, [])

  const handleRangeChange = (event) => setRangeFilter(event.target.value)
  const handleMetricChange = (event) => setMetric(event.target.value)

  const metricLabelMap = {
    amount: 'Amount (₹)',
    quantity: 'Quantity',
    avgRate: 'Average Rate (₹)',
    margin: 'Margin (₹)'
  }

  const metricColorMap = {
    amount: '#3b82f6',
    quantity: '#22c55e',
    avgRate: '#f59e0b',
    margin: '#b5f409ff'
  }

  const states = stateWiseData.map((d) => d.state)
  const statesales = stateWiseData.map((d) => d.value)

  const districts = destinationWiseData.map((d) => d.destination)
  const districtsales = destinationWiseData.map((d) => d.value)

  const party = partyWiseData.map((d) => d.party)
  const partysales = partyWiseData.map((d) => d.value)

  const itemsName = itemWiseData.map((d) => d.itemName)
  const itemsales = itemWiseData.map((d) => d.value)

  const formatQuantity = (value) => {
    if (!value) return '0'
    if (value >= 1000) return (value / 1000).toFixed(1) + ' KL'
    return value + ' L'
  }

  const formatAmount = (value) => {
    if (!value) return '0'
    if (value >= 10000000) return (value / 10000000).toFixed(1) + ' Cr'
    if (value >= 100000) return (value / 100000).toFixed(1) + ' L'
    if (value >= 1000) return (value / 1000).toFixed(1) + ' K'
    return value.toString()
  }

  const items = [
    {
      label: 'Total Quantity',
      value: formatQuantity(summaryData.totalQuantity)
    },
    {
      label: 'Total Amount',
      value: formatAmount(summaryData.totalAmount),
      suffix: '₹'
    },
    {
      label: 'Avg. Rate',
      value: summaryData.avgRate?.toFixed(2),
      suffix: '₹'
    },
    {
      label: 'Total Margin',
      value: formatAmount(summaryData.totalMargin),
      suffix: '₹'
    }
  ]

  const pieChartSeries = [
    {
      data: metricPieData.map((item, index) => ({
        id: index,
        label: item.label,
        value: item.value
      }))
    }
  ]

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* File Upload Button - 2 columns */}
        <Grid item xs={12} sm={2}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon sx={{ fontSize: 18 }} />} // icon bhi chhota kar sakte ho
            fullWidth
            disabled={uploading}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem', // aur chhota font
              padding: '6px 12px' // button ka padding bhi adjust kar sakte ho
            }}
          >
            {uploading ? 'Uploading...' : 'Choose & Upload File'}
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </Button>

          {file && (
            <Typography
              variant="body2"
              mt={1}
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                wordBreak: 'break-word'
              }}
            >
              {file.name}
            </Typography>
          )}
        </Grid>

        {/* Active Filters Chips - 8 columns */}
        {activeFilters.length > 0 && (
          <Grid item xs={12} sm={9}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  onDelete={() => handleRemoveFilter(filter)}
                  deleteIcon={<CloseIcon />}
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 25,
                    px: 0.5, // left-right padding कम करें
                    '& .MuiChip-deleteIcon': {
                      fontSize: '0.9rem', // ✅ icon छोटा
                      marginLeft: 0.1,
                      marginRight: -0.1
                    }
                  }}
                />
              ))}
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sm={1}>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {activeFilters.length > 0 && (
              <Button
                size="small"
                onClick={handleClearAllFilters}
                sx={{
                  fontSize: '0.75rem',
                  minWidth: '100px',
                  padding: '4px 8px',
                  backgroundColor: '#f44336', // red background
                  color: '#fff', // text white
                  '&:hover': {
                    backgroundColor: '#d32f2f' // darker red on hover
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Range Selector */}
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Range</InputLabel>
            <Select
              value={rangeFilter}
              onChange={handleRangeChange}
              label="Range"
              sx={{
                fontSize: '0.75rem', // dropdown text chhota
                '& .MuiSelect-icon': { fontSize: 18 }, // arrow icon chhota
                height: 36
              }}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Custom Date Range */}
        {rangeFilter === 'custom' && (
          <>
            <Grid item xs={12} sm={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: 36, // same as Select
                      fontSize: '0.75rem'
                    },
                    '& input': {
                      padding: '6px 8px' // inner padding
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.75rem'
                    },
                    '& .MuiAutocomplete-endAdornment': {
                      '& svg': {
                        fontSize: '1rem' // adjust icon size here
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  label="End Date"
                  value={endDate}
                  minDate={startDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: 36, // same as Select
                      fontSize: '0.75rem'
                    },
                    '& input': {
                      padding: '6px 8px' // inner padding
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.75rem'
                    },
                    '& .MuiAutocomplete-endAdornment': {
                      '& svg': {
                        fontSize: '1rem' // adjust icon size here
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}

        {/* Metric Selector */}
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Metric</InputLabel>
            <Select
              value={metric}
              onChange={handleMetricChange}
              label="Metric"
              sx={{
                fontSize: '0.75rem', // dropdown text chhota
                '& .MuiSelect-icon': { fontSize: 18 }, // arrow icon chhota
                height: 36
              }}
            >
              <MenuItem value="amount">Amount</MenuItem>
              <MenuItem value="quantity">Quantity</MenuItem>
              <MenuItem value="avgRate">Average Rate</MenuItem>
              <MenuItem value="margin">Margin</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Autocomplete Filters */}
        <Grid item xs={12} sm={2}>
          <Autocomplete
            multiple
            freeSolo
            options={filters.items}
            value={itemName}
            renderTags={() => null}
            onChange={(e, val) => setItemName(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Item Name"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36, // same as Select
                    fontSize: '0.75rem'
                  },
                  '& input': {
                    padding: '6px 2px' // inner padding
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem'
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    '& svg': {
                      fontSize: '1rem' // adjust icon size here
                    }
                  }
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Autocomplete
            multiple
            freeSolo
            options={filters.parties}
            value={partyName}
            onChange={(e, val) => setPartyName(val)}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Party Name"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36, // same as Select
                    fontSize: '0.75rem'
                  },
                  '& input': {
                    padding: '6px 2px' // inner padding
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem'
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    '& svg': {
                      fontSize: '1rem' // adjust icon size here
                    }
                  }
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Autocomplete
            multiple
            freeSolo
            options={filters.states}
            value={partyState}
            onChange={(e, val) => setPartyState(val)}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="State"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36, // same as Select
                    fontSize: '0.75rem'
                  },
                  '& input': {
                    padding: '6px 2px' // inner padding
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem'
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    '& svg': {
                      fontSize: '1rem' // adjust icon size here
                    }
                  }
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Autocomplete
            multiple
            freeSolo
            options={filters.destinations}
            value={destination}
            onChange={(e, val) => setDestination(val)}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36, // same as Select
                    fontSize: '0.75rem'
                  },
                  '& input': {
                    padding: '6px 2px' // inner padding
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem'
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    '& svg': {
                      fontSize: '1rem' // adjust icon size here
                    }
                  }
                }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {items.map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} lg={3} key={idx}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {item.suffix ? `${item.suffix} ${item.value}` : item.value}
                </Typography>
              </Box>

              {/* Icon on the right side */}
              <Box
                sx={{
                  backgroundColor: '#f5f6ff',
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {iconMap[item.label]}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        {/* First Column: 3.5 / 12 */}
        <Grid item xs={12} sm={3.5} sx={{ flex: 3.5 }}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Sales Trend - {metricLabelMap[metric]}
            </Typography>
            <BarsChart
              height={468}
              xAxis={[
                { scaleType: 'band', data: chartData.map((d) => d.label) }
              ]}
              yAxis={[
                {
                  label: metricLabelMap[metric],
                  valueFormatter:
                    metric === 'quantity' ? formatQuantity : formatAmount
                }
              ]}
              series={[
                {
                  data: chartData.map((d) => d.value),
                  label: metricLabelMap[metric],
                  color: metricColorMap[metric],
                  valueFormatter:
                    metric === 'quantity' ? formatQuantity : formatAmount
                }
              ]}
            />
          </Card>
        </Grid>

        {/* Second Column: 5 / 12 */}
        <Grid item xs={12} sm={5} sx={{ flex: 5 }}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            {' '}
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Geo Distribution {metricLabelMap[metric]}
            </Typography>
            <IndiaMap
              stateData={statemapData}
              cityData={citymapData}
              selectedState={partyState}
              selectedCity={destination}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
            />
          </Card>
        </Grid>

        {/* Third Column: 3.5 / 12 */}
        <Grid item xs={12} sm={3.5} sx={{ flex: 3.5 }}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            {' '}
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Product Insights {metricLabelMap[metric]}
            </Typography>
            <PieCharts
              series={pieChartSeries}
              legend={false}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
            />
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              State Dynamics - {metricLabelMap[metric]}
            </Typography>
            <StateWiseBarChart
              layout="horizontal"
              xAxis={[{ label: metricLabelMap[metric], min: 0 }]}
              yAxis={[{ scaleType: 'band', data: states }]}
              series={[
                {
                  data: statesales,
                  label: metricLabelMap[metric],
                  color: '#1976d2'
                }
              ]}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
              grid={{ vertical: true }}
            />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              District Breakdown - {metricLabelMap[metric]}
            </Typography>
            <StateWiseBarChart
              layout="horizontal"
              xAxis={[{ label: metricLabelMap[metric], min: 0 }]}
              yAxis={[{ scaleType: 'band', data: districts }]}
              series={[
                {
                  data: districtsales,
                  label: metricLabelMap[metric],
                  color: '#2e7d32'
                }
              ]}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
              grid={{ vertical: true }}
            />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Party Insights - {metricLabelMap[metric]}
            </Typography>
            <StateWiseBarChart
              layout="horizontal"
              xAxis={[{ label: metricLabelMap[metric], min: 0 }]}
              yAxis={[{ scaleType: 'band', data: party }]}
              series={[
                {
                  data: partysales,
                  label: metricLabelMap[metric],
                  color: '#ed6c02'
                }
              ]}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
              grid={{ vertical: true }}
            />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            {' '}
            <Typography variant="subtitle1" fontWeight={600}>
              Item Insights - {metricLabelMap[metric]}
            </Typography>
            <StateWiseBarChart
              layout="horizontal"
              xAxis={[{ label: metricLabelMap[metric], min: 0 }]}
              yAxis={[{ scaleType: 'band', data: itemsName }]}
              series={[
                {
                  data: itemsales,
                  label: metricLabelMap[metric],
                  color: '#9c27b0'
                }
              ]}
              formatQuantity={formatQuantity}
              formatAmount={formatAmount}
              metric={metricLabelMap[metric]}
              grid={{ vertical: true }}
            />
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default SalesHistory
