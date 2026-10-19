import { useEffect, useState, useContext } from 'react'
import styled from '@emotion/styled'
import {
  Box,
  Button,
  MenuItem,
  InputLabel,
  Select,
  Grid,
  TextField,
  FormControl,
  Autocomplete,
  IconButton,
  Typography,
  Badge,
  Tooltip
} from '@mui/material'
import { Breadcrumb } from 'app/components'
import SearchIcon from '@mui/icons-material/Search'
import MainLeadForm from './MainLeadForm'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import AuthContext from 'app/contexts/JWTAuthContext'
import FilterComponent from './FilterForm'
import LeadDetailsModal from './LeadDetailsModal'
import { useNavigate } from 'react-router-dom'
import { HandleError } from 'app/utils/handleError'
import useAuth from 'app/hooks/useAuth'
import { useSocket } from 'app/contexts/SocketContext'
import LeadTransferModal from './LeadTransferModal'
import LeadTableList from './LeadTableList'
import FilterListIcon from '@mui/icons-material/FilterList'
import TransferWithinAStationOutlinedIcon from '@mui/icons-material/TransferWithinAStationOutlined'
import { dropdownOptions } from 'app/utils/constant'
import { INITIAL_LEAD_VALUES } from 'app/components/DashboardTabs/constants'
const Container = styled('div')(({ theme }) => ({
  margin: '15px',
  [theme.breakpoints.down('md')]: { margin: '15px' },
  '& .breadcrumb': {
    marginBottom: '5px'
  }
}))

