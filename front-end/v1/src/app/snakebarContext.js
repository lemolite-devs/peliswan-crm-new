import React, { createContext, useContext, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'
import Slide from '@mui/material/Slide'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

const SnackbarWrapper = styled(Snackbar)(({ theme }) => ({
  width: 'auto',
  marginTop: '1.2rem',
  maxWidth: '80%',
  minWidth: '300px',
  [theme.breakpoints.down('xs')]: {
    minWidth: '250px',
    maxWidth: '90%' // More space for mobile screens
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '96%' // Adjust for small screens
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: '70%'
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: '60%'
  }
}))

const SnackbarContext = createContext()

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    vertical: 'top',
    horizontal: 'right'
  })

  const theme = useTheme()
  const isXsScreen = useMediaQuery(theme.breakpoints.down('xs'))

  const showSnackbar = ({
    message,
    severity = 'success',
    vertical = 'top',
    horizontal = 'right'
  }) => {
    setSnackbar({
      open: true,
      message,
      severity,
      vertical,
      horizontal
    })
  }

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const Transition = (props) => {
    return (
      <Slide
        {...props}
        direction={props.in ? 'left' : 'right'} // Slide in from left and out to right
      />
    )
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar.open && (
        <SnackbarWrapper
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleClose}
          anchorOrigin={{
            vertical: snackbar.vertical,
            horizontal: snackbar.horizontal
          }}
          TransitionComponent={Transition}
        >
          <Alert
            onClose={handleClose}
            severity={snackbar.severity}
            sx={{
              width: 'auto',
              whiteSpace: 'pre-wrap',
              padding: isXsScreen ? '4px' : '8px',
              fontSize: isXsScreen ? '0.875rem' : '1rem',
              [theme.breakpoints.down('xs')]: {
                fontSize: '0.75rem'
              }
            }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </SnackbarWrapper>
      )}
    </SnackbarContext.Provider>
  )
}

export const useSnackbar = () => useContext(SnackbarContext)
