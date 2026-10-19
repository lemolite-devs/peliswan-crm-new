import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Breadcrumbs,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  styled,
  TablePagination,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import HomeIcon from '@mui/icons-material/Home'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import OrderDetailsDialog from './OrderDetailsDialog'

const SrNoTableCell = styled(TableCell)(({ theme }) => ({
  width: '60px',
  minWidth: '60px',
  padding: '4px 8px',
  fontSize: '0.75rem',
  textAlign: 'left'
}))

const StyledTable = styled(Table)(({ theme }) => ({
  whiteSpace: 'nowrap',
  '& thead': {
    '& tr': {
      '& th': {
        padding: '4px 8px',
        fontSize: '0.75rem',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        backgroundColor: theme.palette.grey[100]
      }
    }
  },
  '& tbody': {
    '& tr': {
      '& td': {
        padding: '2px 8px',
        fontSize: '0.75rem',
        textTransform: 'capitalize',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        height: '32px'
      }
    }
  }
}))

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

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 5; i >= 0; i--) {
    years.push(currentYear - i)
  }
  return years
}

const years = generateYears()

const IndividualPerformance = () => {
  const navigate = useNavigate()
  const params = useParams()

  const userId = params.userId || params.teamId || params.id

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedUser, setSelectedUser] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [totalSaleQuantity, setTotalSaleQuantity] = useState(0)
  const [targetQuantity, setTargetQuantity] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [totalCount, setTotalCount] = useState(0)
  const { showSnackbar } = useSnackbar()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

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

  const getAllUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await axiosInstance.get('/api/users/lookUps')
      const data = response.data?.users || []
      if (!data.length) {
        setAllUsers([])
        setUsersLoading(false)
        return
      }
      setAllUsers(data)
      if (userId) {
        const userExists = data.find(
          (user) =>
            user._id === userId || user.id === userId || user.userId === userId
        )
        if (userExists) {
          setSelectedUser(userId)
        } else {
          const firstUserId = data[0]._id || data[0].id || data[0].userId
          if (firstUserId) {
            setSelectedUser(firstUserId)
            navigate(`/details-page/${firstUserId}`, { replace: true })
          } else {
            showSnackbar({
              message: 'Users data format is invalid - no ID field found',
              severity: 'error',
              vertical: 'top',
              horizontal: 'right'
            })
          }
        }
      } else {
        const firstUserId = data[0]._id || data[0].id || data[0].userId
        if (firstUserId) {
          setSelectedUser(firstUserId)
          navigate(`/details-page/${firstUserId}`, { replace: true })
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      HandleError(error, showSnackbar, navigate)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchSalesData = async () => {
    if (!selectedUser) return
    try {
      setLoading(true)
      setSalesData([])
      setTotalSaleQuantity(0)
      setTargetQuantity(0)
      setTotalCount(0)
      const apiUrl = `/api/sales/user/${selectedUser}?month=${selectedMonth}&year=${selectedYear}&page=${page + 1}&limit=${rowsPerPage}`
      const res = await axiosInstance.get(apiUrl)
      const {
        sales = [],
        totalSaleQuantity = 0,
        targetQuantity = 0,
        totalCount = 0
      } = res.data?.data || {}
      setSalesData(sales)
      setTotalSaleQuantity(totalSaleQuantity)
      setTargetQuantity(targetQuantity)
      setTotalCount(totalCount)
    } catch (error) {
      console.error('Failed to fetch sales data:', error)
      setSalesData([])
      setTotalSaleQuantity(0)
      setTargetQuantity(0)
      setTotalCount(0)
      showSnackbar({
        message: error.response?.data?.message || 'Failed to fetch sales data',
        severity: 'error',
        vertical: 'top',
        horizontal: 'right'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewClick = (sale) => {
    setSelectedOrder(sale)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedOrder(null)
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  useEffect(() => {
    if (selectedUser && !usersLoading) {
      fetchSalesData()
    }
  }, [
    selectedUser,
    selectedMonth,
    selectedYear,
    usersLoading,
    page,
    rowsPerPage
  ])

  const getUserId = (user) => {
    return user._id || user.id || user.userId
  }

  const getUserName = (user) => {
    return user.name || user.username || user.displayName || 'Unknown User'
  }

  const handleUserChange = (e) => {
    const newUserId = e.target.value
    if (newUserId && newUserId !== selectedUser) {
      setSelectedUser(newUserId)
      setPage(0)
      navigate(`/details-page/${newUserId}`)
    }
  }

  const handleMonthChange = (e) => {
    const newMonth = e.target.value
    setSelectedMonth(newMonth)
    setPage(0)
  }

  const handleYearChange = (e) => {
    const newYear = e.target.value
    setSelectedYear(newYear)
    setPage(0)
  }

  const getCurrentUserName = () => {
    if (usersLoading) return 'Loading users...'
    if (!selectedUser || !allUsers.length) return 'No user selected'
    const currentUser = allUsers.find(
      (user) => getUserId(user) === selectedUser
    )
    return currentUser ? getUserName(currentUser) : 'User not found'
  }

  const formatAddress = (addressObj) => {
    if (!addressObj) return '-'
    const { address, city, state, zipCode } = addressObj
    return `${address}, ${city}, ${state} ${zipCode}`
  }

  const getSrNo = (sale) => {
    const index = salesData.indexOf(sale)
    return page * rowsPerPage + index + 1
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box className="breadcrumb" sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" separator="|">
          <Typography
            color="text.primary"
            sx={{ fontSize: '1rem', fontWeight: 'bold' }}
          >
            Orders
          </Typography>
          <IconButton
            onClick={() => navigate('/dashboard')}
            color="primary"
            size="small"
            sx={{ p: 0.5 }}
          >
            <HomeIcon fontSize="small" />
          </IconButton>
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Orders
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ mr: 4, flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {getCurrentUserName()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
          <FormControl fullWidth sx={{ minWidth: '200px' }}>
            <InputLabel>User</InputLabel>
            <Select
              value={selectedUser}
              label="User"
              onChange={handleUserChange}
              disabled={usersLoading || allUsers.length === 0}
            >
              {allUsers.map((user) => (
                <MenuItem key={getUserId(user)} value={getUserId(user)}>
                  {getUserName(user)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ minWidth: '200px' }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Month"
              onChange={handleMonthChange}
            >
              {months.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ minWidth: '200px' }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={handleYearChange}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {usersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading users...</Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading sales data...</Typography>
        </Box>
      ) : !selectedUser ? (
        <Typography color="error">
          No user selected. Please select a user from the dropdown.
        </Typography>
      ) : salesData.length === 0 ? (
        <Typography>
          No sales found for {getCurrentUserName()} in{' '}
          {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
        </Typography>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            <strong>Target:</strong> {targetQuantity}   |  
            <strong>Achieved:</strong> {Number(totalSaleQuantity).toFixed(2)}
          </Typography>
          <Box width="100%" overflow="auto" mt="10px" mb="-5px">
            <StyledTable>
              <TableHead>
                <TableRow>
                  <SrNoTableCell>No.</SrNoTableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesData.map((sale, index) => (
                  <TableRow key={sale._id || index}>
                    <SrNoTableCell>
                      {page * rowsPerPage + index + 1}
                    </SrNoTableCell>
                    <TableCell>
                      {sale.date
                        ? (() => {
                            const d = new Date(sale.date)
                            const day = String(d.getDate()).padStart(2, '0')
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              '0'
                            ) // Month 0-indexed
                            const year = d.getFullYear()
                            return `${day}/${month}/${year}`
                          })()
                        : '-'}
                    </TableCell>
                    <TableCell>{sale.invoiceNo || '-'}</TableCell>
                    <TableCell>{sale.customerName || '-'}</TableCell>
                    <TableCell>{sale.companyName || '-'}</TableCell>
                    <TableCell>
                      {sale.product?.name || sale.productName || '-'}
                    </TableCell>
                    <TableCell>{sale.quantity || '-'}</TableCell>
                    <TableCell>{sale.unit || '-'} </TableCell>
                    <TableCell>{sale.fullRate || sale.rate || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewClick(sale)}
                        color="primary"
                        size="small"
                        aria-label={`view order ${sale.invoiceNo}`}
                      >
                        <RemoveRedEyeIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
            <TablePagination
              sx={{ px: 2 }}
              component="div"
              page={page}
              rowsPerPage={rowsPerPage}
              count={totalCount}
              rowsPerPageOptions={[10, 20, 30, 50, 100]}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              nextIconButtonProps={{ 'aria-label': 'Next Page' }}
              backIconButtonProps={{ 'aria-label': 'Previous Page' }}
            />
          </Box>
        </>
      )}

      <OrderDetailsDialog
        open={openDialog}
        onClose={handleCloseDialog}
        selectedOrder={selectedOrder}
        getSrNo={getSrNo}
        handlePdfClick={handlePdfClick}
        formatAddress={formatAddress}
      />
    </Box>
  )
}

export default IndividualPerformance
