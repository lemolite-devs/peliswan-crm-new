import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  TextField,
  IconButton,
  Autocomplete,
  Grid
} from '@mui/material'
import styled from '@emotion/styled'
import { Breadcrumb } from 'app/components'
import SearchIcon from '@mui/icons-material/Search'
import axiosInstance from 'axiosInstance'
import { HandleError } from 'app/utils/handleError'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'app/snakebarContext'
import CustomerForm from 'app/components/Sales/CustomerForm'
import CustomersTable from 'app/components/Sales/CustomersTable'
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CustomerDetailsModel from 'app/components/Sales/CustomerDetailsModel'
import useAuth from 'app/hooks/useAuth'
import { useContext } from 'react'
import AuthContext from 'app/contexts/JWTAuthContext'

const Container = styled('div')(({ theme }) => ({
  margin: '15px',
  [theme.breakpoints.down('md')]: { margin: '15px' },
  '& .breadcrumb': {
    marginBottom: '5px'
  }
}))

const dropDownOptions = {
  unitDropdownOptions: ['KL', 'MTS']
}

const CustomersList = () => {
  const [open, setOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalData, setDetailsModalData] = useState(null)
  const [detailsModalId, setDetailsModalId] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [allCustomers, setAllCustomers] = useState([])
  const [allClients, setAllClients] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [allRole, setAllRole] = useState([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [initialSale, setInitialSale] = useState(null)
  const [isInitialSale, setIsInitialSale] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [loading, setLoading] = useState(false)
  const { hasPermission } = useAuth()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [filter, setFilter] = useState({
    customerName: null,
    date: null,
    companyName: null,
    product: null,
    addedBy: null,
    assignedTo: null
  })
  const [allSalesExecutives, setAllSalesExecutives] = useState([])
  const location = useLocation()
  const [leadId, setLeadId] = useState(null)
  const [initialLeadData, setInitialLeadData] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [leadCompany, setLeadCompany] = useState([])
  const [rowId, setRowId] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderData, setOrderData] = useState([])
  const [billingAddress, setBillingAddress] = useState([])
  const [shippingAddress, setShippingAddress] = useState([])
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(
    billingAddress && billingAddress.length > 0 ? billingAddress[0] : null
  )
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(
    shippingAddress && shippingAddress.length > 0 ? shippingAddress[0] : null
  )
  const [selectedGst, setSelectedGst] = useState('')
  const [fileData, setFileData] = useState(null)
  const [gstOptions, setGstOptions] = useState([])
  const [track, setTrack] = useState(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const { user } = useContext(AuthContext)

  const fetchAllRoles = async () => {
    try {
      const response = await axiosInstance.get('/api/roles')
      if (response.data && Array.isArray(response.data)) {
        const roles = response.data.map((role) => ({
          value: role?.name,
          id: role?._id
        }))
        setAllRole(roles)
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  // const fetchAllCompanyName = async () => {
  //   try {
  //     const response = await axiosInstance.get('/api/company-name/lookups')
  //     const data = response.data || []
  //     setAllCompanyName(data)
  //   } catch (error) {
  //     HandleError(error, showSnackbar, navigate)
  //     console.error('Error fetching data:', error)
  //   }
  // }

  const getAllCustomerName = async () => {
    try {
      const response = await axiosInstance.get('/api/customers/lookUps')
      const data = response.data?.clients || []
      setAllClients(data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching data:', error)
    }
  }

  // const getAllProducts = async (page, rowsPerPage) => {
  //   try {
  //     const response = await axiosInstance.get('/api/items/lookUps')
  //     const data = response.data?.items || []
  //     setAllProducts(data)
  //   } catch (error) {
  //     HandleError(error, showSnackbar, navigate)
  //     console.error('Error fetching data:', error)
  //   }
  // }

  const getAllSalesExecutives = async () => {
    try {
      const response = await axiosInstance.get('/api/users/lookUps', {
        params: { allowRole: ['Sales Executive', 'Sales Manager'] }
      })
      setAllSalesExecutives(response.data?.users || [])
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  const getAllSalesData = async (page, rowsPerPage, filters) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/customers', {
        params: {
          page,
          rowsPerPage,
          customerName: filters?.customerName?.id,
          product: filters?.product?.key,
          date: filters?.date,
          companyName: filters?.companyName,
          addedBy: filters?.addedBy,
          assignedTo: filters?.assignedTo?.id
        }
      })

      setAllCustomers(() => response.data?.customers || [])
      setTotalCustomers(() => response.data?.totalCustomers)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  const handleClickOpen = (saleId = null, name = null) => {
    setOpen(true)
    setLeadId(saleId)
    setCustomerName(name)
    setRowId(saleId)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingSale(null)
    setInitialSale(null)
    setLeadId(null)
    setInitialLeadData(null)
    setCustomerName('')
    setRowId(null)
    setSelectedBillingAddress(null)
    setSelectedShippingAddress(null)
    setSelectedGst(null)
    setFileData(null)
    setCustomerId(null)
    setOrderData([])
    setIsInitialSale(false)
    setSelectedOrderId(null)
    setTrack(null)
    navigate('/customers', { replace: true })
  }

  const handleViewClick = (sale) => {
    setDetailsModalOpen(true)
    setDetailsModalId(sale?._id)
    setTrack('Add')
  }
  const handleViewClose = () => {
    setDetailsModalOpen(false)
    setDetailsModalId(null)
    setDetailsModalData(null)
  }
  const handleEdit = async (sale, rowId, name) => {
    setOpen(true)
    setEditingSale(sale?._id)
    setIsInitialSale(true)
    setRowId(rowId)
    setCustomerId(sale?._id)
    setCustomerName(name)
    setTrack('Edit')
  }

  const handleAddSale = async (sale) => {
    const result = await axiosInstance.post(
      `/api/customers?leadId=${leadId || ''}`,
      {
        ...sale,
        density: Number(sale?.density),
        day: sale?.date?.$D,
        month: sale?.date?.$M + 1,
        year: sale?.date?.$y
      }
    )
    if (result.status === 201) {
      showSnackbar({
        message: 'Sale data added successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      // await fetchAllCompanyName()
      await getAllSalesData(page + 1, rowsPerPage, filter)
    }
  }

  const handleUpdateSale = async (sale) => {
    const result = await axiosInstance.put(
      `/api/customers/${selectedOrderId}`,
      {
        ...sale,
        density: Number(sale?.density),
        day: sale?.date.$D,
        month: sale?.date?.$M + 1,
        year: sale?.date?.$y
      }
    )
    if (result.status === 200) {
      showSnackbar({
        message: 'Sale data updated successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      // await fetchAllCompanyName()
      await getAllSalesData(page + 1, rowsPerPage, filter)
    }
  }

  const handleDeleteSale = async (saleOrderId, customerId) => {
    const result = await axiosInstance.delete(
      `/api/customers/${customerId}?salesOrderId=${saleOrderId}`
    )
    if (result.status === 200) {
      showSnackbar({
        message: 'Sale data deleted successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      handleClose()
      await getAllSalesData(page + 1, rowsPerPage, filter)
    }
  }

  const handleSearch = async () => {
    setPage(0)
    await getAllSalesData(1, rowsPerPage, filter)
  }
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  useEffect(() => {
    fetchAllRoles()
    // fetchAllCompanyName()
    getAllCustomerName()
    getAllSalesExecutives()
    // getAllProducts()
  }, [])

  useEffect(() => {
    getAllSalesData(page + 1, rowsPerPage, filter)
  }, [page, rowsPerPage])

  const getLeadById = async (id) => {
    try {
      const response = await axiosInstance.get(
        `/api/leads/${id}?isCustomer=true`
      )
      if (response.status === 200 && response.data) {
        setInitialLeadData(response.data.lead)
        setCustomerName(response.data.lead?.customerName)
        setLeadCompany(response.data.lead.companyName)
        setBillingAddress(
          response.data.lead.addresses
            ?.map((address) => ({
              companyName: address?.companyName,
              ...address?.billingAddress
            }))
            .reverse()
        )
        setShippingAddress(
          response.data.lead.addresses
            ?.map((address) => ({
              companyName: address?.companyName,
              ...address?.shippingAddress
            }))
            .reverse()
        )
      }
    } catch (error) {
      if (error.code === 404)
        HandleError('Lead not found', showSnackbar, navigate)
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching lead details:', error)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const showModal = params.get('showModal')
    const id = params.get('id')
    if (showModal === 'true') {
      handleClickOpen()
    }
    if (id) {
      setLeadId(id)
      getLeadById(id)
    }
  }, [location.search])

  useEffect(() => {
    if (rowId) getLeadById(rowId)
  }, [rowId])

  const getOrders = async (id) => {
    setOrderLoading(true)
    try {
      const response = await axiosInstance.get(`/api/customers/${id}`)
      if (response.status === 200) {
        setOrderData(response.data?.customer?.salesOrders || [])
        setDetailsModalData(response.data?.customer || [])
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching orders:', error)
    } finally {
      setOrderLoading(false)
    }
  }
  useEffect(() => {
    if (detailsModalId) getOrders(detailsModalId)
  }, [detailsModalId])

  useEffect(() => {
    if (customerId) getOrders(customerId)
  }, [customerId])

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Customers' }]} />
      </Box>
      <Grid container columnGap={1} rowGap={2} justifyContent={'end'}>
        {/* Right-aligned filters */}

        <Grid item xs={12} sm={12} md={3} lg={2}>
          {user.role === 'Admin' && (
            <Autocomplete
              options={allClients}
              value={filter.customerName}
              onChange={(event, newValue) =>
                setFilter((prev) => ({ ...prev, customerName: newValue }))
              }
              getOptionLabel={(option) => option?.customerName}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Name"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={12} md={3} lg={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDatePicker
              onChange={(date) =>
                setFilter((prev) => ({ ...prev, date: date }))
              }
              format="DD-MM-YYYY"
              slotProps={{
                field: {
                  clearable: true,
                  onClear: () => setFilter((prev) => ({ ...prev, date: null }))
                },
                textField: {
                  sx: {
                    flexGrow: 1,
                    minWidth: '160px',
                    width: { xs: '100%', sm: '100%' }
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* <Grid item xs={12} sm={12} md={3} lg={2}>
          <Autocomplete
            size="small"
            options={allCompanyName}
            value={filter?.companyName}
            onChange={(event, newValue) =>
              setFilter((prev) => ({ ...prev, companyName: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company Name"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid> */}

        {/* <Grid item xs={12} sm={12} md={3} lg={2}>
          {' '}
          <Autocomplete
            size="small"
            options={allProducts}
            value={filter?.product?.value}
            onChange={(event, newValue) =>
              setFilter((prev) => ({ ...prev, product: newValue }))
            }
            getOptionLabel={(option) => option?.value || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid> */}

        <Grid item xs={12} sm={12} md={3} lg={2}>
          <Autocomplete
            autoWidth={true}
            options={allRole}
            value={filter?.addedBy?.value}
            onChange={(event, newValue) =>
              setFilter((prev) => ({ ...prev, addedBy: newValue?.value }))
            }
            getOptionLabel={(option) => option?.value || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Added By"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={2}>
            <Autocomplete
              options={allSalesExecutives}
              value={filter.assignedTo}
              onChange={(event, newValue) =>
                setFilter((prev) => ({ ...prev, assignedTo: newValue }))
              }
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assigned To"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            sx={{
              display: {
                xs: 'flex',
                sm: 'none'
              },
              width: '100%'
            }}
          >
            Search
          </Button>
          <IconButton
            color="primary"
            onClick={handleSearch}
            aria-label="search"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Grid>
        {/* parent grid */}
      </Grid>
      <CustomerDetailsModel
        detailsModalOpen={detailsModalOpen}
        detailsModalData={detailsModalData}
        handleViewClose={handleViewClose}
        orderLoading={orderLoading}
      />
      <CustomerForm
        open={open}
        allClients={allClients}
        allProducts={allProducts}
        dropDownOptions={dropDownOptions}
        initialSale={initialSale}
        setInitialSale={setInitialSale}
        handleSale={editingSale ? handleUpdateSale : handleAddSale}
        handleClose={handleClose}
        initialLeadData={initialLeadData}
        customerName={customerName}
        leadCompany={leadCompany}
        billingAddress={billingAddress}
        shippingAddress={shippingAddress}
        selectedBillingAddress={selectedBillingAddress}
        selectedShippingAddress={selectedShippingAddress}
        setSelectedBillingAddress={setSelectedBillingAddress}
        setSelectedShippingAddress={setSelectedShippingAddress}
        selectedGst={selectedGst}
        setSelectedGst={setSelectedGst}
        fileData={fileData}
        setFileData={setFileData}
        setGstOptions={setGstOptions}
        gstOptions={gstOptions}
        customerId={customerId}
        setCustomerId={setCustomerId}
        orderData={orderData}
        selectedOrderId={selectedOrderId}
        setSelectedOrderId={setSelectedOrderId}
        isInitialSale={isInitialSale}
        handleDeleteSale={handleDeleteSale}
        track={track}
        hasPermission={hasPermission}
      />

      <CustomersTable
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        allCustomers={allCustomers}
        allClients={allClients}
        allProducts={allProducts}
        totalCustomers={totalCustomers}
        hasPermission={hasPermission}
        dropDownOptions={dropDownOptions}
        handleViewClick={handleViewClick}
        handleEdit={handleEdit}
        handleDeleteSale={handleDeleteSale}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        handleClickOpen={handleClickOpen}
        customerName={customerName}
        setCustomerName={setCustomerName}
      />
    </Container>
  )
}

export default CustomersList
