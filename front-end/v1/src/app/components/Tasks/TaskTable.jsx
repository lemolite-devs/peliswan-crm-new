import React, { useState, useEffect } from 'react'
import {
  styled,
  Box,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  IconButton,
  CircularProgress,
  TablePagination,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  useTheme
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import moment from 'moment'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import useAuth from 'app/hooks/useAuth'
import { useMediaQuery, width } from '@mui/system'

const columns = [
  { id: '_id', label: 'No', align: 'left', width: '55px' },
  { id: 'name', label: 'Task Name', align: 'left', width: '120px' },
  { id: 'status', label: 'Status', align: 'left', width: '170px' },
  { id: 'startDate', label: 'Start Date', align: 'left', width: '120px' },
  { id: 'dueDate', label: 'Due Date', align: 'left', width: '120px' },
  { id: 'assignedTo', label: 'Assiged To', align: 'left', width: '120px' },
  { id: 'priority', label: 'Priority', align: 'left', width: '120px' },
  { id: 'description', label: 'Description', align: 'left', width: '120px' },
  { id: 'actions', label: 'Action', align: 'center', width: '140px' }
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#84cc16'
    case 'In Progress':
      return '#3b82f6'
    case 'Not Started':
      return '#64748b'
    default:
      return 'inherit'
  }
}
const getStatusBGColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#f0ffdc'
    case 'In Progress':
      return '#f7faff'
    case 'Not Started':
      return '#f9fafb'
    default:
      return 'inherit'
  }
}

const getStatusBorderColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#ceeba2'
    case 'In Progress':
      return '#b1cdfb'
    case 'Not Started':
      return '#c1c7d1'
    default:
      return 'inherit'
  }
}

const StatusSelect = ({ status, onChange }) => (
  <Select
    value={status || 'Not Started'}
    onChange={onChange}
    displayEmpty
    sx={{
      height: '30px',
      width: '125px',
      color: getStatusColor(status),
      backgroundColor: getStatusBGColor(status),
      border: `1px solid ${getStatusBorderColor(status)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${getStatusBorderColor(status)}`
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: `2px solid ${getStatusBorderColor(status)}`
      }
    }}
  >
    <MenuItem value="Not Started">Not Started</MenuItem>
    <MenuItem value="In Progress">In Progress</MenuItem>
    <MenuItem value="Completed">Completed</MenuItem>
  </Select>
)

const CellWithText = ({ text, tooltip, showTooltip }) =>
  showTooltip ? (
    <Tooltip
      title={
        <span
          dangerouslySetInnerHTML={{
            __html: tooltip
          }}
        />
      }
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#100C08',
            color: 'white',
            fontSize: '16px',
            padding: '10px',
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
      <div
        className="eniter-password-cell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {text || 'Not Defined'}
      </div>
    </Tooltip>
  ) : (
    <div
      className="eniter-password-cell"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {text || 'Not Defined'}
    </div>
  )

const PriorityBadge = ({ priority }) => (
  <Box>
    <Typography
      sx={{
        color: getPriorityColor(priority),
        border: `1px solid ${getPriorityColor(priority)}`,
        display: 'inline-block',
        textAlign: 'center',
        width: '70px',
        borderRadius: '3px'
      }}
    >
      {priority}
    </Typography>
  </Box>
)

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return '#ff6f00'
    case 'Medium':
      return '#03a9f4'
    case 'Low':
      return '#777'
    default:
      return 'inherit'
  }
}
const DescriptionCell = ({ description, isMobile, isTablet }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const handleClick = (event) => {
    if (isMobile || isTablet) {
      event.stopPropagation() // Prevent event bubbling
      setTooltipOpen(true)
    }
  }

  const handleClose = () => {
    // setTooltipOpen(false)
  }

  const truncatedDescription =
    description.length > 20 ? `${description.substring(0, 20)}...` : description

  return (
    <Box>
      <Tooltip
        title={description}
        arrow
        open={tooltipOpen}
        onClose={handleClose} // Close the tooltip when clicking outside
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: '#100C08',
              color: 'white',
              fontSize: '14px',
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
          onClick={handleClick}
          onMouseEnter={() => !tooltipOpen && !isMobile && setTooltipOpen(true)} // Show tooltip on hover for large screens
          onMouseLeave={() => setTooltipOpen(false)} // Hide tooltip when not hovering
          style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} // Prevent text wrapping
        >
          {truncatedDescription}
        </span>
      </Tooltip>
    </Box>
  )
}

