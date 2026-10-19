import styled from '@emotion/styled'
import { Box } from '@mui/material'
import { Breadcrumb } from 'app/components'
import React, { useState, useEffect } from 'react'
import TransportationTable from 'app/components/Transportation/TransportationTable'
import axiosInstance from 'axiosInstance'

const Container = styled('div')(({ theme }) => ({
  margin: '15px',
  [theme.breakpoints.down('md')]: { margin: '15px' },
  '& .breadcrumb': {
    marginBottom: '5px'
  }
}))

const Index = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get('/api/transportation')
      if (response.data.success) {
        setRoutes(response.data.data)
      } else {
        setError('Failed to fetch routes')
      }
    } catch (err) {
      console.error('Error fetching routes:', err)
      setError(err.response?.data?.message || 'Failed to fetch routes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes()
  }, [])

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Transportation' }]} />
      </Box>

      <TransportationTable routes={routes} setRoutes={setRoutes} refetchRoutes={fetchRoutes} loading={loading} error={error} />
    </Container>
  )
}

export default Index
