import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  TextField,
  IconButton,
  Autocomplete,
  Pagination
} from '@mui/material'
import styled from '@emotion/styled'
import { Breadcrumb } from 'app/components'
import ProposalForm from 'app/components/Proposal/ProposalForm'
import ProposalTable from 'app/components/Proposal/ProposalTable'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search' // Search icon
import AuthContext from 'app/contexts/JWTAuthContext'
import { useContext } from 'react'
import useAuth from 'app/hooks/useAuth'

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  }
}))

const ProposalList = () => {
  const [open, setOpen] = useState(false)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentProposal, setCurrentProposal] = useState(null)
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  // State and city filter states
  const { states, stateCityMap } = useContext(AuthContext)
  const [localCities, setLocalCities] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [searchProposalTo, setSearchProposalTo] = useState('')

  const [currentPage, setCurrentPage] = useState(0)
  const [totalProposals, setTotalProposals] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [limit, setLimit] = useState(10)

  // Fetch proposals function
  const fetchProposals = async (currentPage) => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/api/proposals', {
        params: {
          page: currentPage,
          limit,
          state: selectedState || undefined,
          city: selectedCity || undefined,
          proposalTo: searchProposalTo || undefined
        }
      })
      setProposals(response.data.proposals)
      setTotalPages(response.data.totalPages)
      setTotalProposals(response.data.totalProposals)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch proposals when the component mounts or when filters change
  useEffect(() => {
    fetchProposals(currentPage + 1, limit)
  }, [currentPage, limit])
  useEffect(() => {
    if (selectedState && stateCityMap[selectedState]) {
      setLocalCities(stateCityMap[selectedState])
    } else {
      setLocalCities([])
    }
  }, [selectedState, stateCityMap])

  const handleSubmitProposal = async (formData) => {
    try {
      const response = await axiosInstance.post('/api/proposal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showSnackbar({
        message: 'Proposal created successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })

      const updatedProposals = await axiosInstance.get('/api/proposals')
      setProposals(updatedProposals.data)
      fetchProposals(currentPage + 1)
    } catch (error) {
      console.error(
        'Error submitting proposal:',
        error.response?.data || error.message
      )
    }
  }

  const handleUpdateProposal = async (formData) => {
    try {
      setLoading(true)
      const response = await axiosInstance.put(
        `/api/proposal/${currentProposal._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      showSnackbar({
        message: 'Proposal updated successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      await fetchProposals()
      handleClose()
    } catch (error) {
      HandleError(error, showSnackbar)
      console.error(
        'Error updating proposal:',
        error.response?.data || error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      setLoading(true)
      const result = await axiosInstance.delete(`/api/proposal/${id}`)
      if (result.status === 200) {
        showSnackbar({
          message: 'Proposal deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        setProposals(proposals.filter((proposal) => proposal.id !== id))
        await fetchProposals()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error deleting proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/proposal/${id}`)
      setCurrentProposal(response.data)
      setEditMode(true)
      setOpen(true)
    } catch (error) {
      console.error('Error fetching proposal by ID:', error)
    }
  }

  const handleClickOpen = () => {
    setEditMode(false)
    setCurrentProposal(null)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setCurrentProposal(null)
    setEditMode(false)
  }

  // Function to handle search icon click
  const handleSearch = () => {
    fetchProposals(currentPage + 1, limit)
    setCurrentPage(0)
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Proposals' }]} />
      </Box>

      {/* Responsive Button and Filters */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }} // Stack vertically on small screens
        justifyContent={{ xs: 'flex-start', sm: 'space-between' }} // Align left on mobile, space-between on desktop
        alignItems="center"
        mb={2}
        gap={2}
      >
        {/* New Proposal Button */}

        {hasPermission('Sales.Proposals:add') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleClickOpen}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            + New Proposal
          </Button>
        )}

        {/* Filters */}
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          gap={2}
          sx={{
            flexGrow: { xs: 1, sm: 'none' },
            justifyContent: { sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <TextField
            margin="normal"
            label="Proposal To"
            name="proposalTo"
            variant="outlined"
            value={searchProposalTo}
            onChange={(e) => setSearchProposalTo(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 200 }, // Full width on small screens, fixed width on larger screens
              height: 40
            }}
            InputProps={{
              sx: { height: '40px' }
            }}
            InputLabelProps={{
              sx: { top: -6 }
            }}
          />
          <Autocomplete
            options={states}
            value={selectedState}
            onChange={(event, newValue) => setSelectedState(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="State"
                variant="outlined"
                margin="normal"
                sx={{
                  width: { xs: '100%', sm: 200 },
                  height: 38,
                  '.MuiAutocomplete-input': {
                    height: 8,
                    overflow: 'auto'
                  },
                  '.MuiAutocomplete-tag': {
                    margin: '2px'
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  sx: { height: '40px' }
                }}
                InputLabelProps={{
                  sx: { top: -6 }
                }}
              />
            )}
            sx={{
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' }
            }}
          />

          <Autocomplete
            options={localCities}
            value={selectedCity}
            onChange={(event, newValue) => setSelectedCity(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="City"
                variant="outlined"
                margin="normal"
                sx={{
                  width: { xs: '100%', sm: 200 },
                  height: 38,
                  '.MuiAutocomplete-input': {
                    height: 8,
                    overflow: 'auto'
                  },
                  '.MuiAutocomplete-tag': {
                    margin: '2px'
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  sx: { height: '40px' }
                }}
                InputLabelProps={{
                  sx: { top: -6 }
                }}
              />
            )}
            sx={{
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' }
            }}
          />

          {/* Hide this IconButton on small screens */}
          <IconButton
            color="primary"
            onClick={handleSearch}
            aria-label="search"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              marginTop: '5px',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <SearchIcon sx={{ fontSize: 24 }} />
          </IconButton>

          {/* Full-width search button on small screens */}
          <Button
            variant="contained"
            color="primary"
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              width: '100%'
            }}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <ProposalForm
          handleClose={handleClose}
          handleSubmit={editMode ? handleUpdateProposal : handleSubmitProposal}
          initialValues={currentProposal || {}}
          editMode={editMode}
        />
      </Dialog>

      <ProposalTable
        proposals={proposals}
        loading={loading}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        fetchProposals={fetchProposals}
        totalProposals={totalProposals}
        currentPage={currentPage}
        limit={limit}
        setLimit={setLimit}
        setCurrentPage={setCurrentPage}
      />
    </Container>
  )
}

export default ProposalList
