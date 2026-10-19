import { useState } from 'react'
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
  CircularProgress
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

// STYLED COMPONENT
const StyledTable = styled(Table)(() => ({
  whiteSpace: 'nowrap',
  '& thead': {
    '& tr': {
      '& th': {
        paddingLeft: 16,
        paddingRight: 16
      }
    }
  },
  '& tbody': {
    '& tr': {
      '& td': {
        paddingLeft: 16,
        paddingRight: 16,
        textTransform: 'capitalize'
      }
    }
  }
}))

const columns = [
  { id: 'srNo', label: 'Sr no.', align: 'center', width: '50px' },
  { id: 'name', label: 'Name', align: 'left', width: '150px' },
  { id: 'companyName', label: 'Company Name', align: 'left', width: '150px' },
  { id: 'competitors', label: 'Competitors', align: 'left', width: '150px' },
  { id: 'gstNumber', label: 'GstNumber', align: 'left', width: '150px' },
  { id: 'quantity', label: 'Quantity', align: 'left', width: '100px' },
  {
    id: 'shippingAddress',
    label: 'Shipping Address',
    align: 'left',
    width: '100px'
  },
  { id: 'comments', label: 'Comments', align: 'left', width: '100px' },
  { id: 'contactInfo.phone', label: 'Phone', align: 'left', width: '150px' },
  { id: 'contactInfo.email', label: 'Email', align: 'left', width: '150px' },
  {
    id: 'contactInfo.address',
    label: 'Address',
    align: 'left',
    width: '150px'
  },
  { id: 'contactInfo.state', label: 'State', align: 'left', width: '150px' },
  { id: 'contactInfo.city', label: 'City', align: 'left', width: '150px' },
  {
    id: 'contactInfo.zipCode',
    label: 'Zip Code',
    align: 'left',
    width: '150px'
  },
  { id: 'actions', label: 'Action', align: 'center', width: '150px' } // New Action Column
]

// Helper function to access nested properties
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const PaginationTable = ({
  data = [],
  rowsPerPageOptions = [10, 20, 30, 50],
  dropdownOptions,
  handleDelete,
  handleEditModal,
  loading
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0])

  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage)

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
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      style={{ width: column.width || 'auto' }}
                    >
                      {column.id === 'actions' ? (
                        <>
                          <IconButton
                            onClick={() => handleEditModal(row._id)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(row._id)}
                            sx={{ color: 'red' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      ) : (
                        (getNestedProperty(row, column.id) ??
                        (column.id === '_id' ? index + 1 : row[column.id]))
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                No data available
              </TableCell>
            </TableRow>
          )}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={columns.length} />
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      <TablePagination
        sx={{ px: 4 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={data.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />
    </Box>
  )
}

export default PaginationTable