const LeadList = () => {
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState('')
  const [modalTitle, setModalTitle] = useState('New Lead Form')
  const { showSnackbar } = useSnackbar()

  const [totalLeads, setTotalLeads] = useState(0)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filter, setFilter] = useState({ startDate: '', endDate: '', commentSearch: '' })
  const [appfilter, setAppFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const { states, stateCityMap, allCities } = useContext(AuthContext)
  const [filteredData, setFilteredData] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [options, setOptions] = useState([])
  const [appliedTags, setAppliedTags] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100
  })
  const [leadViewActiveTab, setLeadViewActiveTab] = useState(0)
  const [initialValues, setInitialValues] = useState(INITIAL_LEAD_VALUES)
  const { hasPermission } = useAuth()
  const { socket } = useSocket()
  const [gstDetailsData, setGstDetailsData] = useState(null)
  const [isCallTrue, setIsCallTrue] = useState(false)
  const [isCall, setIsCall] = useState(false)

  const { user: any, hasRole } = useContext(AuthContext)
  const [isLeadSelected, setIsLeadSelected] = useState(false)
  const [allSalesExecutives, setAllSalesExecutives] = useState([])

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const { transferLeadNotification } = useSocket()
  const [rowSelectionModel, setRowSelectionModel] = useState([])

  const getLeads = async (filters = {}) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: paginationModel.page + 1, // Convert to 1-based for API
        limit: paginationModel.pageSize,
        salesExecutive: '',
        ...filters
      }).toString()

      const response = await axiosInstance.get(`/api/leads?${queryParams}`)
      const { lead = [], currentPage = 1, totalLeads = 0 } = response.data

      if (lead.length === 0) {
        setError('No data available')
        setTableData([])
        setTotalLeads(0)
      } else {
        setTableData(lead)
        setTotalLeads(totalLeads)
      }
    } catch (err) {
      HandleError(err, showSnackbar, navigate)
      console.error('Error fetching leads:', err)
      if (err.response && err.response.status === 404) {
        setError('No data available')
      } else {
        setError('An error occurred')
      }
      setTableData([])
      setTotalLeads(0)
    } finally {
      setLoading(false)
    }
  }
  const handleDownload = async (filter = {}) => {
    try {
      // Backend expects ObjectId filters as comma-separated strings.
      // Our UI stores Autocomplete selections as arrays of objects ({ key, value }),
      // so we must normalize before sending query params.
      setLoading(true)

      const normalizedFilters = { ...filter }

      const toCsv = (arr, prop) =>
        Array.isArray(arr)
          ? arr
              .map((x) => x?.[prop])
              .filter(Boolean)
              .join(',')
          : ''

      const productsCsv = toCsv(normalizedFilters.products, 'key')
      if (productsCsv) normalizedFilters.products = productsCsv
      else delete normalizedFilters.products

      const assignedToCsv = toCsv(normalizedFilters.assignedTo, 'key')
      if (assignedToCsv) normalizedFilters.assignedTo = assignedToCsv
      else delete normalizedFilters.assignedTo

      const deliveryDestinationCsv = toCsv(
        normalizedFilters.deliveryDestination,
        'value'
      )
      if (deliveryDestinationCsv)
        normalizedFilters.deliveryDestination = deliveryDestinationCsv
      else delete normalizedFilters.deliveryDestination

      const queryParams = new URLSearchParams({
        export: 'true',
        ...normalizedFilters
      }).toString()
      const response = await axiosInstance.get(`/api/leads?${queryParams}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'leads.xlsx') // Set the desired file name
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error downloading leads', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getLeads(appfilter)
  }, [transferLeadNotification, appfilter, paginationModel])

  const handleAdd = async (values, formik) => {
    setLoading(true)
    try {
      const result = await axiosInstance.post('/api/leads', {
        ...values,
        isCallTrue
      })
      if (result.status === 201) {
        setLoading(false)
        setEditId(result.data.lead._id)
        getLeads()
        showSnackbar({
          message: 'Lead added successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        setIsCallTrue(false)
        socket.emit('update_leads_overview')
        formik.resetForm()
      }
    } catch (error) {
      setLoading(false)
      setActiveTab(0)
      HandleError(error, showSnackbar, navigate)
      console.error('Error : ', error)
    }
  }

  const handleSubmitEdit = async (values, formik) => {
    setLoading(true)
    try {
      const result = await axiosInstance.put(`/api/leads/${editId}`, values)
      if (result.status === 200) {
        setLoading(false)
        setEditId('')
        getLeads()
        setIsModalOpen(false)
        showSnackbar({
          message: 'Lead updated successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        socket.emit('update_leads_overview')
        formik.resetForm()
      }
    } catch (error) {
      setLoading(false)
      HandleError(error, showSnackbar, navigate)
      console.error('Error : ', error)
    }
  }

  const resetEdit = () => {
    setEditId('')
    setModalTitle('+ New Lead')
  }

  const handleEditModal = (id) => {
    setEditId(id)
    setModalTitle('Edit Lead')
    setIsModalOpen(true)
    setIsCall(true)
  }

  const handleDelete = async (id) => {
    try {
      const result = await axiosInstance.delete(`/api/leads/${id}`)
      if (result.status === 200) {
        showSnackbar({
          message: 'Lead deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await getLeads()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error : ', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilter((prevFilter) => {
      if (name === 'country') {
        // Changing country invalidates the state and city beneath it
        return { ...prevFilter, [name]: value, state: '', city: '' }
      }
      const updatedFilter =
        name === 'state'
          ? { ...prevFilter, [name]: value, city: '' } // Clear city if state changes
          : { ...prevFilter, [name]: value }
      return updatedFilter
    })
  }

  const applyFilters = async () => {
    try {
      const nonEmptyFilter = {}
      const tags = []

      for (const key in filter) {
        if (filter[key] !== '' && filter[key] !== null) {
          if (
            key === 'products' ||
            key === 'assignedTo' ||
            key === 'deliveryDestination'
          ) {
            if (filter[key].length > 0) {
              if (key === 'products' || key === 'assignedTo') {
                nonEmptyFilter[key] = filter[key].map((item) => item.key)
              } else {
                nonEmptyFilter[key] = filter[key].map((item) => item.value)
              }
              tags.push({
                key,
                value: filter[key].map((item) => item.value).join(', ')
              })
            }
          } else if (
            key === 'meeting' ||
            key === 'requestSample' ||
            key === 'visitPlant' ||
            key === 'visitOffice'
          ) {
            // Handle boolean fields: include only if true
            if (filter[key] === true) {
              nonEmptyFilter[key] = filter[key]
              tags.push({ key, value: 'Yes' }) // Represent boolean as 'Yes'
            }
          } // inside the for loop in applyFilters, add this case:
          else if (key === 'meetingType') {
            if (filter[key] !== '') {
              nonEmptyFilter[key] = filter[key]
              tags.push({
                key,
                value:
                  filter[key] === 'hotMeeting'
                    ? 'Hot Meeting'
                    : 'Regular Meeting'
              })
            }
          } else {
            nonEmptyFilter[key] = filter[key]
            tags.push({ key, value: filter[key] })
          }
        }
      }

      setAppFilter(nonEmptyFilter)
      setAppliedTags(tags)

      const data = await getLeads(nonEmptyFilter)
      if (data && Array.isArray(data)) {
        setFilteredData(data)
      } else {
        setFilteredData([])
      }
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredData([])
      setTotalLeads(0)
    }
  }
  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/api/items/lookUps')
      const data = response.data.items || []
      setOptions(data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching data:', error)
    }
  }

  const getAllSalesExecutives = async () => {
    try {
      const response = await axiosInstance.get('/api/users/lookUps', {
        params: { allowRole: ['Sales Executive', 'Sales Manager'] }
      })
      setAllSalesExecutives(response.data?.users)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }
  useEffect(() => {
    fetchData()
    getAllSalesExecutives()
  }, [])

  const handleViewDetails = async (leadId) => {
    try {
      const response = await axiosInstance.get(`/api/leads/${leadId}`)
      setSelectedLead(response.data.lead)
      setIsDetailsModalOpen(true)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error fetching lead details:', error)
    }
  }

  const handleCloseDetailsModal = () => {
    setSelectedLead(null)
    setIsDetailsModalOpen(false)
  }
  const handleAutocompleteChange = (name, newValue) => {
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: newValue
    }))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditId('')
    setIsCall(false)
  }

  // const handleRemoveTag = (key) => {
  //   setAppliedTags((prev) => prev.filter((tag) => tag.key !== key))

  //   setFilter((prev) => ({
  //     ...prev,
  //     [key]: Array.isArray(prev[key]) ? [] : ''
  //   }))

  //   applyFilters()
  // }
  const handleRemoveTag = (key) => {
    setAppliedTags((prev) => prev.filter((tag) => tag.key !== key))
    setFilter((prev) => {
      const newFilter = { ...prev }
      if (Array.isArray(newFilter[key])) {
        newFilter[key] = []
      } else {
        newFilter[key] = ''
      }
      const nonEmptyFilter = {}
      for (const filterKey in newFilter) {
        if (newFilter[filterKey] !== '' && newFilter[filterKey] !== null) {
          if (Array.isArray(newFilter[filterKey])) {
            if (newFilter[filterKey].length > 0) {
              nonEmptyFilter[filterKey] = newFilter[filterKey].map(
                (item) => item.value
              )
            }
          } else {
            nonEmptyFilter[filterKey] = newFilter[filterKey]
          }
        }
      }
      setAppFilter(nonEmptyFilter)
      return newFilter
    })
  }

  const handleTransferLeads = () => {
    setIsTransferModalOpen(true)
  }
  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false)
    setRowSelectionModel([])
    setIsLeadSelected(false)
  }

  const handleShareLeads = async (values) => {
    try {
      const result = await axiosInstance.post('/api/transfer-lead', {
        newAssignedUserId: values.transferWith,
        leadId: rowSelectionModel
      })
      if (result.status === 200) {
        getLeads()
        setIsTransferModalOpen(false)
        handleCloseTransferModal()
        showSnackbar({
          message: `${result.data.message}`,
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        socket.emit('transfer_lead', {
          name: any.name,
          fromUserId: any.id,
          toUserId: values.transferWith
        })
        // formik.resetForm()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error : ', error)
    }
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Leads' }]} />
      </Box>

      <Grid container spacing={1}>
        {/* Buttons and Filters in one row */}
        <Grid item xs={12}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap" // Allows wrapping on smaller screens
            gap={2}
          >
            {/* Add and Filter Buttons */}
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                width: '100%',
                justifyContent: 'space-between',
                justifyItems: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '1rem'
                }}
              >
                {hasPermission('Leads:add') && (
                  <Tooltip title="Add Lead">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setIsModalOpen(true)}
                      sx={{
                        width: { xs: '120px', sm: 'auto' },
                        fontSize: '20px',
                        padding: '2px'
                      }}
                      size="small"
                    >
                      +
                    </Button>
                  </Tooltip>
                )}

                <Tooltip title="Filter">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setIsFilterOpen(true)}
                    sx={{
                      width: { xs: '120px', sm: 'auto' },
                      color: 'white'
                    }}
                    size="small"
                  >
                    <FilterListIcon />
                  </Button>
                </Tooltip>
                {any.role === 'Admin' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleDownload(filter)}
                    sx={{
                      width: { xs: '120px', sm: 'auto' }
                    }}
                  >
                    Export
                  </Button>
                )}
                <TextField
                  label="Name, Company, M.no"
                  name="combineField"
                  value={filter.combineField}
                  onChange={handleFilterChange}
                  sx={{
                    width: { xs: '100%', sm: 200 }
                  }}
                  size="small"
                />

                <Autocomplete
                  multiple
                  id="products"
                  options={options}
                  size="small"
                  getOptionLabel={(option) => option.value || ''}
                  renderOption={(props, option) => (
                    <li {...props} key={option.key}>
                      {option.value}
                    </li>
                  )}
                  value={filter.products}
                  onChange={(event, newValue) =>
                    handleAutocompleteChange('products', newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Products"
                      sx={{
                        width: { xs: '100%', sm: 200 }
                      }}
                    />
                  )}
                  sx={{
                    width: { xs: '100%', sm: 200 }
                  }}
                />

                <FormControl
                  sx={{
                    minWidth: { xs: '100%', sm: 150 },
                    '& .MuiInputLabel-root': {
                      top: '-6px' // Adjusts label position
                    },
                    '& .MuiSelect-select': {
                      padding: '8px' // Adjusts padding for better alignment
                    }
                    // '& .MuiMenuItem-root': {
                    //   fontSize: '0.9rem' // Slightly smaller font for dropdown items
                    // }
                  }}
                >
                  <InputLabel>Remark</InputLabel>
                  <Select
                    name="remark"
                    value={filter.remark}
                    onChange={handleFilterChange}
                    label="Remark"
                    size="small"
                  >
                    <MenuItem value="">All</MenuItem>
                    {dropdownOptions.remark.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Sub-product / Comments"
                  name="commentSearch"
                  value={filter.commentSearch}
                  onChange={handleFilterChange}
                  sx={{
                    width: { xs: '100%', sm: 200 }
                  }}
                  size="small"
                />

                <Tooltip title="Search">
                  <IconButton
                    color="primary"
                    onClick={applyFilters}
                    aria-label="search"
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' }
                  }}
                  onClick={applyFilters}
                >
                  Search
                </Button>
              </div>
              <div>
                {hasPermission('Leads:transfer') && (
                  <Tooltip title="Transfer">
                    <Badge
                      badgeContent={rowSelectionModel.length}
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: 'blue', // Change this to your desired color
                          color: 'white' // Color of the text in the badge
                        }
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleTransferLeads}
                        disabled={rowSelectionModel.length === 0}
                        sx={{ color: 'white' }}
                      >
                        <TransferWithinAStationOutlinedIcon />
                      </Button>
                    </Badge>
                  </Tooltip>
                )}
              </div>
            </Box>

            {/* Filters (Name, Products, Remark, Search) */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              sx={{ mt: { xs: 2, md: 0 } }} // Add margin for mobile screens
            ></Box>

            <LeadTransferModal />
          </Box>
        </Grid>

        {/* Tags displayed below */}
        {appliedTags?.length ? (
          <Grid padding={0} margin={0} item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2
              }}
            >
              {appliedTags?.map((tag) => (
                <Box
                  key={tag.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'lightgray',
                    borderRadius: '16px',
                    padding: '4px 8px'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ marginRight: 1, textTransform: 'capitalize' }}
                  >
                    {({
                      commentSearch: 'Sub-product',
                      combineField: 'Name / Company / M.no',
                      startDate: 'From',
                      endDate: 'To',
                      visitPlant: 'Visit Plant',
                      visitOffice: 'Visit Office'
                    }[tag.key] ?? tag.key)}: {tag.value}
                  </Typography>
                  <Button
                    size="small"
                    sx={{ minWidth: 'unset', padding: 0 }}
                    onClick={() => handleRemoveTag(tag.key)}
                  >
                    ✕
                  </Button>
                </Box>
              ))}
            </Box>
          </Grid>
        ) : null}
      </Grid>

      <FilterComponent
        filter={filter}
        setFilter={setFilter}
        dropdownOptions={dropdownOptions}
        states={states}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        applyFilters={applyFilters}
        getLeads={getLeads}
        handleFilterChange={handleFilterChange}
        allCities={allCities}
        stateCityMap={stateCityMap}
        allSalesExecutives={
          (allSalesExecutives
            ? allSalesExecutives.map((item) => ({
                key: item.id,
                value: item.name
              }))
            : []) || []
        }
      />

      <MainLeadForm
        title={modalTitle}
        buttonTextOpen={'+ New Lead'}
        buttonTextSubmit="Save"
        buttonTextCancel="Cancel"
        dropdownOptions={dropdownOptions}
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        getLeads={getLeads}
        initialValues={initialValues}
        editId={editId}
        handleAdd={handleAdd}
        handleEdit={handleSubmitEdit}
        resetEdit={resetEdit}
        setInitialValues={setInitialValues}
        loading={loading}
        states={states}
        stateCityMap={stateCityMap}
        allCities={allCities}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gstDetailsData={gstDetailsData}
        setGstDetailsData={setGstDetailsData}
        isCallTrue={isCallTrue}
        setIsCallTrue={setIsCallTrue}
        isCall={isCall}
        setIsCall={setIsCall}
      />

      <LeadTableList
        tableData={tableData}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        dropdownOptions={dropdownOptions}
        handleEditModal={handleEditModal}
        handleDelete={handleDelete}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        getLeads={getLeads}
        setInitialValues={setInitialValues}
        loading={loading}
        totalLeads={totalLeads}
        handleViewDetails={handleViewDetails}
        handleTransferLeads={handleTransferLeads}
        isLeadSelected={isLeadSelected}
        any={any}
        rowSelectionModel={rowSelectionModel}
        setRowSelectionModel={setRowSelectionModel}
        setLeadViewActiveTab={setLeadViewActiveTab}
      />

      <LeadDetailsModal
        leadViewActiveTab={leadViewActiveTab}
        isOpen={isDetailsModalOpen}
        handleClose={handleCloseDetailsModal}
        lead={selectedLead}
        any={any}
        setLeadViewActiveTab={setLeadViewActiveTab}
      />
      <LeadTransferModal
        allSalesExecutives={allSalesExecutives}
        handleShareLeads={handleShareLeads}
        handleTransferLeads={handleTransferLeads}
        isTransferModalOpen={isTransferModalOpen}
        handleCloseTransferModal={handleCloseTransferModal}
      />
    </Container>
  )
}
export default LeadList
