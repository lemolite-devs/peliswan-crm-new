import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  Icon
} from '@mui/material'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import axiosInstance from 'axiosInstance'
import { HandleError } from 'app/utils/handleError'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'
import InputTextField from '../InputFields/InputTextField'

const validationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[A-Za-z\s]+$/, 'Name must contain only letters and spaces')
    .min(2, 'Name must contain at least 2 letters')
    .required('Name is required'),
  email: Yup.string()
    .matches(
      /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i,
      'Please enter a valid email address'
    )
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be greater than 6'),
  role: Yup.string().required('Role Name is required'),
  mobileNumber: Yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Invalid mobile number'),
  city: Yup.string().required('City is required')
})

const UserForm = ({
  open,
  handleClose,
  handleAddUser,
  initialUser,
  submitting
}) => {
  const [roles, setRoles] = useState([])
  const [city, setCity] = useState([])
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [decryptedPassword, setDecryptedPassword] = useState('')

  useEffect(() => {
    if (open) {
      setShowPassword(false)
      setDecryptedPassword('')
    }
  }, [open])

  const handleClickShowPassword = async () => {
    setShowPassword((prev) => !prev)

    if (initialUser && !showPassword) {
      try {
        const response = await axiosInstance.get(
          `/api/users/${initialUser._id}/decrypt-password`
        )
        setDecryptedPassword(response.data.user.password)
      } catch (error) {
        HandleError(error, showSnackbar, navigate)
      }
    } else if (!initialUser) {
      setDecryptedPassword('')
    }
  }

  const getRoles = async () => {
    try {
      const response = await axiosInstance.get('/api/roles')
      if (response.data && Array.isArray(response.data)) {
        const roleArr = response.data.map((role) => ({
          value: role.name,
          label: role.name
        }))
        setRoles(roleArr || [])
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  const getCities = async () => {
    try {
      const response = await axiosInstance.get('/api/states')
      if (response?.data && Array.isArray(response.data)) {
        const cities = response.data.flatMap((state) => state.cities)
        const uniqueCities = [...new Set(cities)]
        const cityArr = uniqueCities.map((city) => ({
          value: city,
          label: city
        }))
        setCity(cityArr || [])
      }
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    }
  }

  useEffect(() => {
    getCities()
    getRoles()
  }, [])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {initialUser ? 'Edit User' : 'Add User'}
      </DialogTitle>

      <Formik
        initialValues={{
          name: initialUser ? initialUser?.name : '',
          email: initialUser ? initialUser?.email : '',
          password: initialUser ? initialUser?.password : '',
          role: initialUser ? initialUser?.role?.name : '',
          mobileNumber: initialUser ? initialUser?.mobileNumber : '',
          city: initialUser ? initialUser?.city : ''
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            submitting.setIsSubmitting(true)
            setSubmitting(true) // Set submitting to true
            await handleAddUser(values) // Ensure handleAddUser is async
            handleClose() // Close modal only if successful
            resetForm()
          } catch (error) {
            submitting.setIsSubmitting(false)
            HandleError(error, showSnackbar, navigate)
            setSubmitting(false) // Set submitting to false
          } finally {
            submitting.setIsSubmitting(false)
            setSubmitting(false)
          }
        }}
      >
        {({
          isSubmitting,
          handleChange,
          handleBlur,
          values,
          errors,
          touched
        }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                {initialUser
                  ? 'Edit the User details below.'
                  : 'Please fill out the form to add a new user.'}
              </DialogContentText>

              <InputTextField
                id="name"
                name="name"
                label="Name"
                margin="dense"
                formik={{ values, handleChange, handleBlur, errors, touched }}
                autoComplete="off"
              />
              <InputTextField
                id="email"
                name="email"
                label="Email"
                margin="dense"
                formik={{ values, handleChange, handleBlur, errors, touched }}
                disabled={false}
                autoComplete="off"
              />
              <InputTextField
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="dense"
                formik={{ values, handleChange, handleBlur, errors, touched }}
                autoComplete="off"
                value={
                  initialUser
                    ? showPassword
                      ? decryptedPassword
                      : values.password
                    : values.password
                }
                onChange={(e) => {
                  handleChange(e)
                  if (showPassword) {
                    setDecryptedPassword(e.target.value)
                  }
                }}
                onBlur={handleBlur}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleClickShowPassword}
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? (
                          <Icon>visibility</Icon>
                        ) : (
                          <Icon>visibility_off</Icon>
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  name="role"
                  labelId="role-label"
                  label="Role"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.role}
                  error={Boolean(errors.role && touched.role)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorMessage
                  name="role"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl>

              <InputTextField
                id="mobileNumber"
                name="mobileNumber"
                label="Mobile Number"
                margin="normal"
                formik={{ values, handleChange, handleBlur, errors, touched }}
                autoComplete="off"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="city-label">City</InputLabel>
                <Select
                  name="city"
                  labelId="city-label"
                  label="City"
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(errors.city && touched.city)}
                >
                  {city.map((city) => (
                    <MenuItem key={city.value} value={city.value}>
                      {city.label}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorMessage
                  name="city"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} />
                ) : initialUser ? (
                  'Save Changes'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}

export default UserForm
