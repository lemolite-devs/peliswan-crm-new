import { useState, useEffect } from 'react'
import { styled, useMediaQuery, Grid, Box } from '@mui/material'
import Calendar from '../../components/Calendar/Calendar'
import CalendarForm from 'app/components/Calendar/CalendarForm'
import useAuth from 'app/hooks/useAuth'
import axiosInstance from 'axiosInstance'
import { HandleError } from 'app/utils/handleError'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'
import moment from 'moment-timezone'
import { useContext } from 'react'
import AuthContext from 'app/contexts/JWTAuthContext'
import TeamPerformance from 'app/components/Charts/TeamPerformance'
import CallStatistics from 'app/components/Charts/CallStatistics'
import IndividualPerformence from 'app/components/Charts/IndividualPerformence'
// import LiveAnalytics from 'app/components/Charts/LiveAnalytics'
import QuantityRecords from 'app/components/Charts/QuantityRecords'
// import SalesRecords from 'app/components/Charts/SalesRecords'
import DashboardTabs from 'app/components/DashboardTabs'
import DashboardLeadOverview from 'app/components/Charts/DashboardLeadOverview'
import SalesHistory from 'app/components/Charts/SalesHistory'

// import { TabPanel } from '@mui/lab'
const ContentBox = styled('div')(({ theme }) => ({
  marginLeft: '0px',
  padding: '12px'
}))

