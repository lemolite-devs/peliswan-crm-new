import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { Breadcrumb } from 'app/components'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, TextField, Grid, IconButton } from '@mui/material'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import UserForm from 'app/components/Users/UserForm'
import UserTable from 'app/components/Users/UserTable'
import useAuth from 'app/hooks/useAuth'

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  }
}))

const UserList = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSnackbar } = useSnackbar()
  const [searchName, setSearchName] = useState('')
  const [filteredUsers, setFilteredUsers] = useState([])
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [roles, setRoles] = useState([])
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/users')
      const data = response.data.users || []
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }, [showSnackbar, navigate])

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/roles')
      if (response.data && Array.isArray(response.data)) {
        const roleArr = response.data.map((role) => ({
          value: role.name,
          id: role._id
        }))
        setRoles(roleArr)
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }, [showSnackbar, navigate])

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const handleAddUser = async (user) => {
    const result = await axiosInstance.post('/api/users', user)
    if (result.status === 201) {
      showSnackbar({
        message: 'User added successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      await fetchUsers()
    }
  }

  const handleUpdateUser = async (user) => {
    const {
      name,
      email,
      password,
      role: selectedRoleName,
      mobileNumber,
      city
    } = user
    const selectedRole = roles.find((role) => role.value === selectedRoleName)
    const result = await axiosInstance.put(`/api/users/${editingUser._id}`, {
      name,
      email,
      password,
      role: selectedRole.id,
      mobileNumber,
      city
    })
    if (result.status === 200) {
      showSnackbar({
        message: 'User updated successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'right'
      })
      await fetchUsers()
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      setLoading(true)
      const result = await axiosInstance.delete(`/api/users/${id}`)
      if (result.status === 200) {
        showSnackbar({
          message: 'User deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchUsers()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  const handleClickOpen = (user = null) => {
    setEditingUser(user)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingUser(null)
    setIsSubmitting(false)
  }

  const handleSearch = () => {
    const searchTerm = searchName.toLowerCase()
    setFilteredUsers(
      users.filter((user) => user.name.toLowerCase().includes(searchTerm))
    )
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Staff Management' }]} />
      </Box>
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        {/* Left-aligned button */}
        <Grid item>
          {hasPermission('Staff:add') && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleClickOpen()}
              disabled={isSubmitting}
            >
              + Add User
            </Button>
          )}
        </Grid>

        {/* Right-aligned filters */}
        <Grid item xs={12} sm={4} md={3}>
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            {/* Search Bar for filtering by name */}
            <TextField
              margin="normal"
              label="Name"
              name="name"
              variant="outlined"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
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

            <IconButton
              color="primary"
              onClick={handleSearch}
              aria-label="search"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' }, // Hide on small screens
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
            <Button
              variant="contained"
              color="primary"
              sx={{
                display: { xs: 'inline-flex', sm: 'none' }, // Show on small screens
                width: { xs: '100%', sm: 'auto' }
              }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Box>
        </Grid>
      </Grid>

      <UserForm
        open={open}
        handleClose={handleClose}
        handleAddUser={editingUser ? handleUpdateUser : handleAddUser}
        initialUser={editingUser}
        submitting={{ isSubmitting, setIsSubmitting }}
      />

      <UserTable
        users={searchName ? filteredUsers : users}
        handleEdit={handleClickOpen}
        handleDelete={handleDeleteUser}
        loading={loading}
      />
    </Container>
  )
}

export default UserList
