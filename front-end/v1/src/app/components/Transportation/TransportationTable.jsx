import React, { useState, useMemo } from 'react'
import {
  Box,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableSortLabel,
  TablePagination,
  styled,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import axiosInstance from 'axiosInstance'
import useAuth from 'app/hooks/useAuth'

const StyledTable = styled(Table)(({ theme }) => ({
  whiteSpace: 'pre',
  '& thead': {
    '& tr': {
      '& th': {
        paddingLeft: 0,
        paddingRight: 0,
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }
    }
  },
  '& tbody': {
    '& tr': {
      '&:nth-of-type(even)': {
        backgroundColor: theme.palette.action.hover
      },
      '&:hover': {
        backgroundColor: theme.palette.action.selected
      },
      '& td': {
        fontSize: '0.875rem',
        padding: '12px 8px'
      }
    }
  }
}))

const SrNoTableCell = styled(TableCell)(() => ({
  width: '60px',
  textAlign: 'center',
  fontWeight: 500
}))

const columns = [
  { id: 'no', label: 'No.', align: 'center', width: '60px' },
  { id: 'location', label: 'Location', align: 'left', width: '120px' },
  { id: 'from', label: 'From', align: 'left', width: '120px' },
  {
    id: 'km',
    label: 'KM',
    align: 'center',
    width: '120px',
    sortable: true,
    numeric: true
  },
  { id: 'rent', label: 'Rent', align: 'center', width: '150px' }
]

// Keep sort labels/arrows legible on the colored header background
const sortLabelSx = {
  color: 'inherit !important',
  '& .MuiTableSortLabel-icon': { color: 'inherit !important', opacity: 0.4 },
  '&.Mui-active .MuiTableSortLabel-icon': { opacity: 1 }
}

const TransportationTable = ({
  routes,
  setRoutes,
  refetchRoutes,
  loading,
  error
}) => {
  const { user } = useAuth()

  const isAuthorizedUser = user?.userID === 'USER23'
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    location: '',
    from: '',
    km: '',
    rent: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [apiError, setApiError] = useState(null)

  // Filter routes based on search term
  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return routes

    const lowerSearchTerm = searchTerm.toLowerCase()
    return routes.filter(
      (route) =>
        route.location?.toLowerCase().includes(lowerSearchTerm) ||
        route.from?.toLowerCase().includes(lowerSearchTerm) ||
        route.km?.toString().includes(lowerSearchTerm) ||
        route.rent?.toString().includes(lowerSearchTerm)
    )
  }, [routes, searchTerm])

  // Sort filtered routes
  const sortedRoutes = useMemo(() => {
    if (!orderBy) return filteredRoutes

    const column = columns.find((col) => col.id === orderBy)
    const isNumeric = column?.numeric

    return [...filteredRoutes].sort((a, b) => {
      let aVal = a[orderBy]
      let bVal = b[orderBy]

      if (isNumeric) {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      } else {
        aVal = (aVal ?? '').toString().toLowerCase()
        bVal = (bVal ?? '').toString().toLowerCase()
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredRoutes, orderBy, order])

  // Paginate sorted routes
  const paginatedRoutes = useMemo(() => {
    const startIndex = page * rowsPerPage
    return sortedRoutes.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedRoutes, page, rowsPerPage])

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
    setPage(0)
  }

  const handleChangePage = (_, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const formatCurrency = (value) => {
    if (!value || value === '') return '-'
    return `₹${Number(value).toLocaleString('en-IN')}`
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    if (!formData.location.trim()) errors.location = 'Location is required'
    if (!formData.from.trim()) errors.from = 'From is required'
    if (formData.km === '' || formData.km === null) {
      errors.km = 'KM is required'
    } else if (isNaN(formData.km) || Number(formData.km) < 0) {
      errors.km = 'KM must be a valid positive number'
    }
    if (
      formData.rent !== '' &&
      formData.rent !== null &&
      formData.rent !== undefined
    ) {
      if (isNaN(formData.rent) || Number(formData.rent) < 0) {
        errors.rent = 'Rent must be a valid positive number'
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Open dialog for adding new route
  const handleAddClick = () => {
    setEditingId(null)
    setFormData({ location: '', from: '', km: '', rent: '' })
    setFormErrors({})
    setApiError(null)
    setOpenDialog(true)
  }

  // Open dialog for editing route
  const handleEditClick = (route) => {
    setEditingId(route._id)
    setFormData({
      location: route.location,
      from: route.from,
      km: route.km,
      rent: route.rent || ''
    })
    setFormErrors({})
    setApiError(null)
    setOpenDialog(true)
  }

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
    setFormData({ location: '', from: '', km: '', rent: '' })
    setFormErrors({})
    setApiError(null)
  }

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Save (add or update) route via API
  const handleSaveRoute = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setApiError(null)

    try {
      const payload = {
        location: formData.location.trim(),
        from: formData.from.trim(),
        km: formData.km === '' ? 0 : Number(formData.km),
        rent: formData.rent === '' ? null : Number(formData.rent)
      }

      if (editingId) {
        // Update existing route
        const response = await axiosInstance.put(
          `/api/transportation/${editingId}`,
          payload
        )
        if (response.data.success) {
          await refetchRoutes()
          handleCloseDialog()
        } else {
          setApiError(response.data.message || 'Failed to update route')
        }
      } else {
        // Add new route
        const response = await axiosInstance.post(
          '/api/transportation',
          payload
        )
        if (response.data.success) {
          await refetchRoutes()
          handleCloseDialog()
        } else {
          setApiError(response.data.message || 'Failed to add route')
        }
      }
    } catch (err) {
      console.error('Error saving route:', err)
      setApiError(err.response?.data?.message || 'Failed to save route')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete route via API
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return

    try {
      const response = await axiosInstance.delete(
        `/api/transportation/${routeId}`
      )
      if (response.data.success) {
        await refetchRoutes()
      } else {
        alert(response.data.message || 'Failed to delete route')
      }
    } catch (err) {
      console.error('Error deleting route:', err)
      alert(err.response?.data?.message || 'Failed to delete route')
    }
  }

  return (
    <Box width="100%" paddingX={2} overflow="auto" mt="20px" mb="-10px">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}
      >
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search by Location, From, KM, or Rent..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(0)
          }}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
              height: '36px'
            }
          }}
        />
        {isAuthorizedUser && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            onClick={handleAddClick}
            disabled={loading || !isAuthorizedUser}
            title={!isAuthorizedUser ? 'Only USER23 can add routes' : ''}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Route
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              overflowX: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <StyledTable>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sortDirection={orderBy === column.id ? order : false}
                      sx={{ width: column.width || 'auto' }}
                    >
                      {column.sortable ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleSort(column.id)}
                          IconComponent={
                            orderBy === column.id ? undefined : UnfoldMoreIcon
                          }
                          sx={sortLabelSx}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                  {isAuthorizedUser && (
                    <TableCell align="center" sx={{ width: '150px' }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRoutes.length > 0 ? (
                  paginatedRoutes.map((route, index) => (
                    <TableRow
                      key={
                        route._id || `${route.location}-${route.from}-${index}`
                      }
                    >
                      <SrNoTableCell>
                        {page * rowsPerPage + index + 1}
                      </SrNoTableCell>
                      <TableCell align="left" sx={{ fontWeight: 500 }}>
                        {route.location || '-'}
                      </TableCell>
                      <TableCell align="left">{route.from || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 500 }}>
                        {route.km ? `${route.km} km` : '-'}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 600, color: 'primary.main' }}
                      >
                        {formatCurrency(route.rent)}
                      </TableCell>
                      {isAuthorizedUser && (
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditClick(route)}
                                disabled={isSaving}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteRoute(route._id)}
                                disabled={isSaving}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      {searchTerm
                        ? 'No routes found matching your search'
                        : 'No data available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </StyledTable>
          </Box>

          <TablePagination
            sx={{ px: 2, mt: 2 }}
            page={page}
            component="div"
            rowsPerPage={rowsPerPage}
            count={filteredRoutes.length}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            nextIconButtonProps={{ 'aria-label': 'Next Page' }}
            backIconButtonProps={{ 'aria-label': 'Previous Page' }}
          />
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? 'Edit Route' : 'Add New Route'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                size="small"
                error={!!formErrors.location}
                helperText={formErrors.location}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="From"
                name="from"
                value={formData.from}
                onChange={handleFormChange}
                size="small"
                error={!!formErrors.from}
                helperText={formErrors.from}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="KM"
                name="km"
                type="number"
                value={formData.km}
                onChange={handleFormChange}
                size="small"
                error={!!formErrors.km}
                helperText={formErrors.km}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rent (₹)"
                name="rent"
                type="number"
                value={formData.rent}
                onChange={handleFormChange}
                size="small"
                error={!!formErrors.rent}
                helperText={formErrors.rent}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveRoute}
            variant="contained"
            color="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingId ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TransportationTable
