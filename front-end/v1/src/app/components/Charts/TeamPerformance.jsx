import React from 'react'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  Paper,
  Button,
  Typography,
  LinearProgress,
  Modal,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import TeamForm from '../TeamForm/TeamForm'
import axiosInstance from 'axiosInstance'
import { useContext } from 'react'
import AuthContext from 'app/contexts/JWTAuthContext'
import { useNavigate } from 'react-router-dom'

const TeamPerformance = ({ states, user }) => {
  const currantMonth = new Date().getMonth() + 1
  const [allOpen, setAllOpen] = useState(false)
  const [salesTarget, setSalesTarget] = useState(null)
  const [progressPercentage, setProgressPercentage] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [teamId, setTeamId] = useState(null)
  const [allSalesExecutive, setAllSalesExecutive] = useState([])
  const [trackIsSubmited, setTrackIsSubmited] = useState(false)
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
  // Generate years array from 2024 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i)
  const [executiveFilter, setExecutiveFilter] = useState({
    month: {
      label: months.find((month) => month.value === currantMonth)?.label || '',
      value: currantMonth
    },
    year: new Date().getFullYear().toString(),
    state: null,
    quantity: null,
    salesExecutiveId: null
  })
  const { user: any } = useContext(AuthContext)
  const navigate = useNavigate()

  const openTeamModal = (team, team_id) => {
    if (user?.role === 'Admin' || user?.role === 'Sales Manager') {
      setSelectedTeam(team)
      setFormOpen(true)
      setTeamId(team_id)
    }
  }
  // Function to open the "See All" modal
  const openAllModal = () => {
    setAllOpen(true)
  }
  // Function to close the "See All" modal
  const closeAllModal = () => {
    setAllOpen(false)
  }
  const closeTeamModal = () => {
    setFormOpen(false)
    setSelectedTeam('')
  }

  useEffect(() => {
    const fetchSalesExecutives = async () => {
      try {
        const response = await axiosInstance.get('/api/sales-progress', {
          params: {
            ...executiveFilter,
            month: executiveFilter?.month?.value
          }
        })
        setProgressPercentage(response.data.progressData)
      } catch (error) {
        setProgressPercentage([])
        console.error('Error fetching sales executives:', error)
      }
    }

    fetchSalesExecutives()
  }, [executiveFilter, trackIsSubmited])

  const getAllUsers = async () => {
    const response = await axiosInstance.get('/api/users/filter/lookUps')
    const data = response.data?.users
    const allSaleExecutive = data
      .filter((user) => user.role.name === 'Sales Executive')
      .map((user) => ({
        id: user._id,
        name: user.name
      }))
    setAllSalesExecutive(allSaleExecutive)
  }
  // Fetch announcements on component mount
  useEffect(() => {
    getAllUsers()
  }, [])

  return (
    <>
      {/* Title and Filters */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Title Section */}
        <Box
          sx={{
            display: 'flex',
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
              mb: { xs: 2, sm: 0 }, // Add margin-bottom for mobile
              fontSize: { xs: '1.5rem', sm: '2rem' } // Adjust font size for mobile
            }}
          >
            {any?.role === 'Sales Executive'
              ? 'Self Performance'
              : 'Team Performance'}
          </Typography>

          {/* Filters Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Vertical on mobile, horizontal on larger screens
              gap: 2, // Add spacing between filters
              alignItems: { xs: 'stretch', sm: 'center' }, // Stretch filters to full width on mobile
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {/* Month Dropdown */}
            <FormControl
              size="small"
              sx={{ width: { xs: '100%', sm: '40%' } }} // Full width on mobile
            >
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={executiveFilter?.month?.value}
                label="Month"
                onChange={(event) => {
                  const selectedMonth = months.find(
                    (month) => month.value === event.target.value
                  )
                  setExecutiveFilter((prev) => ({
                    ...prev,
                    month: {
                      label: selectedMonth ? selectedMonth.label : 'No select',
                      value: selectedMonth ? selectedMonth.value : null
                    }
                  }))
                }}
              >
                <MenuItem value={null}>
                  <em>No select</em>
                </MenuItem>
                {months?.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Year Dropdown */}
            <FormControl
              size="small"
              sx={{ width: { xs: '100%', sm: '140px' } }} // Full width on mobile
            >
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={executiveFilter?.year || currentYear.toString()}
                label="Year"
                onChange={(event) => {
                  setExecutiveFilter((prev) => ({
                    ...prev,
                    year: event.target.value
                  }))
                }}
              >
                {years?.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quantity Dropdown */}
            <Autocomplete
              options={['KL', 'MTS']}
              getOptionLabel={(option) => option}
              isOptionEqualToValue={(option, value) => option === value}
              value={executiveFilter.quantity || null}
              onChange={(event, newValue) => {
                setExecutiveFilter((prev) => ({
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
              sx={{ width: { xs: '100%', sm: 140 } }} // Full width on mobile
            />

            {/* State Dropdown */}
            <Autocomplete
              options={states} // Your array of state options
              getOptionLabel={(option) => option}
              isOptionEqualToValue={(option, value) => option === value}
              value={executiveFilter.state || null}
              onChange={(event, newValue) => {
                setExecutiveFilter((prev) => ({
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
              sx={{ width: { xs: '100%', sm: 140 } }} // Full width on mobile
            />
          </Box>
        </Box>

        {/* Sales Executives Section */}
        <Box>
          {any?.role === 'Sales Executive' ? null : (
            <Box sx={{ float: 'right', mr: `calc(2px + 1%)` }}>
              <Button variant="text" color="primary" onClick={openAllModal}>
                See All
              </Button>
            </Box>
          )}

          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              mt: 4,
              '& > :not(style)': {
                m: 1,
                width: { xs: '100%', sm: '45%', md: '30%' },
                height: 100
              }
            }}
          >
            {Array.isArray(progressPercentage) &&
              progressPercentage?.slice(0, 3)?.map((team, index) => (
                <Paper
                  key={index}
                  elevation={3}
                  sx={{ padding: '25px 20px', cursor: 'pointer' }}
                  onClick={() => {
                    if (any?.role === 'Sales Executive') {
                      if (any?.id === team?.salesExecutiveId) {
                        navigate(`/customers`)
                        return null
                      }
                    }
                    openTeamModal(team?.executive, team?.salesExecutiveId)
                  }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <b style={{ fontSize: 'medium' }}>{team?.executive}</b>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: ''
                      }}
                    >
                      <Typography variant="" sx={{ fontWeight: 'bold' }}>
                        {` ${(team?.saleQuantity || 0).toFixed(2)} ${team?.unit ? team.unit : 'KL'}  / ${team?.targetQuantity || '100'} ${team?.unit ? team.unit : 'KL'}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ width: '100%', marginTop: '16px' }}>
                    <LinearProgress
                      variant="determinate"
                      color={'success'}
                      value={team?.progressPercentage}
                      sx={{
                        height: '5px',
                        borderRadius: '3px'
                      }}
                    />
                  </Box>
                </Paper>
              ))}
          </Box>
        </Box>
      </Box>

      {/* Modal for Showing All Sales Executives */}
      <Modal open={allOpen} onClose={closeAllModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            bgcolor: 'background.paper',
            borderRadius: '10px',
            boxShadow: 24,
            p: 4,
            overflowY: 'auto',
            maxHeight: '90vh'
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: '2rem' }}>
            All Sales Executives
          </Typography>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              gap: 2
            }}
          >
            {Array.isArray(progressPercentage) &&
              progressPercentage?.map((team, index) => (
                <Paper
                  key={index}
                  elevation={3}
                  sx={{
                    width: { xs: '100%', sm: '45%', md: '30%' },
                    padding: '25px 20px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (any?.role === 'Sales Executive') {
                      if (any?.id === team?.salesExecutiveId) {
                        navigate(`/customers`)
                        return null
                      }
                    }
                    openTeamModal(team?.executive, team?.salesExecutiveId)
                  }}
                >
                  <Box
                    sx={{
                      height: '80%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <b style={{ fontSize: 'medium' }}>{team?.executive}</b>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: ''
                        }}
                      >
                        <Typography variant="" sx={{ fontWeight: 'bold' }}>
                          {` ${(team?.saleQuantity || 0).toFixed(2)} ${team?.unit ? team.unit : 'KL'}  / ${team?.targetQuantity || '100'} ${team?.unit ? team.unit : 'KL'}`}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ width: '100%', marginTop: '16px' }}>
                      <LinearProgress
                        variant="determinate"
                        color={'success'}
                        value={team?.progressPercentage}
                        sx={{
                          height: '5px',
                          borderRadius: '3px'
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
          </Box>
        </Box>
      </Modal>

      {/* Existing Modal for Editing a Specific Team */}
      <Modal open={formOpen} onClose={closeTeamModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: '10px',
            boxShadow: 24,
            p: 4
          }}
        >
          <TeamForm
            onClose={closeTeamModal}
            team={selectedTeam}
            teamId={teamId}
            salesTarget={salesTarget}
            setSalesTarget={setSalesTarget}
            progressPercentage={progressPercentage}
            setProgressPercentage={setProgressPercentage}
            states={states}
            setTrackIsSubmited={setTrackIsSubmited}
            trackIsSubmited={trackIsSubmited}
          />
        </Box>
      </Modal>
    </>
  )
}

export default TeamPerformance
