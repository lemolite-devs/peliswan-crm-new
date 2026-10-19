import { clearAllCookies } from './cookieFunctions'

// utils/errorHandler.js
export const HandleError = (error, showSnackbar, navigate) => {
  // const navigate = useNavigate()
  let message = 'An unexpected error occurred'

  if (error.response) {
    switch (error.response.status) {
      case 400:
        if (Array.isArray(error.response.data.errors)) {
          // Join all error messages into a single string
          message = error.response.data.errors.join(`\n`)
        } else {
          message =
            error.response.data.message ||
            'Bad Request: Please check your input'
        }
        break
      case 401:
        message =
          error.response.message || 'Session Expired, Plaese Login Again'
        clearAllCookies()
        navigate('/session/signin')
        break
      case 403:
        message =
          error.response.message ||
          'Forbidden: You do not have permission to perform this action'
        break
      case 404:
        message =
          error.response.message ||
          'Not Found: The requested resource could not be found'
        break
      case 409:
        message =
          error.response.data.message || 'Conflict: The resource already exists'
        break
      case 500:
        message =
          error.response.message ||
          'Internal Server Error: Please try again later'
        break
      default:
        message = `Error: ${error.response.statusText}`
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Network error: Please check your internet connection'
  } else {
    // Something happened in setting up the request that triggered an Error
    message = error.response.message || 'An unexpected error occurred'
  }

  console.error('Error:', error)

  // Use showSnackbar to display the error message
  if (showSnackbar) {
    showSnackbar({
      message: message,
      severity: 'error',
      vertical: 'top',
      horizontal: 'right'
    })
  }
}
