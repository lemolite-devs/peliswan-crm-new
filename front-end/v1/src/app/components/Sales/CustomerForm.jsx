import React, { useEffect, useState } from 'react'
import * as Yup from 'yup'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  TextField,
  InputLabel,
  Select,
  Box,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Tooltip
} from '@mui/material'
import {
  LocationOn,
  ExpandMore,
  ExpandLess,
  LocalShipping
} from '@mui/icons-material'
import { Formik, Form, ErrorMessage } from 'formik'
import InputTextField from '../InputFields/InputTextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { styled } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import { useFormikContext } from 'formik'
import axiosInstance from 'axiosInstance'
import useAuth from 'app/hooks/useAuth'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '10px',
      '&:hover': {
        background: '#555'
      }
    }
  }
}))

const saleValidationSchema = Yup.object({
  tankerNo: Yup.string().required('Tanker number is required.'),
  invoiceNo: Yup.string().required('Invoice number is required.'),
  companyName: Yup.string()
    .min(3, 'Company name must be at least 3 characters long.')
    .max(100, 'Company name must be less than or equal to 100 characters long.')
    .required('Company name is required.'),
  product: Yup.string().required('Product is required.'),
  quantity: Yup.number()
    .min(1, 'Quantity must be at least 1.')
    .required('Quantity is required.'),
  unit: Yup.string()
    .oneOf(['KL', 'MTS'], 'Unit must be one of MTS, KL.')
    .required('Unit is required.'),
  date: Yup.date()
    .required('Date is required.')
    .typeError('Date must be a valid date.'),
  density: Yup.number()
    .required('Density is required.')
    .positive('Density must be a positive number.')
    .typeError('Density must be a number.')
    .min(1, 'Density must be at greater than 1.')
    .max(2000, 'Density must be at most 2000.'),
  fullRate: Yup.number()
    .required('Full Rate is required.')
    .positive('Full Rate must be a positive number.')
    .typeError('Full Rate must be a number.'),
  gstBillName: Yup.string().notRequired(),
  gstBillPdf: Yup.mixed().notRequired(),
  convertToKL: Yup.number().optional(),
  user: Yup.mixed().notRequired()
})

