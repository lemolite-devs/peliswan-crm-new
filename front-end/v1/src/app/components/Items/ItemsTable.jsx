import React, { useState, useEffect, useCallback } from 'react'
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
  CircularProgress
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import useAuth from 'app/hooks/useAuth'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import axiosInstance from 'axiosInstance'

const StyledTable = styled(Table)(({ theme }) => ({
  whiteSpace: 'pre',
  '& thead': {
    '& tr': {
      '& th': { paddingLeft: 0, paddingRight: 0, fontSize: '0.875rem' }
    }
  },
  '& tbody': {
    '& tr': {
      '& td': {
        textTransform: 'capitalize',
        fontSize: '0.875rem',
        padding: 0
      }
    }
  }
}))

const SrNoTableCell = styled(TableCell)(() => ({
  width: '50px',
  textAlign: 'left'
}))

const columns = [
  { id: 'no', label: 'No.', align: 'left', width: '50px' },
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'description', label: 'Description', align: 'center' },
  { id: 'rate', label: 'Rate', align: 'center' },
  { id: 'gst', label: 'GST', align: 'center' },
  { id: 'units', label: 'Units', align: 'center' },
  { id: 'group', label: 'Group', align: 'center' },
  { id: 'action', label: 'Action', align: 'center' }
]

const ItemsTable = ({
  items: initialItems,
  handleEdit,
  handleDelete,
  loading
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const { hasPermission, hasRole } = useAuth()
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleDragEnd = useCallback(
    async (result) => {
      if (!result.destination) return

      const sourceIndex = result.source.index
      const destinationIndex = result.destination.index

      const updatedItems = Array.from(items)
      const [movedItem] = updatedItems.splice(sourceIndex, 1)
      updatedItems.splice(destinationIndex, 0, movedItem)
      setItems(updatedItems)

      try {
        await axiosInstance.post('/api/items/reorder', {
          itemId: result.draggableId,
          sourceIndex,
          destinationIndex
        })
      } catch (error) {
        console.error('Error updating order:', error)
      }
    },
    [items]
  )

  const handleChangePage = (_, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleDeleteClick = (itemId) => {
    setSelectedItemId(itemId)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (selectedItemId) {
      handleDelete(selectedItemId)
    }
    setOpenDeleteDialog(false)
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setSelectedItemId(null)
  }

  return (
    <Box width="100%" paddingX={2} overflow="auto" mt="20px" mb="-10px">
      <DragDropContext onDragEnd={handleDragEnd}>
        <StyledTable>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ width: column.width || 'auto' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <Droppable
            droppableId="items"
            isDropDisabled={!hasRole('Sales Manager')}
          >
            {(provided) => (
              <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item, index) => (
                    <Draggable
                      key={item._id}
                      draggableId={item._id}
                      index={index}
                      isDragDisabled={!hasRole('Sales Manager')}
                    >
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            backgroundColor: snapshot.isDragging
                              ? 'lightgray'
                              : 'inherit',
                            display: snapshot.isDragging ? 'table' : undefined,
                            width: '100%'
                          }}
                        >
                          <SrNoTableCell>{index + 1}</SrNoTableCell>
                          <TableCell align="left">{item.name}</TableCell>
                          <TableCell align="center">
                            {item.description}
                          </TableCell>
                          <TableCell align="center">{item.rate}</TableCell>
                          <TableCell align="center">{item.gst}</TableCell>
                          <TableCell align="center">{item.units}</TableCell>
                          <TableCell align="center">{item.group}</TableCell>
                          <TableCell align="center">
                            {hasPermission('Sales.Items:edit') && (
                              <IconButton
                                onClick={() => handleEdit(item)}
                                color="primary"
                                aria-label={`edit ${item.name}`}
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {hasPermission('Sales.Items:delete') && (
                              <IconButton
                                onClick={() => handleDeleteClick(item._id)}
                                sx={{ color: 'red' }}
                                aria-label={`delete ${item.name}`}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
                {provided.placeholder}
              </TableBody>
            )}
          </Droppable>
        </StyledTable>
      </DragDropContext>

      <ConfirmDeleteDialog
        open={openDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={items.find((item) => item._id === selectedItemId)?.name}
      />
      <TablePagination
        sx={{ px: 2 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={items.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[10, 20, 30, 50, 100]}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />
    </Box>
  )
}

export default ItemsTable
