import React from 'react'
import { Select, MenuItem } from '@mui/material'
import { STATUS_OPTIONS, STATUS_COLORS } from './constants'

const StatusSelect = ({ status, onChange }) => {
  const currentStatus = status || 'Not Started'
  const statusStyle = STATUS_COLORS[currentStatus] || STATUS_COLORS['Not Started']

  return (
    <Select
      value={currentStatus}
      onChange={onChange}
      displayEmpty
      sx={{
        height: '30px',
        width: '125px',
        color: statusStyle.color,
        backgroundColor: statusStyle.bgColor,
        border: `1px solid ${statusStyle.borderColor}`,
        '& .MuiOutlinedInput-notchedOutline': {
          border: `1px solid ${statusStyle.borderColor}`
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: `2px solid ${statusStyle.borderColor}`
        }
      }}
    >
      {STATUS_OPTIONS.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  )
}

export default React.memo(StatusSelect)

