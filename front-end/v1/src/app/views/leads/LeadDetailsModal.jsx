import React, { useState, useEffect } from 'react'
import {
  Modal,
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Email,
  Phone,
  LocationOn,
  Business,
  Person,
  Assignment,
  Comment,
  LocalGroceryStore,
  Group,
  LocalShipping
} from '@mui/icons-material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import FactoryIcon from '@mui/icons-material/Factory'
import ApartmentIcon from '@mui/icons-material/Apartment'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import AdUnitsIcon from '@mui/icons-material/AdUnits'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import ErrorIcon from '@mui/icons-material/Error'
import styled from '@emotion/styled'
import { PersonAdd, Alarm } from '@mui/icons-material'
import { useSnackbar } from 'app/snakebarContext'
import axiosInstance from 'axiosInstance'
import { useNavigate } from 'react-router-dom'
import { HandleError } from 'app/utils/handleError'
import moment from 'moment'
import { DateRangeIcon } from '@mui/x-date-pickers'
import { DEFAULT_COUNTRY, formatPhone } from 'app/utils/constant'

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const ContentBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(4),
  width: '80%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2) // Reduced padding for mobile
  }
}))

const FieldContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2)
}))

const FieldIcon = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary
}))

const LightGreenButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#00A36C',
  color: 'white',
  marginBottom: theme.spacing(1.5),
  '&:hover': {
    backgroundColor: '#00A36C'
  },
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    marginTop: '18px',
    marginRight: '18px'
  }
}))

const CustomerChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'transparent',
  border: '2px solid #0BDA51 ',
  color: ' #0BDA51',
  marginLeft: theme.spacing(1),
  marginBottom: '10px'
}))

