import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Grid,
  TextField,
  Box,
  styled,
  IconButton,
  InputAdornment,
  Icon
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Formik } from 'formik'
import * as Yup from 'yup'
import useAuth from 'app/hooks/useAuth'
import { useSnackbar } from 'app/snakebarContext'

const FlexBox = styled(Box)(() => ({
  display: 'flex'
}))

const ContentBox = styled('div')(() => ({
  height: '100%',
  padding: '32px',
  position: 'relative',
  background: 'rgba(0, 0, 0, 0.01)'
}))

const StyledRoot = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#1A2038',
  minHeight: '100% !important',
  '& .card': {
    maxWidth: 800,
    minHeight: 400,
    margin: '1rem',
    display: 'flex',
    borderRadius: 12,
    alignItems: 'center'
  },

  '.img-wrapper': {
    height: '100%',
    minWidth: 320,
    display: 'flex',
    padding: '2rem',
    alignItems: 'center',
    justifyContent: 'center'
  }
}))

const initialValues = {
  identifier: '',
  password: '',
  remember: true
}

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be 6 characters long')
    .required('Password is required!'),
  identifier: Yup.string()
    .min(3, 'Email/User ID must be at least 3 characters long')
    .required('Email/User ID is required!')
})

export default function JwtLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [showPassword, setShowPassword] = useState(false)

  const handleFormSubmit = async (values) => {
    setLoading(true)
    try {
      const response = await login(values.identifier, values.password)

      if (response.status === 200) {
        // navigate('/dashboard')
        // showSnackbar({
        //   message: 'Login Successful!',
        //   severity: 'success',
        //   vertical: 'top',
        //   horizontal: 'right'
        // })
        //
        window.location.href = '/'
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showSnackbar({
          message: 'UserID/Email or Password is Incorrect!',
          severity: 'error',
          vertical: 'top',
          horizontal: 'right'
        })
      }
      setLoading(false)
    }
  }
  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev)
  }
  return (
    <StyledRoot>
      <Card className="card">
        <Grid container>
          <Grid item sm={6} xs={12}>
            <div className="img-wrapper">
              <img
                src="/assets/images/illustrations/dreamer.svg"
                width="100%"
                alt=""
              />
            </div>
          </Grid>

          <Grid item sm={6} xs={12}>
            <ContentBox>
              <Formik
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={validationSchema}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit
                }) => (
                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      size="small"
                      type="text"
                      name="identifier"
                      label="Email / UserID"
                      variant="outlined"
                      onBlur={handleBlur}
                      value={values.identifier}
                      onChange={handleChange}
                      helperText={touched.identifier && errors.identifier}
                      error={Boolean(errors.identifier && touched.identifier)}
                      sx={{ mb: 3 }}
                      autoComplete="off"
                    />

                    <TextField
                      fullWidth
                      size="small"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      variant="outlined"
                      onBlur={handleBlur}
                      value={values.password}
                      onChange={handleChange}
                      helperText={touched.password && errors.password}
                      error={Boolean(errors.password && touched.password)}
                      sx={{ mb: 1.5 }}
                      autoComplete="off"
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

                    <LoadingButton
                      type="submit"
                      color="primary"
                      loading={loading}
                      variant="contained"
                      sx={{ my: 2 }}
                    >
                      Login
                    </LoadingButton>
                  </form>
                )}
              </Formik>
            </ContentBox>
          </Grid>
        </Grid>
      </Card>
    </StyledRoot>
  )
}