const TaskTable = ({
  tasks = [],
  loading,
  page,
  searchQuery,
  rowPerPage,
  totalTasks,
  fetchAllTask,
  handleEdit,
  handleUpdateTaskField,
  handleDelete,
  handleChangePage,
  handleChangeRowsPerPage
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userIdToDelete, setUserIdToDelete] = React.useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const { hasPermission } = useAuth()

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
      console.log('Failed to delete user', error)
    }
  }

  // fetch an all task data when a page or rowPerPage change
  useEffect(() => {
    fetchAllTask(page + 1, rowPerPage, searchQuery)
  }, [page, rowPerPage])
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ff6f00'
      case 'Medium':
        return '#03a9f4'
      case 'Low':
        return '#777'
      default:
        return 'inherit'
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#84cc16'
      case 'In Progress':
        return '#3b82f6'
      case 'Not Started':
        return '#64748b'
      default:
        return 'inherit'
    }
  }

  const getStatusBGColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#f0ffdc'
      case 'In Progress':
        return '#f7faff'
      case 'Not Started':
        return '#f9fafb'
      default:
        return 'inherit'
    }
  }

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#ceeba2'
      case 'In Progress':
        return '#b1cdfb'
      case 'Not Started':
        return '#c1c7d1'
      default:
        return 'inherit'
    }
  }

  return (
    <Box width="100%" overflow="auto" mt="20px" mb="-10px">
      <StyledTable>
        {/* Here is table head  */}
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
        {/* Here is table body */}
        {loading?.loading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          </TableBody>
        ) : tasks.length > 0 ? (
          <TableBody>
            {tasks.map((row, index) => (
              <TableRow key={row._id}>
                {columns.map((column) => {
                  const cellContent = (() => {
                    switch (column.id) {
                      case 'actions':
                        return (
                          <>
                            {hasPermission('Tasks:edit') && (
                              <IconButton
                                onClick={() => handleEdit(row._id, row)}
                                color="success"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {hasPermission('Tasks:delete') && (
                              <IconButton
                                onClick={() => handleOpenDeleteDialog(row._id)}
                                sx={{ color: 'red' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </>
                        )
                      case 'name':
                        return row.name
                      case 'status':
                        return (
                          <StatusSelect
                            status={row.status}
                            onChange={(event) =>
                              handleUpdateTaskField(event, row, 'status')
                            }
                          />
                        )
                      case 'startDate':
                        return (
                          <CellWithText
                            text={moment(row.startDate).format('DD/MM/YYYY')}
                          />
                        )
                      case 'dueDate':
                        return (
                          <CellWithText
                            text={moment(row.dueDate).format('DD/MM/YYYY')}
                          />
                        )
                      case 'assignedTo':
                        const assignedNames =
                          row.assignedTo?.map((user) => user.name) || []
                        const displayText =
                          assignedNames.length > 2
                            ? `${assignedNames.slice(0, 2).join(', ')}, ...`
                            : assignedNames.join(', ') || 'Not Defined'
                        const tooltipContent = assignedNames.join('<br />')

                        return (
                          <CellWithText
                            text={displayText}
                            tooltip={tooltipContent}
                            showTooltip={assignedNames.length > 2} // Tooltip shown only if more than 2 users
                          />
                        )
                      case 'priority':
                        return <PriorityBadge priority={row.priority} />
                      case 'description':
                        return (
                          <DescriptionCell
                            description={row.description}
                            isMobile={isMobile}
                            isTablet={isTablet}
                          />
                        )
                      case '_id':
                        return page * rowPerPage + index + 1
                      default:
                        return row[column.id]
                    }
                  })()

                  return (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      style={{ width: column.width || 'auto' }}
                    >
                      {cellContent}
                    </TableCell>
                  )
                })}
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
      {/* Here is a table Pagination bar */}
      <TablePagination
        sx={{ px: 2 }}
        component="div"
        page={page}
        rowsPerPage={rowPerPage}
        count={totalTasks}
        rowsPerPageOptions={[10, 20, 30, 50, 100]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        itemName={tasks.find((task) => task._id === userIdToDelete)?.name || ''}
      />
    </Box>
  )
}

export default TaskTable
