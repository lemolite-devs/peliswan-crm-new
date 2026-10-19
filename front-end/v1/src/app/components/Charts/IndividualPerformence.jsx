import { Autocomplete, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import AuthContext from 'app/contexts/JWTAuthContext'
import useAuth from 'app/hooks/useAuth'
import ChartsOverviewDemo from 'app/views/charts/muix/BarChartMuix'
import axiosInstance from 'axiosInstance'
import React, { useState, useEffect } from 'react'

const IndividualPerformence = ({ states }) => {
  const { user, hasRole } = useAuth()
  const [salesData, setSalesData] = useState([])
  const [allSalesExecutive, setAllSalesExecutive] = useState([])
  const [selectedName, setSelectedName] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchExecutivePerformance, setSearchExecutivePerformance] = useState({
    year: new Date().getFullYear(),
    state: '',
    quantity: '',
    salesExecutiveId: ''
  })

  // Generate a list of years
  const years = Array.from({ length: 10 }, (_, index) => {
    const year = new Date().getFullYear() - index
    return { value: year, label: year.toString() }
  })

  const getAllUsers = async () => {
    const response = await axiosInstance.get('/api/users/filter/lookUps')
    const data = response.data?.users

    if (hasRole('Sales Executive')) {
      const allSaleExecutive = data
        .filter((d) => d._id === user.id)
        .map((user) => ({
          id: user._id,
          name: user.name
        }))
      setAllSalesExecutive(allSaleExecutive)
      setSelectedName(allSaleExecutive[0].name)
    } else {
      const allSaleExecutive = data.map((user) => ({
        id: user._id,
        name: user.name
      }))
      setAllSalesExecutive(allSaleExecutive)
    }
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  useEffect(() => {
    // Fetch sales data whenever selectedName, selectedMonth, or selectedYear changes
    if (selectedName) {
      const salesExecutiveId = allSalesExecutive.find(
        (exec) => exec.name === selectedName
      )?.id

      if (salesExecutiveId) {
        setSearchExecutivePerformance((prev) => ({
          ...prev,
          salesExecutiveId
        }))
        fetchSalesTargetData(salesExecutiveId, selectedMonth, selectedYear)
      }
    }
  }, [selectedName, selectedMonth, selectedYear, allSalesExecutive])

  const fetchSalesTargetData = async (salesExecutiveId) => {
    if (!salesExecutiveId) return

    try {
      const response = await axiosInstance.get(
        `/api/salesChartData/${salesExecutiveId}`,
        {
          params: { ...searchExecutivePerformance }
        }
      )
      setSalesData(response.data)
    } catch (error) {
      console.error('Error fetching sales target data:', error)
    }
  }

  useEffect(() => {
    if (searchExecutivePerformance.salesExecutiveId) {
      fetchSalesTargetData(searchExecutivePerformance.salesExecutiveId)
    }
  }, [searchExecutivePerformance])

  return (
    <>
      <Box
        sx={{
          width: '100%',
          marginBottom: '30px',
          fontSize: ' 1.5rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 2
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 'light',
            color: '#333',
            mb: { xs: 2, sm: 0 },
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          Individual Performance
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          padding: '10px',
          gap: 1
        }}
      >
        {!hasRole('Sales Executive') && (
          <Autocomplete
            options={allSalesExecutive}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              allSalesExecutive.find((exec) => exec.name === selectedName) ||
              null
            }
            onChange={(event, newValue) => {
              setSelectedName(newValue ? newValue.name : null)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Name"
                variant="outlined"
                size="small"
              />
            )}
            sx={{ width: 140 }}
          />
        )}

        <Autocomplete
          options={years}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={
            searchExecutivePerformance.year
              ? years.find(
                  (year) =>
                    year.value === parseInt(searchExecutivePerformance.year)
                ) || null
              : null
          }
          onChange={(event, newValue) => {
            setSearchExecutivePerformance((prev) => ({
              ...prev,
              year: newValue ? newValue.value : null
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Year"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ width: 140 }}
        />

        <Autocomplete
          options={['KL', 'MTS']}
          value={searchExecutivePerformance.quantity || null}
          onChange={(event, newValue) => {
            setSearchExecutivePerformance((prev) => ({
              ...prev,
              quantity: newValue || ''
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Quantity"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ width: 140 }}
        />

        {/* <Autocomplete
          options={states}
          getOptionLabel={(option) => option}
          isOptionEqualToValue={(option, value) => option === value}
          value={searchExecutivePerformance.state || null}
          onChange={(event, newValue) => {
            setSearchExecutivePerformance((prev) => ({
              ...prev,
              state: newValue || ''
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="State"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ width: 140 }}
        /> */}
      </Box>

      <ChartsOverviewDemo salesData={salesData} />
    </>
  )
}

export default IndividualPerformence
