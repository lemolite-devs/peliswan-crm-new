import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Divider,
  Paper
} from '@mui/material'
import ReceiptIcon from '@mui/icons-material/Receipt'
import BusinessIcon from '@mui/icons-material/Business'
import ScaleIcon from '@mui/icons-material/Scale'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import OpacityIcon from '@mui/icons-material/Opacity'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'

const OrderDetailsDialog = ({
  open,
  onClose,
  selectedOrder,
  getSrNo,
  handlePdfClick,
  formatAddress
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" color="primary">
            Order :- {selectedOrder ? getSrNo(selectedOrder) : ''}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
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
        {selectedOrder ? (
          <Grid container spacing={2}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <ReceiptIcon color="action" sx={{ mr: 2 }} />
                <Typography>Invoice No: {selectedOrder.invoiceNo}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon color="action" sx={{ mr: 2 }} />
                <Typography>Company: {selectedOrder.companyName}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <ScaleIcon color="action" sx={{ mr: 2 }} />
                <Typography>
                  Quantity: {selectedOrder.quantity} {selectedOrder.unit}
                </Typography>
              </Box>
              {selectedOrder?.gstBillName && (
                <Box display="flex" alignItems="center">
                  <OpenInNewIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    GST Certificate:{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePdfClick(selectedOrder?.gstBillPdf)
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
                <CalendarTodayIcon color="action" sx={{ mr: 2 }} />
                <Typography>
                  Date: {new Date(selectedOrder.date).toLocaleDateString()}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <OpacityIcon color="action" sx={{ mr: 2 }} />
                <Typography>Density: {selectedOrder.density}</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <AttachMoneyIcon color="action" sx={{ mr: 2 }} />
                <Typography>
                  Rate: ₹{selectedOrder.fullRate || selectedOrder.rate}
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
                  {formatAddress(selectedOrder.billingAddress)}
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
                  {formatAddress(selectedOrder.shippingAddress)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography align="center">No order details available.</Typography>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OrderDetailsDialog
