import styled from '@emotion/styled'
import { Box, Button } from '@mui/material'
import { Breadcrumb } from 'app/components'
import React, { useState, useEffect } from 'react'
import axiosInstance from 'axiosInstance'
import ItemForm from 'app/components/Items/ItemForm'
import ItemsTable from 'app/components/Items/ItemsTable'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import { useNavigate } from 'react-router-dom'
import useAuth from 'app/hooks/useAuth'

const Container = styled('div')(({ theme }) => ({
  margin: '15px',
  [theme.breakpoints.down('md')]: { margin: '15px' },
  '& .breadcrumb': {
    marginBottom: '5px'
  }
}))

const ItemList = () => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(false) // State for table loading
  const [submitting, setSubmitting] = useState(false) // State for form submission loading
  const { showSnackbar } = useSnackbar()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  // Fetch items function
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/items')
      setItems(response.data)
    } catch (error) {
      HandleError(error, showSnackbar, navigate)

      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial data on mount
  useEffect(() => {
    fetchItems()
  }, [])

  // Function to handle adding an item
  const handleAddItem = async (item) => {
    try {
      setSubmitting(true)
      // Add new item
      const result = await axiosInstance.post('/api/items', item)
      if (result.status === 201) {
        showSnackbar({
          message: 'Item added successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchItems()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error adding item:', error)
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  // Function to handle updating an item
  const handleUpdateItem = async (item) => {
    try {
      setSubmitting(true)
      // Update existing item
      const result = await axiosInstance.put(
        `/api/items/${editingItem._id}`,
        item
      )
      if (result.status === 200) {
        showSnackbar({
          message: 'Item updated successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchItems()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error updating item:', error)
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  // Function to handle deleting an item
  const handleDeleteItem = async (id) => {
    try {
      setLoading(true)
      const result = await axiosInstance.delete(`/api/items/${id}`)
      if (result.status === 200) {
        showSnackbar({
          message: 'Item deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
        await fetchItems()
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
      console.error('Error deleting item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClickOpen = (item = null) => {
    setEditingItem(item)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingItem(null)
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Items' }]} />
      </Box>
      {hasPermission('Sales.Items:add') && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleClickOpen()}
          disabled={submitting}
        >
          + Add Item
        </Button>
      )}
      <ItemForm
        open={open}
        handleClose={handleClose}
        handleAddItem={editingItem ? handleUpdateItem : handleAddItem}
        initialItem={editingItem}
        isSubmitting={submitting}
      />

      <ItemsTable
        items={items}
        handleEdit={handleClickOpen}
        handleDelete={handleDeleteItem}
        loading={loading}
      />
    </Container>
  )
}

export default ItemList
