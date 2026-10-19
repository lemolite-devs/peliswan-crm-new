import React from 'react'
import { Box } from '@mui/system'

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null
  
  return <Box sx={{ p: 2 }}>{children}</Box>
}

export default React.memo(TabPanel)