const CustomerForm = ({
  open,
  dropDownOptions,
  initialSale,
  setInitialSale,
  handleSale,
  handleClose,
  initialLeadData,
  customerName,
  billingAddress,
  shippingAddress,
  selectedBillingAddress,
  selectedShippingAddress,
  setSelectedBillingAddress,
  setSelectedShippingAddress,
  selectedGst,
  setSelectedGst,
  fileData,
  setFileData,
  setGstOptions,
  gstOptions,
  orderData,
  selectedOrderId,
  setSelectedOrderId,
  isInitialSale,
  customerId,
  handleDeleteSale,
  track,
  hasPermission
}) => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [isBillingOpen, setIsBillingOpen] = useState(false)
  const [isShippingOpen, setIsShippingOpen] = useState(false)
  const [initialFormData, setInitialFormData] = useState({})
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [salesOrderId, setSalesOrderId] = useState(null)
  const [saleId, setSaleId] = useState(null)
  const [users, setUsers] = useState([])
  const { user, hasRole } = useAuth()

  useEffect(() => {
    if (initialLeadData?.gstDetails?.length > 0) {
      setGstOptions(initialLeadData.gstDetails)
    }
  }, [initialLeadData])

  useEffect(() => {
    const data =
      orderData?.find((order) => order._id === selectedOrderId) || null
    setInitialSale(data)
    setInitialFormData({
      tankerNo: isInitialSale ? data?.tankerNo : '',
      invoiceNo: isInitialSale ? data?.invoiceNo : '',
      companyName: isInitialSale ? data?.companyName : '',
      product: isInitialSale ? data?.product : '',
      quantity: isInitialSale ? data?.quantity : '',
      unit: isInitialSale ? data?.unit : '',
      date: isInitialSale ? dayjs(data?.date) : null,
      density: isInitialSale ? data?.density : '',
      fullRate: isInitialSale ? data?.fullRate : '',
      gstBillName: isInitialSale ? data?.gstBillName : selectedGst,
      gstBillPdf: isInitialSale ? data?.gstBillPdf : fileData || null,
      convertToKL: isInitialSale ? data?.convertToKL : '',
      user:
        isInitialSale && data?.user
          ? { id: data.user.id, name: data.user.name, role: data.user.role }
          : null
    })
  }, [selectedOrderId, orderData, isInitialSale, initialSale])

  const handleGstNameChange = (gstBillName, setFieldValue) => {
    const selectedGstDetails = gstOptions.find(
      (gst) => gst.name === gstBillName
    )
    if (selectedGstDetails.name) {
      setSelectedGst(selectedGstDetails.name)
      setFileData(selectedGstDetails.uploadedFile.data)
      setFieldValue('gstBillName', selectedGstDetails.name)
      setFieldValue('gstBillPdf', selectedGstDetails?.uploadedFile?.data)
    }
  }

  useEffect(() => {
    if (isInitialSale) {
      setSelectedBillingAddress(initialSale?.billingAddress)
      setSelectedShippingAddress(initialSale?.shippingAddress)
    }
    // Non-edit default/company-filtered selection is handled by AddressCompanySync
  }, [
    billingAddress,
    shippingAddress,
    isInitialSale,
    initialSale,
    selectedOrderId
  ])

  const handleBillingAddressConfirm = (address) => {
    setSelectedBillingAddress(address)
  }
  const handleShippingAddressConfirm = (address) => {
    setSelectedShippingAddress(address)
  }

  // When a company is chosen, select the latest billing AND shipping address
  // that belongs to it (or clear them when none match).
  const applyCompanyToAddresses = (company) => {
    const billingMatches = (billingAddress || []).filter(
      (a) => !company || a?.companyName === company
    )
    setSelectedBillingAddress(billingMatches[0] || null)

    const shippingMatches = (shippingAddress || []).filter(
      (a) => !company || a?.companyName === company
    )
    setSelectedShippingAddress(shippingMatches[0] || null)
  }

  const handleConfirmDelete = () => {
    if (salesOrderId && saleId) {
      handleDeleteSale(salesOrderId, saleId)
    }

    setOpenDeleteDialog(false)
  }
  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setSalesOrderId(null)
  }
  const handleDeleteClick = (itemId, saleId) => {
    setSalesOrderId(itemId)
    setSaleId(saleId)
    setOpenDeleteDialog(true)
  }

  const convertMTStoKL = (quantity, density) => {
    if (quantity && density && density !== 0) {
      return (quantity / (density * 0.001)).toFixed(2)
    }
    return '0.00'
  }

  const ConversionHandler = () => {
    const { values, setFieldValue } = useFormikContext()

    useEffect(() => {
      if (values.quantity && values.density) {
        const klValue = convertMTStoKL(values.quantity, values.density)
        setFieldValue('convertToKL', klValue)
      }
    }, [values.quantity, values.density, values.unit, setFieldValue])

    return null
  }

  // Keeps the selected billing/shipping address in sync with the chosen
  // company: when the company changes, auto-select the latest address that
  // belongs to that company (or clear it when none match).
  const AddressCompanySync = () => {
    const { values } = useFormikContext()
    const company = values.companyName

    useEffect(() => {
      if (isInitialSale) return

      const billingMatches = (billingAddress || []).filter(
        (a) => !company || a?.companyName === company
      )
      if (billingMatches.length > 0) {
        if (!billingMatches.includes(selectedBillingAddress)) {
          setSelectedBillingAddress(billingMatches[0])
        }
      } else {
        setSelectedBillingAddress(null)
      }

      const shippingMatches = (shippingAddress || []).filter(
        (a) => !company || a?.companyName === company
      )
      if (shippingMatches.length > 0) {
        if (!shippingMatches.includes(selectedShippingAddress)) {
          setSelectedShippingAddress(shippingMatches[0])
        }
      } else {
        setSelectedShippingAddress(null)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company, billingAddress, shippingAddress])

    return null
  }

  const getUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/users/lookUps')
      setUsers(response.data?.users)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  useEffect(() => {
    getUsers()
  }, [])

  return (
    <>
      <StyledDialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth
      >
        <DialogTitle
          id="form-dialog-title"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {isInitialSale ? 'Edit Order' : 'Add Order'}
          {isInitialSale && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="order-label">Order</InputLabel>
              <Select
                labelId="order-label"
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value)
                }}
                label="Option"
              >
                {orderData?.length > 0 ? (
                  orderData?.map((option) => (
                    <MenuItem value={option._id} key={option._id}>
                      {option.invoiceNo}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" key="" disabled>
                    No Orders
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        </DialogTitle>

        <Formik
          initialValues={initialFormData}
          validationSchema={saleValidationSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              setSubmitting(true)

              if (!customerName) {
                console.error(' customerName not found')
                HandleError(
                  {
                    response: {
                      status: 400,
                      data: {
                        message: 'Customer name is required'
                      }
                    }
                  },
                  showSnackbar,
                  navigate
                )
                return
              }

              if (!selectedBillingAddress) {
                console.error(' selectedBillingAddress not found')
                HandleError(
                  {
                    response: {
                      status: 400,
                      data: {
                        message: 'Please select a billing address'
                      }
                    }
                  },
                  showSnackbar,
                  navigate
                )
                return
              }

              if (!selectedShippingAddress) {
                console.error(' selectedShippingAddress not found')
                HandleError(
                  {
                    response: {
                      status: 400,
                      data: {
                        message: 'Please select a shipping address'
                      }
                    }
                  },
                  showSnackbar,
                  navigate
                )
                return
              }

              // Only include user in payload if it differs from initial user
              const { user: formUser, ...restValues } = values
              const payload = {
                billingAddress: selectedBillingAddress,
                shippingAddress: selectedShippingAddress,
                customerName,
                ...restValues
              }
              if (
                formUser &&
                (formUser.id !== initialFormData.user?.id || !isInitialSale)
              ) {
                payload.user = formUser
              }

              await handleSale(payload)
              handleClose()
              resetForm()
            } catch (error) {
              HandleError(error, showSnackbar, navigate)
              setSubmitting(false)
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({
            isSubmitting,
            handleChange,
            handleBlur,
            setFieldValue,
            values,
            errors,
            touched
          }) => {
            const filteredBillingAddress = (billingAddress || []).filter(
              (a) => !values.companyName || a?.companyName === values.companyName
            )
            const filteredShippingAddress = (shippingAddress || []).filter(
              (a) => !values.companyName || a?.companyName === values.companyName
            )
            return (
              <Form>
                <ConversionHandler />
                <AddressCompanySync />
                <DialogContent>
                  <DialogContentText>
                    {track === 'Edit' && !selectedOrderId ? (
                      <span>Please select order for edit</span>
                    ) : selectedOrderId ? null : (
                      <span>Please fill out the form to add a new order.</span>
                    )}
                  </DialogContentText>

                  <Box
                    component="form"
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      '& > *': {
                        flex: 1,
                        minWidth: '0',
                        width: { xs: '100%', sm: '48%' }
                      },
                      margin: '12px auto 4px auto'
                    }}
                  >
                    <Box
                      sx={{
                        marginTop: '8px',
                        marginBottom: '8px',
                        '& > div': {
                          position: 'relative',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 0, 0, 0.23)',
                          padding: '14px 14px',
                          fontSize: '1rem',
                          backgroundColor: 'rgba(56, 222, 44, 0.08)',
                          color: 'rgba(0, 0, 0, 0.87)',
                          cursor: 'not-allowed',
                          overflow: 'hidden'
                        }
                      }}
                    >
                      <div className="">
                        <Tooltip title={customerName || 'N/A'}>
                          <span
                            style={{
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {customerName || 'N/A'}
                          </span>
                        </Tooltip>
                      </div>
                    </Box>

                    {track === 'Edit' && !selectedOrderId ? null : (
                      <InputTextField
                        id="tankerNo"
                        name="tankerNo"
                        label="Tanker No"
                        margin="dense"
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <InputTextField
                        id="invoiceNo"
                        name="invoiceNo"
                        label="Invoice No"
                        margin="dense"
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    component="form"
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      '& > *': {
                        flex: 1,
                        minWidth: '0',
                        width: { xs: '100%', sm: '48%' }
                      },
                      margin: '12px auto 4px auto'
                    }}
                  >
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <FormControl fullWidth margin="dense">
                        <InputLabel
                          id="companyName-label"
                          style={{
                            color:
                              errors.companyName && touched.companyName
                                ? '#FF3D57'
                                : null
                          }}
                        >
                          Company Name
                        </InputLabel>
                        <Select
                          name="companyName"
                          labelId="companyName-label"
                          label="Company Name"
                          onChange={(e) => {
                            handleChange(e)
                            applyCompanyToAddresses(e.target.value)
                          }}
                          onBlur={handleBlur}
                          value={
                            initialLeadData?.companyName?.includes(
                              values.companyName
                            )
                              ? values.companyName
                              : ''
                          }
                          error={Boolean(
                            errors.companyName && touched.companyName
                          )}
                        >
                          {initialLeadData?.companyName?.length > 0 ? (
                            initialLeadData.companyName.map((companyName) => (
                              <MenuItem value={companyName} key={companyName}>
                                {companyName}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              No Company Available
                            </MenuItem>
                          )}
                        </Select>
                        <ErrorMessage
                          name="companyName"
                          component="div"
                          style={{
                            color: '#FF3D57',
                            fontWeight: 400,
                            fontSize: '0.75rem',
                            lineHeight: 1.66,
                            letterSpacing: '0.03333em',
                            textAlign: 'left',
                            marginTop: '3px',
                            marginRight: '14px',
                            marginBottom: '0',
                            marginLeft: '14px'
                          }}
                        />
                      </FormControl>
                    )}

                    {track === 'Edit' && !selectedOrderId ? null : (
                      <FormControl fullWidth margin="dense">
                        <InputLabel
                          id="gst-bill-name-label"
                          shrink={!!values.gstBillName}
                        >
                          <Box
                            sx={{
                              backgroundColor: 'white',
                              padding: '0 6px',
                              '&:focus-within': {
                                color: 'blue'
                              },
                              transition: 'color 0.3s ease'
                            }}
                          >
                            {' '}
                            GST Name
                          </Box>
                        </InputLabel>
                        <Select
                          labelId="gst-bill-name-label"
                          label="GST Name"
                          name="gstBillName"
                          value={
                            gstOptions.some(
                              (gst) => gst.name === values.gstBillName
                            )
                              ? values.gstBillName
                              : ''
                          }
                          onChange={(e) => {
                            handleChange(e)
                            handleGstNameChange(e.target.value, setFieldValue)
                          }}
                          onBlur={handleBlur}
                          error={Boolean(
                            errors.gstBillName && touched.gstBillName
                          )}
                        >
                          {gstOptions?.length > 0 ? (
                            gstOptions.map((gst) => (
                              <MenuItem value={gst.name} key={gst.name}>
                                {gst.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" key="" disabled>
                              NO GST CERTIFICATE
                            </MenuItem>
                          )}
                        </Select>

                        <ErrorMessage
                          name="gstBillName"
                          component="div"
                          style={{
                            color: '#FF3D57',
                            fontWeight: 400,
                            fontSize: '0.75rem',
                            lineHeight: 1.66,
                            letterSpacing: '0.03333em',
                            textAlign: 'left',
                            marginTop: '3px',
                            marginRight: '14px',
                            marginBottom: '0',
                            marginLeft: '14px'
                          }}
                        />
                      </FormControl>
                    )}
                  </Box>

                  <Box
                    component="form"
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      '& > *': {
                        flex: 1,
                        minWidth: '0',
                        width: { xs: '100%', sm: '48%' }
                      },
                      margin: '12px auto 4px auto'
                    }}
                  >
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <InputTextField
                        id="quantity"
                        name="quantity"
                        label="Quantity"
                        type="number"
                        margin="0"
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}

                    {track === 'Edit' && !selectedOrderId ? null : (
                      <FormControl
                        margin="normal"
                        sx={{ width: '100%', margin: 0 }}
                      >
                        <InputLabel
                          id="unit-label"
                          style={{
                            color:
                              errors.unit && touched.unit ? '#FF3D57' : null
                          }}
                        >
                          Unit
                        </InputLabel>
                        <Select
                          name="unit"
                          labelId="unit-label"
                          label="Unit"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={
                            dropDownOptions?.unitDropdownOptions?.some(
                              (unit) => unit === values?.unit
                            )
                              ? values?.unit
                              : ''
                          }
                          error={Boolean(errors?.unit && touched?.unit)}
                          sx={{ width: '100%' }}
                        >
                          {dropDownOptions?.unitDropdownOptions?.map(
                            (option) => (
                              <MenuItem value={option} key={option}>
                                {option}
                              </MenuItem>
                            )
                          )}
                        </Select>
                        <ErrorMessage
                          name="unit"
                          component="div"
                          style={{
                            color: '#FF3D57',
                            fontWeight: 400,
                            fontSize: '0.75rem',
                            lineHeight: 1.66,
                            letterSpacing: '0.03333em',
                            textAlign: 'left',
                            marginTop: '3px',
                            marginRight: '14px',
                            marginBottom: '0',
                            marginLeft: '14px'
                          }}
                        />
                      </FormControl>
                    )}
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <InputTextField
                        id="density"
                        name="density"
                        label="Density"
                        placeholder="ex.820, 800"
                        type="number"
                        margin="0"
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    component="form"
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      '& > *': {
                        flex: 1,
                        minWidth: '0',
                        width: { xs: '100%', sm: '48%' }
                      },
                      margin: '12px auto 4px auto'
                    }}
                  >
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ width: '100%' }}>
                          <DatePicker
                            label="Date"
                            format="DD/MM/YYYY"
                            value={values.date}
                            onChange={(date) => setFieldValue('date', date)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                margin="dense"
                                fullWidth
                                error={Boolean(errors.date && touched.date)}
                                helperText={
                                  errors.date && touched.date ? errors.date : ''
                                }
                              />
                            )}
                            sx={{ width: '100%' }}
                          />

                          <ErrorMessage
                            name="date"
                            component="div"
                            style={{
                              color: '#FF3D57',
                              fontWeight: 400,
                              fontSize: '0.75rem',
                              lineHeight: 1.66,
                              letterSpacing: '0.03333em',
                              textAlign: 'left',
                              marginTop: '3px',
                              marginRight: '14px',
                              marginBottom: '0',
                              marginLeft: '14px'
                            }}
                          />
                        </Box>
                      </LocalizationProvider>
                    )}
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <InputTextField
                        id="fullRate"
                        name="fullRate"
                        label="Full Rate (+18%)"
                        type="number"
                        margin="0"
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}
                    {values.unit === 'MTS' && (
                      <InputTextField
                        id="inKL"
                        name="convertToKL"
                        label="IN KL"
                        type="number"
                        margin="0"
                        disabled={true}
                        value={values?.convertToKL}
                        InputLabelProps={selectedOrderId && { shrink: true }}
                        formik={{
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    component="form"
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      '& > *': {
                        flex: 1,
                        minWidth: '0',
                        width: { xs: '100%', sm: '48%' }
                      },
                      margin: '12px auto 4px auto'
                    }}
                  >
                    {track === 'Edit' && !selectedOrderId ? null : (
                      <FormControl fullWidth margin="dense">
                        <InputLabel
                          id="product-label"
                          style={{
                            color:
                              errors.product && touched.product
                                ? '#FF3D57'
                                : null
                          }}
                        >
                          Product
                        </InputLabel>
                        <Select
                          name="product"
                          labelId="product-label"
                          label="Product"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={
                            initialLeadData?.products?.some(
                              (product) => product?._id === values.product
                            )
                              ? values.product
                              : ''
                          }
                          error={Boolean(errors.product && touched.product)}
                        >
                          {initialLeadData?.products?.length > 0 ? (
                            initialLeadData.products.map((product) => (
                              <MenuItem value={product?._id} key={product?._id}>
                                {product?.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              No Products Available
                            </MenuItem>
                          )}
                        </Select>
                        <ErrorMessage
                          name="product"
                          component="div"
                          style={{
                            color: '#FF3D57',
                            fontWeight: 400,
                            fontSize: '0.75rem',
                            lineHeight: 1.66,
                            letterSpacing: '0.03333em',
                            textAlign: 'left',
                            marginTop: '3px',
                            marginRight: '14px',
                            marginBottom: '0',
                            marginLeft: '14px'
                          }}
                        />
                      </FormControl>
                    )}

                    {track === 'Edit' && !selectedOrderId
                      ? null
                      : !hasRole('Sales Executive') && (
                          <FormControl fullWidth margin="dense">
                            <Autocomplete
                              options={users}
                              value={values.user || null}
                              onChange={(event, newValue) =>
                                setFieldValue('user', newValue || null)
                              }
                              getOptionLabel={(option) => option?.name || ''}
                              isOptionEqualToValue={(option, value) =>
                                option?.id === value?.id
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Users"
                                  variant="outlined"
                                  error={Boolean(errors.user && touched.user)}
                                  helperText={
                                    errors.user && touched.user
                                      ? errors.user
                                      : ''
                                  }
                                />
                              )}
                            />
                          </FormControl>
                        )}
                  </Box>

                  {track === 'Edit' && !selectedOrderId ? null : (
                    <Box
                      sx={{
                        margin: '4px 0',
                        border: '1.2px solid rgba(110, 110, 110, 0.47)',
                        borderRadius: '4.2px',
                        overflow: 'hidden'
                      }}
                    >
                      <Accordion
                        expanded={isBillingOpen}
                        onChange={() => setIsBillingOpen(!isBillingOpen)}
                      >
                        <AccordionSummary
                          expandIcon={
                            isBillingOpen ? (
                              <ExpandLess
                                style={{
                                  height: '22px',
                                  width: '22px',
                                  color: '#1976d2'
                                }}
                              />
                            ) : (
                              <ExpandMore
                                style={{
                                  height: '22px',
                                  width: '22px',
                                  color: '#1976d2'
                                }}
                              />
                            )
                          }
                          aria-controls="billing-address-content"
                          id="billing-address-header"
                        >
                          <Box
                            sx={{
                              margin: '0 0 0 -8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2.2px',
                              cursor: 'pointer'
                            }}
                          >
                            <LocationOn
                              style={{
                                height: '20px',
                                width: '20px',
                                color: '#1976d2'
                              }}
                            />
                            {selectedBillingAddress?.address ||
                            selectedBillingAddress?.city ||
                            selectedBillingAddress?.state ||
                            selectedBillingAddress?.zipCode ? (
                              <Typography
                                variant="h6"
                                component="span"
                                style={{
                                  fontWeight: '300',
                                  fontSize: '14px',
                                  fontWeight: '400'
                                }}
                              >
                                Billing Address:{' '}
                                {selectedBillingAddress?.address},{' '}
                                {selectedBillingAddress?.city} ,{' '}
                                {selectedBillingAddress?.state} -{' '}
                                {selectedBillingAddress?.zipCode}
                              </Typography>
                            ) : (
                              <Typography
                                variant="h6"
                                component="span"
                                style={{
                                  fontWeight: '300',
                                  fontSize: '14px',
                                  fontWeight: '400'
                                }}
                              >
                                No Billing Address{' '}
                              </Typography>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <RadioGroup
                            value={String(
                              filteredBillingAddress.findIndex(
                                (a) => a === selectedBillingAddress
                              )
                            )}
                            onChange={(event) => {
                              const address =
                                filteredBillingAddress[Number(event.target.value)]
                              handleBillingAddressConfirm(address)
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              padding: '0px'
                            }}
                          >
                            {filteredBillingAddress.map((address, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '8px',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '5px',
                                  transition: 'all 0.3s',
                                  backgroundColor:
                                    selectedBillingAddress === address
                                      ? 'rgba(102, 147, 215, 0.1)'
                                      : '#fff',
                                  borderColor:
                                    selectedBillingAddress === address
                                      ? '#1976d2'
                                      : '#e0e0e0'
                                }}
                              >
                                <FormControlLabel
                                  value={String(index)}
                                  checked={selectedBillingAddress === address}
                                  control={<Radio />}
                                  label={
                                    <Box
                                      sx={{
                                        flex: '1',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        style={{ fontWeight: '600' }}
                                      >
                                        {address?.address}
                                      </Typography>
                                      <Typography variant="body2">
                                        {address?.city}
                                      </Typography>
                                      <Typography variant="body2">
                                        {address?.city}, {address?.state} -{' '}
                                        {address?.zipCode}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Box>
                            ))}
                          </RadioGroup>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  )}

                  {track === 'Edit' && !selectedOrderId ? null : (
                    <Box
                      sx={{
                        margin: '14px 0',
                        border: '1.2px solid rgba(110, 110, 110, 0.47)',
                        borderRadius: '4.2px',
                        overflow: 'hidden'
                      }}
                    >
                      <Accordion
                        expanded={isShippingOpen}
                        onChange={() => setIsShippingOpen(!isShippingOpen)}
                      >
                        <AccordionSummary
                          expandIcon={
                            isShippingOpen ? (
                              <ExpandLess
                                style={{
                                  height: '22px',
                                  width: '22px',
                                  color: '#1976d2'
                                }}
                              />
                            ) : (
                              <ExpandMore
                                style={{
                                  height: '22px',
                                  width: '22px',
                                  color: '#1976d2'
                                }}
                              />
                            )
                          }
                          aria-controls="shipping-address-content"
                          id="shipping-address-header"
                        >
                          <Box
                            sx={{
                              margin: '0 0 0 -8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2.2px',
                              cursor: 'pointer'
                            }}
                          >
                            <LocalShipping
                              style={{
                                height: '20px',
                                width: '20px',
                                color: '#1976d2'
                              }}
                            />
                            {selectedShippingAddress?.address ||
                            selectedShippingAddress?.city ||
                            selectedShippingAddress?.state ||
                            selectedShippingAddress?.zipCode ? (
                              <Typography
                                variant="h6"
                                component="span"
                                style={{
                                  fontWeight: '300',
                                  fontSize: '14px',
                                  fontWeight: '400'
                                }}
                              >
                                Shipping Address:{' '}
                                {selectedShippingAddress?.address},{' '}
                                {selectedShippingAddress?.city} ,{' '}
                                {selectedShippingAddress?.state} -{' '}
                                {selectedShippingAddress?.zipCode}
                              </Typography>
                            ) : (
                              <Typography
                                variant="h6"
                                component="span"
                                style={{
                                  fontWeight: '300',
                                  fontSize: '14px',
                                  fontWeight: '400'
                                }}
                              >
                                {' '}
                                No Shipping Address
                              </Typography>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <RadioGroup
                            value={String(
                              filteredShippingAddress.findIndex(
                                (a) => a === selectedShippingAddress
                              )
                            )}
                            onChange={(event) => {
                              const address =
                                filteredShippingAddress[
                                  Number(event.target.value)
                                ]
                              handleShippingAddressConfirm(address)
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              padding: '0px'
                            }}
                          >
                            {filteredShippingAddress.map((address, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '8px',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '5px',
                                  transition: 'all 0.3s',
                                  backgroundColor:
                                    selectedShippingAddress === address
                                      ? 'rgba(102, 147, 215, 0.1)'
                                      : '#fff',
                                  borderColor:
                                    selectedShippingAddress === address
                                      ? '#1976d2'
                                      : '#e0e0e0'
                                }}
                              >
                                <FormControlLabel
                                  checked={selectedShippingAddress === address}
                                  value={String(index)}
                                  control={<Radio />}
                                  label={
                                    <Box
                                      sx={{
                                        flex: '1',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        style={{ fontWeight: '600' }}
                                      >
                                        {address?.address}
                                      </Typography>
                                      <Typography variant="body2">
                                        {address?.city}
                                      </Typography>
                                      <Typography variant="body2">
                                        {address?.city}, {address?.state} -{' '}
                                        {address?.zipCode}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Box>
                            ))}
                          </RadioGroup>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  )}
                </DialogContent>

                <DialogActions>
                  {selectedOrderId && hasPermission('Customers:delete') && (
                    <Button
                      onClick={() =>
                        handleDeleteClick(selectedOrderId, customerId)
                      }
                      variant="contained"
                      color="error"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={handleClose}
                    variant="contained"
                    color="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={18} />
                    ) : initialSale ? (
                      'Save Changes'
                    ) : (
                      'Save'
                    )}
                  </Button>
                </DialogActions>
              </Form>
            )
          }}
        </Formik>
      </StyledDialog>

      <ConfirmDeleteDialog
        open={openDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={customerName}
      />
    </>
  )
}

export default CustomerForm
