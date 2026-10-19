import styled from '@emotion/styled'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Breadcrumb } from 'app/components'
import React, { useState, useContext } from 'react'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import AuthContext from 'app/contexts/JWTAuthContext'
import ConfirmDeleteDialog from 'app/components/Delete/ConfirmDeleteDialog'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import useAuth from 'app/hooks/useAuth'

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  },
  borderRadius: '15px'
}))

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[400]}`,
  borderRadius: '15px'
}))

const StyledTableCellCenter = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[400],
  textAlign: 'center',
  padding: '16px',
  borderRight: `1px solid ${theme.palette.divider}`,
  fontSize: '20px',
  [theme.breakpoints.down('sm')]: {
    padding: '8px'
  }
}))

const StyledTableCellLeft = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[400],
  textAlign: 'left',
  padding: '16px',
  fontSize: '20px',
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    padding: '8px'
  }
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.grey[100]
  }
}))

const CenteredTableCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '16px',
  padding: '16px',
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    padding: '8px'
  }
}))

const LeftAlignedTableCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'left',
  padding: '16px',
  fontSize: '16px',
  wordWrap: 'break-word',
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    padding: '8px'
  }
}))

const ActionTableCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'center',
  padding: '16px',
  [theme.breakpoints.down('sm')]: {
    padding: '8px'
  }
}))

const validationSchema = Yup.object({
  type: Yup.string().required('Type is required'),
  description: Yup.string().required('Description is required')
})

const DefinitionTypes = () => {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showSnackbar } = useSnackbar()
  const { hasPermission, definitions, setDefinitions } = useAuth()

  const handleSubmit = async (values) => {
    const isDuplicate = definitions?.values.some(
      (item, index) =>
        index !== selectedIndex && // Exclude the current item in edit mode
        item.type.trim().toLowerCase() === values.type.trim().toLowerCase()
    )

    if (isDuplicate) {
      // Show a snackbar message and return early if a duplicate is found
      showSnackbar({
        message: 'This type already exists!',
        severity: 'error',
        vertical: 'top',
        horizontal: 'right'
      })
      return
    }
    if (editMode) {
      setLoading(true)
      try {
        // Update the selected row based on selectedIndex
        const updatedDefinitions = definitions?.values.map(
          (item, index) =>
            index === selectedIndex
              ? { ...item, type: values.type, description: values.description }
              : item // Keep other items unchanged
        )
        const response = await axiosInstance.put(
          `/api/settings/${definitions.id}`,
          {
            definitions: updatedDefinitions
          }
        )

        if (response.status === 200) {
          // Update the state with the new array
          setDefinitions((prev) => ({ ...prev, values: updatedDefinitions }))
          showSnackbar({
            message: 'Definition updated successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          handleClose()
        }
      } catch (error) {
        HandleError(error, showSnackbar)
        console.error(error)
      }
      setLoading(false)
    } else {
      try {
        setLoading(true)
        const response = await axiosInstance.post(`api/settings`, {
          key: 'definition',
          value: {
            type: values.type,
            description: values.description
          }
        })
        if (response.status === 200) {
          showSnackbar({
            message: 'Definition added successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          setDefinitions((prev) => ({
            ...prev,
            values: [
              ...definitions?.values,
              { type: values.type, description: values.description }
            ]
          }))
          handleClose()
        }
      } catch (error) {
        handleClose()
        HandleError(error, showSnackbar)
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
  }

  const formik = useFormik({
    initialValues: {
      type: '',
      description: ''
    },
    validationSchema,
    enableReinitialize: true, // This will reinitialize form values when they change
    onSubmit: handleSubmit
  })

  const handleOpen = () => {
    setEditMode(false)
    formik.resetForm()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    formik.resetForm()
    setEditMode(false)
    setSelectedIndex(null)
  }

  const handleEdit = (row, index) => {
    setSelectedIndex(index)
    formik.setValues({
      type: row.type,
      description: row.description
    })
    setEditMode(true)
    setOpen(true) // Open the form
  }

  const handleDeleteConfirm = async () => {
    setLoading(true)
    try {
      const updatedDefinitions = definitions?.values?.filter(
        (_, index) => index !== selectedIndex
      )

      const response = await axiosInstance.put(
        `/api/settings/${definitions.id}`,
        {
          definitions: updatedDefinitions
        }
      )

      if (response.status === 200) {
        // Update the state with the new array
        setDefinitions((prev) => ({ ...prev, values: updatedDefinitions }))
        showSnackbar({
          message: 'Definition deleted successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
      }
      setConfirmOpen(false)
    } catch (error) {
      HandleError(error, showSnackbar)
      console.error(error)
    }
    setLoading(false)
  }

  const handleDeleteClick = (selectedIndex) => {
    setSelectedIndex(selectedIndex)
    setConfirmOpen(true)
  }

  const handleConfirmCancel = () => {
    setSelectedIndex(null)
    setConfirmOpen(false)
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Definition' }]} />
      </Box>
      <Box display="flex" justifyContent="flex-start" mb={2}>
        {hasPermission('Definition:add') && (
          <Button color="primary" variant="contained" onClick={handleOpen}>
            + ADD
          </Button>
        )}
      </Box>
      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCellCenter>Type</StyledTableCellCenter>
              <StyledTableCellLeft>Description</StyledTableCellLeft>
              {hasPermission('Definition:edit') ||
              hasPermission('Definition:delete') ? (
                <StyledTableCellCenter>Actions</StyledTableCellCenter>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {definitions?.values.map((row, index) => (
              <StyledTableRow key={row.id}>
                <CenteredTableCell>{row.type}</CenteredTableCell>
                <LeftAlignedTableCell>{row.description}</LeftAlignedTableCell>

                {hasPermission('Definition:edit') ||
                hasPermission('Definition:delete') ? (
                  <ActionTableCell>
                    {hasPermission('Definition:edit') && (
                      <IconButton
                        color="success"
                        onClick={() => handleEdit(row, index)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}

                    {hasPermission('Definition:delete') && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ActionTableCell>
                ) : null}
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editMode ? 'Edit Definition' : 'Add New Definition'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={formik.handleSubmit}>
            <TextField
              margin="dense"
              label="Type"
              fullWidth
              name="type"
              value={formik.values.type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.type && Boolean(formik.errors.type)}
              helperText={formik.touched.type && formik.errors.type}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
            />
            <DialogActions>
              <Button
                onClick={handleClose}
                color="secondary"
                variant="contained"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : editMode ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={confirmOpen}
        content={`Are you sure you want to delete this item?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleConfirmCancel}
      />
    </Container>
  )
}

export default DefinitionTypes
