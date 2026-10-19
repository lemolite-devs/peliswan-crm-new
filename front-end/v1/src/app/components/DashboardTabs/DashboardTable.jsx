import React, { useCallback } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material'
import { TABLE_CONTAINER_SX } from './constants'
import TableRowCell from './TableRowCell'

const DashboardTable = ({
  columns,
  data,
  loading,
  onCheckboxChange,
  onViewDetails,
  onEditLead,
  onEditUpdate,
  onDeleteUpdate,
  onStatusChange,
  hasViewPermission,
  hasEditPermission,
  canDelete
}) => {
  const getRowKey = useCallback((row, index) => {
    return row._id || row.id || row.reminderId || `row-${index}`
  }, [])

  const getRowStyle = useCallback((row) => {
    return {
      backgroundColor: row.isOverdue
        ? 'rgba(255, 0, 0, 0.1)'
        : row.isReadTrue
          ? 'rgba(0, 0, 0, 0.04)'
          : 'inherit',
      fontWeight: row.isOverdue ? 'bold' : 'normal',
      '&:hover': {
        backgroundColor: row.isOverdue
          ? 'rgba(255, 0, 0, 0.15)'
          : row.isReadTrue
            ? 'rgba(0, 0, 0, 0.08)'
            : 'inherit'
      }
    }
  }, [])

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={TABLE_CONTAINER_SX}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                width={column.width}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <TableRow key={getRowKey(row, rowIndex)} sx={getRowStyle(row)}>
                {columns.map((column) => (
                  <TableRowCell
                    key={`${column.id}-${rowIndex}`}
                    column={column}
                    row={row}
                    rowIndex={rowIndex}
                    onCheckboxChange={() => onCheckboxChange(row)}
                    onViewDetails={onViewDetails}
                    onEditLead={onEditLead}
                    onEditUpdate={onEditUpdate}
                    onDeleteUpdate={onDeleteUpdate}
                    onStatusChange={onStatusChange}
                    hasViewPermission={hasViewPermission}
                    hasEditPermission={hasEditPermission}
                    canDelete={canDelete}
                  />
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
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default React.memo(DashboardTable)
