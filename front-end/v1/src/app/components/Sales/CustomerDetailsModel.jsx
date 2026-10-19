import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Grid,
  Box,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptIcon from '@mui/icons-material/Receipt'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ScaleIcon from '@mui/icons-material/Scale'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import OpacityIcon from '@mui/icons-material/Opacity'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import moment from 'moment'
import { useState, useEffect, useMemo } from 'react'

const OrderCard = ({ order, index, totalCount }) => {
  const handlePdfClick = async (pdfDataArray) => {
    try {
      if (Array.isArray(pdfDataArray?.data)) {
        const bytesArray = new Uint8Array(pdfDataArray?.data)
        const url = new Blob([bytesArray], { type: 'application/pdf' })
        const pdfUrl = URL.createObjectURL(url)
        window.open(pdfUrl, '_blank')
      } else {
        console.error('Invalid PDF data array:', pdfDataArray)
      }
    } catch (error) {
      console.error('Error opening PDF:', error)
    }
  }

  return (
    <Accordion
      defaultExpanded={index === 1}
      sx={{
        mb: '-5px',
        '&:before': {
          display: 'none'
        },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        boxShadow: 'none',
        '&:first-of-type': {
          borderRadius: '8px !important'
        },
        '&:last-of-type': {
          borderRadius: '8px !important'
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', sm: 'column', md: 'row' }
          }
        }}
      >
        <Typography variant="h6" color="primary" textAlign="center">
          Order {index}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            marginTop: '3px',
            marginLeft: '20px',
            color: 'grey.600',
            fontSize: '16px'
          }}
        >
          IN : {order.invoiceNo}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            marginTop: '3px',
            marginLeft: '20px',
            color: 'grey.600',
            fontSize: '16px'
          }}
        >
          TN : {order.tankerNo}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            marginTop: '3px',
            marginLeft: '20px',
            color: 'grey.600',
            fontSize: '16px'
          }}
        >
          Date : {moment(order.date).format('DD-MM-YYYY')}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReceiptIcon color="action" sx={{ mr: 2 }} />
              <Typography>Invoice No: {order.invoiceNo}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <BusinessIcon color="action" sx={{ mr: 2 }} />
              <Typography>Company: {order.companyName}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <ScaleIcon color="action" sx={{ mr: 2 }} />
              <Typography>
                Quantity: {order.quantity} {order.unit}
              </Typography>
            </Box>

            {order?.gstBillName && (
              <Box display="flex" alignItems="center">
                <OpenInNewIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  GST CERTIFICATE:{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePdfClick(order?.gstBillPdf)
                    }}
                    style={{ textDecoration: 'none', color: 'blue' }}
                  >
                    View
                  </a>
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <OpacityIcon color="action" sx={{ mr: 2 }} />
              <Typography>Density: {order.density}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <AttachMoneyIcon color="action" sx={{ mr: 2 }} />
              <Typography>
                Full Rate: ₹{order.fullRate?.toLocaleString()}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <PersonIcon color="action" sx={{ mr: 2 }} />
              <Typography variant="subtitle1">
                Added By:{' '}
                {order?.user?.name?.charAt(0)?.toUpperCase() +
                  order?.user?.name?.slice(1)}{' '}
                ( {order?.addedBy} )
              </Typography>
            </Box>
          </Grid>

          {/* Addresses */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'background.default',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOnIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Address
                </Typography>
              </Box>
              <Typography>
                {order.billingAddress?.address}, {order.billingAddress?.city}
              </Typography>
              <Typography>
                {order.billingAddress?.state} - {order.billingAddress?.zipCode}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'background.default',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <LocalShippingIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Shipping Address
                </Typography>
              </Box>
              <Typography>
                {order.shippingAddress?.address}, {order.shippingAddress?.city}
              </Typography>
              <Typography>
                {order.shippingAddress?.state} -{' '}
                {order.shippingAddress?.zipCode}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

const CustomerDetailsModel = ({
  detailsModalOpen,
  detailsModalData,
  handleViewClose,
  orderLoading
}) => {
  const [orderCount, setOrderCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  // Paginate orders (reverse to show latest first)
  const paginatedOrders = useMemo(() => {
    if (!detailsModalData?.salesOrders) return []

    const reversedOrders = [...detailsModalData.salesOrders].reverse()
    const startIndex = page * rowsPerPage
    return reversedOrders.slice(startIndex, startIndex + rowsPerPage)
  }, [detailsModalData?.salesOrders, page, rowsPerPage])

  useEffect(() => {
    if (orderCount <= detailsModalData?.salesOrders?.length) {
      const fastInterval = setInterval(() => {
        setOrderCount((prev) => {
          if (prev < detailsModalData?.salesOrders?.length) {
            return prev + 1
          } else {
            clearInterval(fastInterval)
            return prev
          }
        })
      }, 30)

      return () => clearInterval(fastInterval)
    }
  }, [orderCount, detailsModalData?.salesOrders?.length])

  const handleClose = () => {
    handleViewClose()
    setOrderCount(0)
    setPage(0)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Dialog
      open={detailsModalOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" color="primary">
            Customer Order Details
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
      </DialogTitle>
      <DialogContent>
        {orderLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
          </Box>
        ) : detailsModalData?._id ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="flex-start" sx={{ minWidth: 0 }}>
                      <PersonIcon color="primary" sx={{ mr: 2 }} />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word'
                        }}
                      >
                        Customer Name: {detailsModalData?.leadId?.customerName}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center">
                      <PersonIcon color="action" sx={{ mr: 2 }} />
                      <Typography variant="subtitle1">
                        Added By:{' '}
                        {detailsModalData?.user?.name
                          ?.charAt(0)
                          ?.toUpperCase() +
                          detailsModalData?.user?.name?.slice(1)}{' '}
                        ( {detailsModalData?.addedBy} )
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{
                        justifyContent: {
                          xs: 'flex-start',
                          sm: 'flex-start',
                          md: 'center'
                        }
                      }}
                    >
                      <ShoppingCartIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        Total Orders: {orderCount}{' '}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sales Orders */}
            {detailsModalData?.salesOrders?.length > 0 ? (
              <>
                {paginatedOrders.map((order, index) => (
                  <Grid item xs={12} key={order._id}>
                    <OrderCard
                      order={order}
                      index={
                        detailsModalData?.salesOrders?.length -
                        (page * rowsPerPage + index)
                      }
                      totalCount={detailsModalData?.salesOrders?.length}
                    />
                  </Grid>
                ))}

                {/* Pagination */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <TablePagination
                      component="div"
                      count={detailsModalData?.salesOrders?.length || 0}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                      labelRowsPerPage="Orders per page:"
                    />
                  </Box>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  align="center"
                >
                  No sale orders available.
                </Typography>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography align="center">No order details available.</Typography>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CustomerDetailsModel
