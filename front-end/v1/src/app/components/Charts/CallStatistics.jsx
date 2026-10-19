import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Box, useMediaQuery, useTheme } from '@mui/system'
import useAuth from 'app/hooks/useAuth'
import BasicLineChartMuix from 'app/views/charts/muix/BasicLineChartMuix'
import DashedLineChart from 'app/views/charts/muix/DashedLineChart'
import axiosInstance from 'axiosInstance'
import React from 'react'
import { useState, useEffect } from 'react'

const CallStatistics = ({ allSalesExecutives }) => {
  const { user, hasRole } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const [graphData, setGraphData] = useState({ xAxisData: [], seriesData: [] })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedExecutive, setSelectedExecutive] = useState(null)
  const [totalCalls, setTotalCalls] = useState(0)

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
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year, label: year }
  })

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate()
  }
  const fetchGraphData = async (month, year) => {
    try {
      const response = await axiosInstance.get('/api/leads/activity-graph', {
        params: { month, year, executive: selectedExecutive?.id || null }
      })
      const { data } = response

      // Calculate total count from data
      const total = data.reduce((sum, item) => sum + item.count, 0)
      setTotalCalls(total)

      // Get total days in the selected month/year
      const daysInMonth = getDaysInMonth(month, year)

      // Create a full list of dates for the selected month
      const fullDateList = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString()
      )

      // Prepare series data by creating a map of date -> count from the API response
      const activityMap = data.reduce((acc, item) => {
        const day = parseInt(item.date.split('-')[2], 10)
        acc[day] = item.count
        return acc
      }, {})

      // Populate the xAxisData (1, 2, 3, ..., daysInMonth) and use 'null' for missing days
      const seriesData = fullDateList.map((day) =>
        activityMap[day] !== undefined ? activityMap[day] : null
      )

      setGraphData({
        xAxisData: fullDateList,
        seriesData
      })
    } catch (error) {
      setTotalCalls(0)
      console.error('Error fetching graph data:', error)
    }
  }

  const handleMonthChange = (event) => {
    const month = event.target.value
    setSelectedMonth(month)
    fetchGraphData(month, selectedYear)
  }

  const handleYearChange = (event) => {
    const year = event.target.value
    setSelectedYear(year)
    fetchGraphData(selectedMonth, year)
  }

  useEffect(() => {
    fetchGraphData(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, selectedExecutive])

  const getFieldWidth = () => {
    if (isMobile) return '100%'
    if (isTablet) return '45%'
    return '22%'
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          flexWrap: 'wrap' // Ensures wrapping for smaller screens
        }}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h2"
          sx={{
            fontWeight: 'light',
            color: '#333',
            mb: { xs: 2, sm: 2 }, // Add margin-bottom for mobile
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          Call Statistics
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <FormControl
          variant="outlined"
          sx={{ minWidth: 120, marginRight: '8px' }}
          className="w-full md:w-auto"
        >
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={handleMonthChange}
            label="Month"
            size="small"
          >
            {months.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          variant="outlined"
          sx={{ minWidth: 120 }}
          className="w-full md:w-auto mb-4"
        >
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            label="Year"
            size="small"
          >
            {years.map((year) => (
              <MenuItem key={year.value} value={year.value}>
                {year.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!hasRole('Sales Executive') && (
          <Autocomplete
            size="small"
            options={allSalesExecutives}
            value={selectedExecutive}
            onChange={(event, newValue) =>
              setSelectedExecutive((prev) => (newValue ? newValue : null))
            }
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label="Users" variant="outlined" />
            )}
            sx={{ width: getFieldWidth() }}
          />
        )}
      </Box>

      {/* <BasicLineChartMuix
        xAxisData={graphData.xAxisData}
        seriesData={graphData.seriesData}
        xAxisLabel="No of days"
        yAxisLabel="Calls"
      /> */}
      <DashedLineChart
        xAxisData={graphData.xAxisData}
        seriesData={graphData.seriesData}
        xAxisLabel="No. Of Days"
        yAxisLabel="Calls"
        totalCount={totalCalls}
      />
    </>
  )
}

export default CallStatistics
