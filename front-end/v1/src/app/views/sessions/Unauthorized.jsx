import React from 'react'
import { Box, Button, styled, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'

const FlexBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center'
}))

const JustifyBox = styled(FlexBox)(() => ({
  maxWidth: 320,
  flexDirection: 'column',
  justifyContent: 'center'
}))

const IMG = styled('img')(() => ({
  width: '100%',
  marginBottom: '32px'
}))

const Unauthorized = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  return (
    <FlexBox height="100vh" alignItems="center" justifyContent="center">
      <JustifyBox>
        <IMG src="/assets/images/illustrations/unauthorized.svg" alt="" />
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 2, color: 'text.primary' }}
        >
          Unauthorized Access
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 4, color: 'text.secondary' }}
        >
          You do not have permission to access this page.
        </Typography>
        <Button
          color="primary"
          variant="contained"
          onClick={() => navigate('/dashboard')}
        >
          Go Home
        </Button>
      </JustifyBox>
    </FlexBox>
  )
}

export default Unauthorized