const LeadDetailsModal = ({
  isOpen,
  handleClose,
  lead,
  editId,
  any,
  leadViewActiveTab,
  setLeadViewActiveTab
}) => {
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleActionClick = async () => {
    try {
      const response = await axiosInstance.post(
        `/api/leads/${lead._id}/convert-to-customer`
      )
      if (response.status === 201) {
        showSnackbar({
          message: 'Lead successfully converted to customer!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        navigate(`/customers?showModal=true&id=${lead._id}`)
        handleClose()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error converting lead to customer:', error)
    }
  }

  if (!lead) {
    return null
  }

  const {
    customerName = 'N/A',
    companyName = 'N/A',
    email = 'N/A',
    status = 'N/A',
    country = DEFAULT_COUNTRY,
    state = 'N/A',
    city = 'N/A',
    products = [],
    quantity = 'N/A',
    representative = 'N/A',
    competitorName = 'N/A',
    competitorRate = null,
    zipCode = 'N/A',
    deliveryDestination = 'N/A',
    inquiries = 'N/A',
    remark = 'N/A',
    unit = 'N/A',
    comments = 'N/A',
    isCustomer = false,
    meeting = false,
    meetingType = '',
    visitPlant = false,
    visitOffice = false,
    requestSample = false,
    createdAt = null,
    assignedTo = null
  } = lead

  // Numbers are stored bare; the lead's dial code is prefixed for display.
  const formattedMobileNumbers =
    (Array.isArray(lead.mobileNumber) ? lead.mobileNumber : [lead.mobileNumber])
      .filter(Boolean)
      .map((number) => formatPhone(number, lead))
      .join(' , ') || 'N/A'

  const handleTabChange = (event, newValue) => {
    setLeadViewActiveTab(newValue)
  }

  return (
    <StyledModal
      open={isOpen}
      onClose={() => {
        handleClose()
        setLeadViewActiveTab(0)
      }}
    >
      <ContentBox>
        <Tabs
          value={leadViewActiveTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          allowScrollButtonsMobile={true} // Enable scroll buttons on mobile
          sx={{
            justifyContent: 'flex-start',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          <Tab label="Lead Details" />
          <Tab label="Reminders" />
          <Tab label="Activities" />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={leadViewActiveTab} index={0}>
          {/* Lead Details Content */}
          <Box
            display="flex"
            alignItems="center"
            // justifyContent="space-between"
            justifyContent={isMobile ? 'center' : 'space-between'}
          >
            <Typography variant="h6" gutterBottom></Typography>
            {isCustomer && <CustomerChip label="Customer" />}
            {!isCustomer && (
              <LightGreenButton
                variant="contained"
                startIcon={<PersonAdd style={{ color: 'white' }} />}
                onClick={handleActionClick}
              >
                Convert To Customer
              </LightGreenButton>
            )}
          </Box>
          <Divider />
          <Box mt={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FieldContainer>
                  <FieldIcon>
                    <Person />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Customer Name:</strong> {customerName}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Business />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Company Name:</strong>{' '}
                    {companyName?.length > 0 ? companyName?.join(' , ') : 'N/A'}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Email />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Email Address:</strong> {email}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Phone />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Mobile no.:</strong> {formattedMobileNumbers}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <LocationOn />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Country:</strong> {country}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <LocationOn />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>
                      {country === 'Nepal' ? 'Province' : 'State'}:
                    </strong>{' '}
                    {state}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <LocationOn />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>City:</strong> {city}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <LocationOn />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Zip Code:</strong> {zipCode}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Group />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Representative:</strong> {representative}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Alarm />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Meeting:</strong>{' '}
                    {meeting
                      ? meetingType === 'hotMeeting'
                        ? 'Hot Meeting'
                        : 'Normal Meeting'
                      : 'No'}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <RequestQuoteIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Request Sample: </strong>{' '}
                    {requestSample ? 'Yes' : 'No'}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <AcUnitIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Status:</strong> {status}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <ApartmentIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Visit Office: </strong> {visitOffice ? 'Yes' : 'No'}
                  </Typography>
                </FieldContainer>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldContainer>
                  <FieldIcon>
                    <DateRangeIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Date: </strong>{' '}
                    {createdAt ? moment(createdAt).format('DD-MM-YYYY') : 'N/A'}
                  </Typography>
                </FieldContainer>

                {any.role !== 'Sales Executive' && (
                  <FieldContainer>
                    <FieldIcon>
                      <PersonAddIcon />
                    </FieldIcon>
                    <Typography variant="body1">
                      <strong>Assigned To: </strong>{' '}
                      {assignedTo && assignedTo?.name
                        ? assignedTo?.name
                        : 'N/A'}
                    </Typography>
                  </FieldContainer>
                )}

                <FieldContainer>
                  <FieldIcon>
                    <LocalGroceryStore />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Products:</strong>{' '}
                    {products.length > 0
                      ? products.map((product) => product.name).join(', ')
                      : 'N/A'}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <ProductionQuantityLimitsIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Quantity:</strong> {quantity}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <AdUnitsIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Unit:</strong> {unit}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <LocalShipping />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Delivery-Destination:</strong>
                    {Array.isArray(deliveryDestination) &&
                    deliveryDestination.length > 0
                      ? deliveryDestination.join(', ')
                      : 'N/A'}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Assignment />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Competitor:</strong> {competitorName}
                    {competitorRate != null && competitorRate !== ''
                      ? ` — Rate: ${competitorRate}`
                      : ''}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <ErrorIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Inquiry:</strong> {inquiries}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Assignment />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Remarks:</strong> {remark}
                  </Typography>
                </FieldContainer>
                <FieldContainer>
                  <FieldIcon>
                    <Comment />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Comments:</strong> {comments}
                  </Typography>
                </FieldContainer>

                <FieldContainer>
                  <FieldIcon>
                    <FactoryIcon />
                  </FieldIcon>
                  <Typography variant="body1">
                    <strong>Visit Plant: </strong> {visitPlant ? 'Yes' : 'No'}
                  </Typography>
                </FieldContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={leadViewActiveTab} index={1}>
          {/* Reminders List */}
          <Box mt={2}>
            <TableContainer sx={{ padding: '5px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>No.</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Message</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lead?.reminders?.length ? (
                    lead.reminders.map((reminder, index) => (
                      <TableRow key={reminder._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {moment(reminder.dueDate).format(
                            'MMMM Do YYYY, h:mm a'
                          )}
                        </TableCell>
                        <TableCell>{reminder.message}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3}>No reminders available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={leadViewActiveTab} index={2}>
          {/* Acctivity List */}
          <Box mt={2}>
            <TableContainer
              component={Paper}
              sx={{ marginTop: '20px', padding: '0 1.2rem' }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>User</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Activities</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lead.activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {activity.user?.name || 'Unknown User'}
                        </Typography>
                      </TableCell>
                      <TableCell variant="caption" sx={{ color: '#808080' }}>
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {moment(activity.createdAt).format('MM-DD-YYYY')}
                        </Typography>{' '}
                        <br />
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {moment(activity.createdAt).format('h:mm:ss A')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#808080',
                            wordBreak: 'break-word'
                          }}
                        >
                          {activity.description}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </ContentBox>
    </StyledModal>
  )
}

// TabPanel component to handle content display based on selected tab
const TabPanel = (props) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default LeadDetailsModal