export default function Analytics() {
  const { user = null, hasPermission } = useAuth()
  const { user: any, hasRole, states, stateCityMap } = useContext(AuthContext)
  const [open, setOpen] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [editEvent, setEditEvent] = useState(null)
  const [selectedStartDate, setSelectedStartDate] = useState(null)
  const [selectedEndDate, setSelectedEndDate] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [allSalesExecutives, setAllSalesExecutives] = useState([])
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showComponent, setShowComponent] = useState(false) // State to track if the component should be rendered
  const [allClients, setAllClients] = useState([])
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const isXs = useMediaQuery((theme) => theme.breakpoints.down('xs'))
  const isSm = useMediaQuery((theme) => theme.breakpoints.between('xs', 'sm'))

  let allCities = []
  for (const state in stateCityMap) {
    allCities.push(...stateCityMap[state])
  }
  const uniqueCities = [...new Set(allCities)]
  allCities = uniqueCities.sort()

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  ) // Create year options dynamically from current year
  const getHeight = (isFirstItem = false) => {
    const baseHeight = isXs || isSm ? '30vh' : '50vh'
    return isFirstItem ? `calc(${baseHeight} / 1)` : baseHeight
  }

  const getAllProducts = async () => {
    try {
      const response = await axiosInstance.get('/api/items/lookUps')
      const data = response.data.items || []
      setAllProducts(data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching data:', error)
    }
  }
  const getAllSalesExecutives = async () => {
    try {
      const response = await axiosInstance.get('/api/users/lookUps')
      setAllSalesExecutives(response.data?.users)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  // handleDateSelect for handle date selection
  function handleDateSelect(selectInfo) {
    setSelectedStartDate(selectInfo.startStr)
    setSelectedEndDate(selectInfo.endStr)
    setOpen(true)
    if (selectInfo?.title === undefined) {
      setEditEvent(null)
    } else {
      handleAddAnnouncement(selectInfo)
      let calendarApi = selectInfo.view.calendar
      calendarApi.unselect()
    }
  }

  // handleEventClick for handle event click
  function handleEventClick(clickInfo) {
    setOpen(true)
    if (clickInfo.event.title) {
      setEditEvent(clickInfo.event)
    }
  }

  // handleClose for close the event dialog
  const handleClose = () => {
    setEditEvent(null)
    setOpen(false)
  }
  // getAllAnnouncement for Fetch all announcements
  const getAllAnnouncement = async () => {
    setShowComponent(false)
    try {
      const response = await axiosInstance.get('/api/announcements')
      setAnnouncements(convertEvents(response.data?.announcements))
      setShowComponent(true)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  // handleAddAnnouncement for add an announcement
  const handleAddAnnouncement = async (data) => {
    const utcStartTime = moment
      .tz(data.startDate.$d, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
      .utc()
      .format()

    const utcEndTime = moment
      .tz(data.endDate.$d, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
      .utc()
      .format()

    try {
      const result = await axiosInstance.post('/api/announcements', {
        ...data,
        title: data?.title?.trim(),
        description: data?.description?.trim(),
        startDate: utcStartTime,
        endDate: utcEndTime
      })
      if (result.status === 201) {
        showSnackbar({
          message: 'Event added successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        getAllAnnouncement() // Refresh announcements after adding
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  // handleUpdateAnnouncement for update an announcement
  const handleUpdateAnnouncement = async (id, data) => {
    const utcStartTime = moment
      .tz(data.startDate.$d, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
      .utc()
      .format()

    const utcEndTime = moment
      .tz(data.endDate.$d, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
      .utc()
      .format()

    const result = await axiosInstance.put(`/api/announcements/${id}`, {
      ...data,
      title: data?.title?.trim(),
      description: data?.description?.trim(),
      startDate: utcStartTime,
      endDate: utcEndTime
    })
    if (result.status === 200) {
      showSnackbar({
        message: 'Event Updated successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      getAllAnnouncement() // Refresh announcements after updating
    }
  }

  // handleDeleteAnnouncement for delete an announcement
  const handleDeleteAnnouncement = async (id) => {
    setDeleteLoading(true)

    try {
      const result = await axiosInstance.delete(`/api/announcements/${id}`)
      if (result.status === 200) {
        showSnackbar({
          message: 'Event deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        setEditEvent(null)
        handleClose()
        getAllAnnouncement() // Refresh announcements after deletion
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getAllCustomerName = async () => {
    try {
      const response = await axiosInstance.get('/api/customers/lookUps')

      console.log(response)
      const data = response.data?.clients || []
      setAllClients(data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching data:', error)
    }
  }

  // Fetch announcements and quantity data on component mount
  useEffect(() => {
    getAllSalesExecutives()
    getAllProducts()
    getAllAnnouncement()
    getAllCustomerName()
  }, [])

  const [graphData, setGraphData] = useState({ xAxisData: [], seriesData: [] })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate()
  }
  const fetchGraphData = async (month, year) => {
    try {
      const response = await axiosInstance.get('/api/leads/activity-graph', {
        params: { month, year }
      })
      const { data } = response

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
  }, [selectedMonth, selectedYear])

  // Function to convert events for display
  function convertEvents(events) {
    return events.map((event) => ({
      id: event?._id,
      title: event?.title,
      start: moment
        .tz(event.startDate, 'Asia/Kolkata')
        .format('YYYY-MM-DD HH:mm'),
      end: moment.tz(event?.endDate, 'Asia/Kolkata').format('YYYY-MM-DD HH:mm'),
      description: event?.description,
      backgroundColor: '#4DDB4E',
      color: 'white'
    }))
  }

  return (
    <ContentBox>
      <Grid container spacing={2}>
        {/* {hasPermission('Dashboard:LiveAnalytics') && (
          <Grid item xs={12}>
            <Box
              sx={{
                padding: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
            >
              <LiveAnalytics
                years={years}
                months={months}
                states={states}
                allProducts={allProducts}
                allCities={allCities}
                showSnackbar={showSnackbar}
                navigate={navigate}
              />
            </Box>
          </Grid>
        )} */}
        {hasPermission('Dashboard:SalesHistory') && (
          <Grid item xs={12}>
            <Box
              sx={{
                padding: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
            >
              <SalesHistory />
            </Box>
          </Grid>
        )}
        <Grid item xs={12}>
          <Box
            sx={{
              padding: '20px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }}
          >
            <TeamPerformance user={user} states={states} />
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          sm={12}
          md={any.role === 'Sales Executive' ? 12 : 12}
        >
          <Box
            sx={{
              paddingY: '20px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }}
          >
            <DashboardTabs />
          </Box>
        </Grid>

        {hasPermission('Dashboard:QuantityRecords') && (
          <Grid item xs={12} sm={12} md={6} lg={6}>
            <Box
              sx={{
                padding: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
            >
              <QuantityRecords
                years={years}
                months={months}
                states={states}
                allCities={allCities}
                allProducts={allProducts}
                allSalesExecutives={allSalesExecutives}
                showSnackbar={showSnackbar}
                allClients={allClients}
                navigate={navigate}
              />
            </Box>
          </Grid>
        )}
        {hasPermission('Dashboard:LeadOverview') && (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '350px',
                padding: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <DashboardLeadOverview />
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sm={12} md={6} lg={6}>
          <Box
            sx={{
              height: '100%',
              padding: '20px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }}
          >
            <CallStatistics allSalesExecutives={allSalesExecutives} />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              padding: '20px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }}
          >
            <IndividualPerformence states={states} />
          </Box>
        </Grid>

        {/* {hasPermission('Dashboard:OverallSalesRecord') && (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                padding: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
            >
              <SalesRecords
                years={years}
                months={months}
                states={states}
                allCities={allCities}
                allProducts={allProducts}
                allSalesExecutives={allSalesExecutives}
                showSnackbar={showSnackbar}
                navigate={navigate}
              />
            </Box>
          </Grid>
        )} */}

        <Grid
          item
          xs={12}
          md={12}
          lg={12}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              width: '100%',
              padding: '20px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }}
          >
            <CalendarForm
              open={open}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              handleClose={handleClose}
              editEvent={editEvent}
              deleteLoading={deleteLoading}
              handleAddAnnouncement={handleAddAnnouncement}
              handleUpdateAnnouncement={handleUpdateAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
            {showComponent && (
              <Calendar
                handleDateSelect={handleDateSelect}
                handleEventClick={handleEventClick}
                initialAnnouncements={announcements}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </ContentBox>
  )
}
