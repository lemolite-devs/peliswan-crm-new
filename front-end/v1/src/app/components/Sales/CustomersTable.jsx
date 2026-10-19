import React from 'react'
import {
  Box,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  IconButton,
  styled,
  CircularProgress,
  Tooltip
} from '@mui/material'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import EditIcon from '@mui/icons-material/Edit'
import moment from 'moment'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

const CompanyNameCell = ({ companyNames }) => {
  // Handle cases where companyNames is undefined, null, or not an array
  if (
    !companyNames ||
    !Array.isArray(companyNames) ||
    companyNames.length === 0
  ) {
    return ''
  }

  const displayText =
    companyNames.length > 1
      ? `${companyNames[0]}, ...`
      : companyNames[0] || 'Not Defined'
  const tooltipContent = companyNames.join('<br />')

  return (
    <Tooltip
      title={
        <span
          dangerouslySetInnerHTML={{
            __html: tooltipContent
          }}
        />
      }
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#100C08',
            color: 'white',
            fontSize: '14px',
            padding: '8px',
            borderRadius: '4px'
          }
        },
        arrow: {
          sx: {
            color: '#100C08'
          }
        }
      }}
    >
      <span
        style={{
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          display: 'inline-block',
          maxWidth: '100%'
        }}
      >
        {displayText}
      </span>
    </Tooltip>
  )
}

const StyledTable = styled(Table)(({ theme }) => ({
  width: '100%',
  tableLayout: 'auto',
  '& thead': {
    '& tr': {
      '& th': {
        padding: '4px 8px',
        fontSize: '0.75rem',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        backgroundColor: theme.palette.grey[100],
        minWidth: '60px'
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
        height: '32px',
        minWidth: '60px'
      }
    }
  }
}))

const SrNoTableCell = styled(TableCell)(({ theme }) => ({
  width: '3%', // Changed from '5%' to '3%'
  minWidth: '40px', // Changed from '60px' to '40px'
  maxWidth: '50px', // Add maxWidth to prevent expansion
  textAlign: 'left',
  padding: '2px 4px', // Reduced padding from '4px 8px' to '2px 4px'
  fontSize: '0.75rem'
}))

const CustomersTable = ({
  loading,
  page,
  rowsPerPage,
  allCustomers,
  hasPermission,
  totalCustomers,
  handleViewClick,
  handleEdit,
  handleChangePage,
  handleChangeRowsPerPage,
  handleClickOpen
}) => {
  return (
    <Box
      sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
      mt="20px"
      mb="-10px"
    >
      <StyledTable>
        <TableHead>
          <TableRow>
            <SrNoTableCell
              align="left"
              sx={{ width: { xs: '3%', sm: '3%', md: '3%' } }}
            >
              No.
            </SrNoTableCell>
            <TableCell
              align="center"
              sx={{ width: { xs: '15%', sm: '15%', md: '15%' } }}
            >
              Action
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '15%', sm: '15%', md: '20%' } }}
            >
              Customer Name
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '15%', sm: '15%', md: '20%' } }}
            >
              Company Name
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '15%', sm: '15%', md: '15%' } }}
            >
              Date
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '20%', sm: '20%', md: '20%' } }}
            >
              Added By
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '20%', sm: '20%', md: '20%' } }}
            >
              Assigned To
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={12} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : allCustomers.length > 0 ? (
            allCustomers.map((customer, index) => (
              <TableRow key={customer?._id}>
                <SrNoTableCell>{page * rowsPerPage + index + 1}</SrNoTableCell>
                <TableCell align="center">
                  {hasPermission('Customers:view') && (
                    <IconButton
                      onClick={() => handleViewClick(customer)}
                      color="primary"
                      size="small"
                      aria-label={`view ${customer.customerName}`}
                    >
                      <RemoveRedEyeIcon fontSize="small" />
                    </IconButton>
                  )}
                  {hasPermission('Customers:edit') && (
                    <IconButton
                      onClick={() =>
                        handleEdit(
                          customer,
                          customer?.leadId?._id,
                          customer?.leadId?.customerName
                        )
                      }
                      color="primary"
                      size="small"
                      aria-label={`edit ${customer?.customerName}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {hasPermission('Customers:add') && customer?.leadId?._id && (
                    <IconButton
                      onClick={() =>
                        handleClickOpen(
                          customer?.leadId?._id,
                          customer?.leadId?.customerName
                        )
                      }
                      sx={{ color: 'green' }}
                      size="small"
                      aria-label={`lead_sale_add ${customer?.customerName}`}
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell align="left">
                  {customer?.leadId?.customerName}
                </TableCell>
                <TableCell align="left">
                  <CompanyNameCell
                    companyNames={customer?.leadId?.companyName}
                  />
                </TableCell>
                <TableCell align="left">
                  {moment(customer?.createdAt).format('DD/MM/YYYY')}
                </TableCell>
                <TableCell align="left">{customer?.addedBy}</TableCell>
                <TableCell align="left">
                  {customer?.leadId?.assignedTo?.name || '-'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={12} align="center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      <TablePagination
        sx={{ px: 2 }}
        component="div"
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        count={totalCustomers}
        rowsPerPageOptions={[10, 20, 30, 50, 100]}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />
    </Box>
  )
}

export default CustomersTable
