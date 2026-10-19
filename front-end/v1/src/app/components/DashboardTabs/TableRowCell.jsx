import React from 'react'
import { TableCell, Checkbox, IconButton, Box } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import StatusSelect from './StatusSelect'

const TableRowCell = ({
  column,
  row,
  onCheckboxChange,
  onViewDetails,
  onEditLead,
  onEditUpdate,
  onDeleteUpdate,
  onStatusChange,
  hasViewPermission,
  hasEditPermission,
  canDelete,
  rowIndex
}) => {
  const renderCellContent = () => {
    switch (column.id) {
      case 'checkbox':
        return (
          <Checkbox
            onChange={onCheckboxChange}
            size="small"
            sx={{
              padding: 0,
              opacity: 1,
              '&.Mui-checked': {
                opacity: 1
              }
            }}
            checked={row.isReadTrue || false}
          />
        )

      case 'dueDate':
        return (
          <span
            style={{
              color: row.isOverdue ? '#d32f2f' : 'inherit',
              fontWeight: row.isOverdue ? 'bold' : 'normal'
            }}
          >
            {row[column.id]}
          </span>
        )

      case 'message':
        return (
          <span
            style={{
              color: row.isOverdue
                ? '#d32f2f'
                : row.isReadTrue
                  ? '#666'
                  : 'inherit',
              fontWeight: row.isOverdue ? 'bold' : 'normal'
            }}
          >
            {row[column.id]}
          </span>
        )

      case 'description':
        return (
          <>
            <span style={{ wordBreak: 'break-word' }}>
              {row[column.id]?.trim()}
            </span>
            {row?.customerName && (
              <span
                style={{
                  marginLeft: '8px',
                  fontStyle: 'italic',
                  color: '#555',
                  wordBreak: 'break-word'
                }}
              >
                ({row?.customerName?.trim()})
              </span>
            )}
          </>
        )

      case 'status':
        return (
          <StatusSelect
            status={row[column.id]}
            onChange={(event) => onStatusChange(event, row, 'status')}
          />
        )

      case 'customerName':
        return (
          <Box display="flex" gap={1} alignItems="center">
            <span>{row[column.id]}</span>
            {hasViewPermission && (
              <IconButton
                onClick={() => onViewDetails(row.leadId)}
                color="primary"
                title="View Lead"
                size="small"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            )}
            {hasEditPermission && (
              <IconButton
                onClick={() => onEditLead(row.leadId)}
                color="success"
                title="Edit Lead"
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )

      case 'actions':
        return (
          <div style={{ margin: '0 5px', display: 'flex', gap: '4px' }}>
            <IconButton
              onClick={() => onEditUpdate(row)}
              color="success"
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {canDelete && (
              <IconButton
                onClick={() => onDeleteUpdate(row._id)}
                sx={{ color: 'red' }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        )

      default:
        return row[column.id]
    }
  }

  return (
    <TableCell key={`${column.id}-${rowIndex}`} align={column.align}>
      {renderCellContent()}
    </TableCell>
  )
}

export default React.memo(TableRowCell)

