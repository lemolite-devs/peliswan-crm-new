import {
  Box,
  Table,
  styled,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  IconButton,
  CircularProgress,
  Icon
} from '@mui/material'
import React from 'react'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import axiosInstance from 'axiosInstance'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import useAuth from 'app/hooks/useAuth'

const columns = [
  { id: '_id', label: 'No', align: 'left', width: '55px' },
  { id: 'name', label: 'Name', align: 'left', width: '150px' },
  { id: 'userID', label: 'User ID', align: 'left', width: '150px' },
  { id: 'password', label: 'Password', align: 'left', width: '150px' },
  { id: 'mobileNumber', label: 'Mobile no.', align: 'left', width: '150px' },
  { id: 'role', label: 'Role', align: 'left', width: '170px' },
  { id: 'city', label: 'City', align: 'left', width: '150px' },
  { id: 'actions', label: 'Action', align: 'center', width: '155px' }
]

const StyledTable = styled(Table)(() => ({
  whiteSpace: 'nowrap',
  '& thead': {
    '& tr': {
      '& th': {
        paddingLeft: 16,
        paddingRight: 16,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }
  },
  '& tbody': {
    '& tr': {
      '& td': {
        paddingLeft: 16,
        paddingRight: 16,
        textTransform: 'capitalize',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal', // Allow wrapping
        wordBreak: 'break-word' // Break long words if necessary
      }
    }
  }
}))

const UserTable = ({ users = [], handleEdit, handleDelete, loading }) => {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10) // Default to 10 rows per page
  const [visiblePasswordUserId, setVisiblePasswordUserId] = React.useState(null)
  const [decryptedPassword, setDecryptedPassword] = React.useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userIdToDelete, setUserIdToDelete] = React.useState(null)
  const { hasPermission } = useAuth()

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0) // Reset page to 0 when rows per page changes
  }

  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  const handleViewDetails = async (id) => {
    if (visiblePasswordUserId === id) {
      // Hide the password if the same user is clicked again
      setVisiblePasswordUserId(null)
      setDecryptedPassword('')
    } else {
      try {
        const response = await axiosInstance.get(
          `/api/users/${id}/decrypt-password`
        )
        setDecryptedPassword(response.data.user.password)
        setVisiblePasswordUserId(id)
      } catch (error) {
        console.error('Failed to fetch password:', error)
      }
    }
  }

  const handleOpenDeleteDialog = (userId) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setUserIdToDelete(null)
  }

  const handleConfirmDelete = async () => {
    try {
      await handleDelete(userIdToDelete)
      handleCloseDeleteDialog()
    } catch (error) {
      console.error('Failed to delete user', error)
    }
  }

  return (
    <Box width="100%" overflow="auto" mt="20px" mb="-10px">
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ width: column.width || 'auto' }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {loading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          </TableBody>
        ) : users.length > 0 ? (
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={row._id}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      style={{ width: column.width || 'auto' }}
                    >
                      {column.id === 'actions' ? (
                        <>
                          {hasPermission('Staff:edit') && (
                            <IconButton
                              onClick={() => handleEdit(row)}
                              color="success"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {hasPermission('Staff:delete') && (
                            <IconButton
                              onClick={() => handleOpenDeleteDialog(row._id)}
                              sx={{ color: 'red' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </>
                      ) : column.id === 'password' ? (
                        <div
                          className="eniter-password-cell"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span
                            className="password-toggle"
                            style={{
                              marginTop: '5px',
                              textTransform: 'none'
                            }}
                          >
                            {visiblePasswordUserId === row._id
                              ? decryptedPassword
                              : '*********'}
                          </span>
                          <IconButton
                            onClick={() => handleViewDetails(row._id)}
                            color="primary"
                          >
                            {visiblePasswordUserId === row._id ? (
                              <Icon>visibility</Icon>
                            ) : (
                              <Icon>visibility_off</Icon>
                            )}
                          </IconButton>
                        </div>
                      ) : column.id === 'role' ? (
                        <span>{row[column.id]?.name}</span>
                      ) : (
                        <>
                          {column.id === '_id'
                            ? page * rowsPerPage + index + 1
                            : row[column.id]}
                        </>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        ) : (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                No Data Available!
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </StyledTable>

      <TablePagination
        sx={{ px: 2 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={users.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[10, 20, 30, 50, 100]}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        itemName={users.find((user) => user._id === userIdToDelete)?.name || ''}
      />
    </Box>
  )
}

export default UserTable
