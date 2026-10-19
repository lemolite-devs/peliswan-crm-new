import styled from '@emotion/styled'
import { useSnackbar } from 'app/snakebarContext'
import axiosInstance from 'axiosInstance'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import AdUnitsIcon from '@mui/icons-material/AdUnits'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import ErrorIcon from '@mui/icons-material/Error'
import styled from '@emotion/styled'
import { PersonAdd, Alarm } from '@mui/icons-material'
import {
  Modal,
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  Chip
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
  borderRadius: theme.shape.borderRadius
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
  alignItems: 'center'
}))

const CustomerChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'transparent',
  border: '2px solid #0BDA51 ',
  color: ' #0BDA51',
  marginLeft: theme.spacing(1),
  marginBottom: '10px'
}))

const LeadDetail = ({ isOpen, handleClose, lead }) => {
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

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
        handleClose()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error converting lead to customer:', error)
      // showSnackbar('Failed to convert lead to customer.', 'error')
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
    meeting = false
  } = lead

  // Numbers are stored bare; the lead's dial code is prefixed for display.
  const formattedMobileNumbers =
    (Array.isArray(lead.mobileNumber) ? lead.mobileNumber : [lead.mobileNumber])
      .filter(Boolean)
      .map((number) => formatPhone(number, lead))
      .join(', ') || 'N/A'

  return (
    <StyledModal open={isOpen} onClose={handleClose}>
      <ContentBox>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" gutterBottom>
            Lead Details
          </Typography>
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
                  <strong>Company Name:</strong> {companyName}
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
                  <strong>Mobile no:</strong> {formattedMobileNumbers}
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
                  <strong>{country === 'Nepal' ? 'Province' : 'State'}:</strong>{' '}
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
                  <strong>Meeting:</strong> {meeting ? 'Yes' : 'No'}
                </Typography>
              </FieldContainer>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
          </Grid>
        </Box>
      </ContentBox>
    </StyledModal>
  )
}

export default LeadDetail
