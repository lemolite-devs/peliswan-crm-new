import React from 'react'
import LeadsOverview from './LeadsOverview'
import { Typography } from '@mui/material'
import { useSocket } from 'app/contexts/SocketContext'

const DashboardLeadOverview = () => {
  const { leadsOverview } = useSocket()
  return (
    <>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontWeight: 'light',
          color: '#333',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}
      >
        Lead Overview
      </Typography>
      <LeadsOverview data={leadsOverview?.length > 0 ? leadsOverview : []} />
    </>
  )
}

export default DashboardLeadOverview
