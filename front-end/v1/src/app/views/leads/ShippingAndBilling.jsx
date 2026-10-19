import React, { useState, useEffect } from 'react'
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Box
} from '@mui/material'
import * as Yup from 'yup'
import { Formik, Form, FieldArray } from 'formik'
import InputTextField from 'app/components/InputFields/InputTextField'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'

const ShippingAndBilling = ({
  states,
  // States/provinces of the lead's country; falls back to the full list.
  countryStates,
  stateCityMap,
  buttonTextSubmit,
  handleCloseModal,
  buttonTextCancel,
  editId,
  apiEndpoint,
  shippingAndBilling,
  setShippingAndBilling,
  setActiveTab,
  companyNames = []
}) => {
  const [billingCities, setBillingCities] = useState([])
  const [shippingCities, setShippingCities] = useState([])
  const { showSnackbar } = useSnackbar()

  const stateOptions = countryStates?.length ? countryStates : states

  const initialValues = {
    addresses: shippingAndBilling?.length
      ? shippingAndBilling.map((item) => ({
          companyName: item.companyName || '',
          billingAddress: item.billingAddress.address || '',
          billingState: item.billingAddress.state || '',
          billingCity: item.billingAddress.city || '',
          billingZipCode: item.billingAddress.zipCode || '',
          shippingAddress: item.shippingAddress.address || '',
          shippingState: item.shippingAddress.state || '',
          shippingCity: item.shippingAddress.city || '',
          shippingZipCode: item.shippingAddress.zipCode || '',
          isBillingAndShippingSame: item.isBillingAndShippingSame || false
        }))
      : [
          {
            companyName: '',
            billingAddress: '',
            billingState: '',
            billingCity: '',
            billingZipCode: '',
            shippingAddress: '',
            shippingState: '',
            shippingCity: '',
            shippingZipCode: '',
            isBillingAndShippingSame: false
          }
        ]
  }

  useEffect(() => {
    if (shippingAndBilling?.length) {
      const allBillingCities = []
      const allShippingCities = []

      shippingAndBilling.forEach((address) => {
        const { billingAddress, shippingAddress } = address

        if (billingAddress?.state) {
          const cities = stateCityMap[billingAddress.state] || []
          allBillingCities.push(...cities)
        }

        if (shippingAddress?.state) {
          const cities = stateCityMap[shippingAddress.state] || []
          allShippingCities.push(...cities)
        }
      })

      // Ensure no duplicate cities and set state
      setBillingCities([...new Set(allBillingCities)])
      setShippingCities([...new Set(allShippingCities)])
    }
  }, [shippingAndBilling, stateCityMap])

  const validationSchema = Yup.object().shape({
    addresses: Yup.array().of(
      Yup.object().shape({
        billingAddress: Yup.string().required('Billing Address is required'),
        billingState: Yup.string().required('Billing State is required'),
        billingCity: Yup.string().required('Billing City is required'),
        billingZipCode: Yup.string().required('Billing Zip Code is required'),
        shippingAddress: Yup.string().required('Shipping Address is required'),
        shippingState: Yup.string().required('Shipping State is required'),
        shippingCity: Yup.string().required('Shipping City is required'),
        shippingZipCode: Yup.string().required('Shipping Zip Code is required')
      })
    )
  })

  const handleSubmit = async (values, { setSubmitting }) => {
    // Transform the addresses into the required format
    const transformedAddresses = values.addresses.map((address) => ({
      companyName: address.companyName,
      billingAddress: {
        address: address.billingAddress,
        state: address.billingState,
        city: address.billingCity,
        zipCode: address.billingZipCode
      },
      shippingAddress: {
        address: address.shippingAddress,
        state: address.shippingState,
        city: address.shippingCity,
        zipCode: address.shippingZipCode
      },
      isBillingAndShippingSame: address.isBillingAndShippingSame
    }))

    try {
      let response

      if (shippingAndBilling?.length === 0) {
        response = await axiosInstance.post(`api/leads/${editId}/addresses`, {
          addresses: transformedAddresses
        })
        if (response.status === 201) {
          showSnackbar({
            message: 'Addresses added successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          // setActiveTab(3)
          handleCloseModal()
        } else {
          showSnackbar({
            message: 'Failed to add  addresses',
            severity: 'error',
            vertical: 'top',
            horizontal: 'right'
          })
        }
      } else {
        // If there are addresses, perform a PUT request to update
        response = await axiosInstance.put(`api/leads/${editId}/addresses`, {
          addresses: transformedAddresses
        })
        if (response.status === 200) {
          showSnackbar({
            message: 'Addresses updated successfully!',
            severity: 'success',
            vertical: 'top',
            horizontal: 'right'
          })
          handleCloseModal()
        } else {
          showSnackbar({
            message: 'Failed to  update addresses',
            severity: 'error',
            vertical: 'top',
            horizontal: 'right'
          })
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      HandleError(showSnackbar, error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, setFieldValue, handleChange }) => (
        <Form>
          <FieldArray name="addresses">
            {({ push, remove }) => (
              <>
                <Box display="flex" justifyContent="flex-end" marginBottom={2}>
                  <Button
                    variant="outlined"
                    sx={{ fontSize: 'medium' }}
                    color="primary"
                    onClick={() =>
                      push({
                        companyName: '',
                        billingAddress: '',
                        billingState: '',
                        billingCity: '',
                        billingZipCode: '',
                        shippingAddress: '',
                        shippingState: '',
                        shippingCity: '',
                        shippingZipCode: '',
                        isBillingAndShippingSame: false
                      })
                    }
                  >
                    +
                  </Button>
                </Box>
                {values.addresses.map((address, index) => (
                  <Box key={index} mb={4} border={1} borderRadius={2} p={2}>
                    <Box display="flex" justifyContent="space-between">
                      <h3>Address {index + 1}</h3>
                      {index > 0 && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => remove(index)}
                          sx={{ fontSize: 'medium' }}
                        >
                          -
                        </Button>
                      )}
                    </Box>
                    <FormControl
                      sx={{ width: '100%', mb: 2 }}
                      margin="dense"
                      error={
                        touched.addresses?.[index]?.companyName &&
                        Boolean(errors.addresses?.[index]?.companyName)
                      }
                    >
                      <InputLabel id={`addresses.${index}.companyName`}>
                        <Box
                          sx={{
                            backgroundColor: 'white',
                            padding: '0 6px',
                            '&:focus-within': { color: 'blue' },
                            transition: 'color 0.3s ease'
                          }}
                        >
                          Company Name
                        </Box>
                      </InputLabel>
                      <Select
                        labelId={`addresses.${index}.companyName`}
                        id={`addresses.${index}.companyName`}
                        name={`addresses.${index}.companyName`}
                        value={values.addresses[index].companyName}
                        onChange={handleChange}
                      >
                        {companyNames.filter(Boolean).length > 0 ? (
                          companyNames
                            .filter(Boolean)
                            .map((company) => (
                              <MenuItem key={company} value={company}>
                                {company}
                              </MenuItem>
                            ))
                        ) : (
                          <MenuItem value="" disabled>
                            No Company Available
                          </MenuItem>
                        )}
                      </Select>
                      {touched.addresses?.[index]?.companyName &&
                        errors.addresses?.[index]?.companyName && (
                          <FormHelperText>
                            {errors.addresses[index].companyName}
                          </FormHelperText>
                        )}
                    </FormControl>
                    <Box
                      display="flex"
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      gap={4}
                    >
                      <Box width={{ xs: '100%', sm: '48%' }}>
                        <h4>Billing Address</h4>
                        <InputTextField
                          id={`addresses.${index}.billingAddress`}
                          name={`addresses.${index}.billingAddress`}
                          label="Billing Address"
                          rows={2}
                          required
                          value={values.addresses[index].billingAddress}
                          formik={{ values, errors, touched, handleChange }}
                        />

                        <FormControl
                          sx={{ width: '100%', mt: 2 }}
                          margin="dense"
                          error={
                            touched.addresses?.[index]?.billingState &&
                            Boolean(errors.addresses?.[index]?.billingState)
                          }
                        >
                          <InputLabel id={`addresses.${index}.billingState`}>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                padding: '0 6px',
                                '&:focus-within': {
                                  color: 'blue'
                                },
                                transition: 'color 0.3s ease'
                              }}
                            >
                              {' '}
                              State
                            </Box>
                          </InputLabel>
                          <Select
                            labelId={`addresses.${index}.billingState`}
                            id={`addresses.${index}.billingState`}
                            name={`addresses.${index}.billingState`}
                            value={values.addresses[index].billingState}
                            onChange={(e) => {
                              handleChange(e)
                              setFieldValue(
                                `addresses.${index}.billingCity`,
                                ''
                              )
                              setBillingCities(
                                stateCityMap[e.target.value] || []
                              )
                            }}
                          >
                            {stateOptions.map((state) => (
                              <MenuItem key={state} value={state}>
                                {state}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.addresses?.[index]?.billingState &&
                            errors.addresses?.[index]?.billingState && (
                              <FormHelperText>
                                {errors.addresses[index].billingState}
                              </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl
                          sx={{ width: '100%', mt: 2 }}
                          margin="dense"
                          error={
                            touched.addresses?.[index]?.billingCity &&
                            Boolean(errors.addresses?.[index]?.billingCity)
                          }
                        >
                          <InputLabel id={`addresses.${index}.billingCity`}>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                padding: '0 6px',
                                '&:focus-within': {
                                  color: 'blue'
                                },
                                transition: 'color 0.3s ease'
                              }}
                            >
                              {' '}
                              City
                            </Box>
                          </InputLabel>
                          <Select
                            labelId={`addresses.${index}.billingCity`}
                            id={`addresses.${index}.billingCity`}
                            name={`addresses.${index}.billingCity`}
                            value={values.addresses[index].billingCity}
                            onChange={(e) => {
                              handleChange(e)
                            }}
                          >
                            {billingCities.map((city, idx) => (
                              <MenuItem key={idx} value={city}>
                                {city}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.addresses?.[index]?.billingCity &&
                            errors.addresses?.[index]?.billingCity && (
                              <FormHelperText>
                                {errors.addresses[index].billingCity}
                              </FormHelperText>
                            )}
                        </FormControl>

                        <InputTextField
                          id={`addresses.${index}.billingZipCode`}
                          name={`addresses.${index}.billingZipCode`}
                          label="Zip Code"
                          formik={{ values, errors, touched, handleChange }}
                          value={values.addresses[index].billingZipCode}
                        />

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                values.addresses[index].isBillingAndShippingSame
                              }
                              onChange={(e) => {
                                const isChecked = e.target.checked
                                setFieldValue(
                                  `addresses.${index}.isBillingAndShippingSame`,
                                  isChecked
                                )

                                if (isChecked) {
                                  // Copy Billing Address to Shipping Address
                                  setFieldValue(
                                    `addresses.${index}.shippingAddress`,
                                    values.addresses[index].billingAddress
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingState`,
                                    values.addresses[index].billingState
                                  )
                                  setShippingCities(
                                    stateCityMap[
                                      values.addresses[index].billingState
                                    ] || []
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingCity`,
                                    values.addresses[index].billingCity
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingZipCode`,
                                    values.addresses[index].billingZipCode
                                  )
                                } else {
                                  // Clear Shipping Address fields
                                  setFieldValue(
                                    `addresses.${index}.shippingAddress`,
                                    ''
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingState`,
                                    ''
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingCity`,
                                    ''
                                  )
                                  setFieldValue(
                                    `addresses.${index}.shippingZipCode`,
                                    ''
                                  )
                                  setShippingCities([])
                                }
                              }}
                              name={`addresses.${index}.isBillingAndShippingSame`}
                            />
                          }
                          label="Same as Billing Address"
                        />
                      </Box>

                      <Box width={{ xs: '100%', sm: '48%' }}>
                        <h4>Shipping Address</h4>

                        <InputTextField
                          id={`addresses.${index}.shippingAddress`}
                          name={`addresses.${index}.shippingAddress`}
                          label="Shipping Address"
                          rows={2}
                          required
                          formik={{ values, errors, touched, handleChange }}
                          value={values.addresses[index].shippingAddress}
                          disabled={
                            values.addresses[index].isBillingAndShippingSame
                          }
                        />

                        <FormControl
                          sx={{ width: '100%', mt: 2 }}
                          margin="dense"
                          error={
                            touched.addresses?.[index]?.shippingState &&
                            Boolean(errors.addresses?.[index]?.shippingState)
                          }
                        >
                          <InputLabel id={`addresses.${index}.shippingState`}>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                padding: '0 6px',
                                '&:focus-within': {
                                  color: 'blue'
                                },
                                transition: 'color 0.3s ease'
                              }}
                            >
                              State
                            </Box>
                          </InputLabel>
                          <Select
                            labelId={`addresses.${index}.shippingState`}
                            id={`addresses.${index}.shippingState`}
                            name={`addresses.${index}.shippingState`}
                            value={values.addresses[index].shippingState}
                            onChange={(e) => {
                              handleChange(e)
                              // setFieldValue(
                              //   `addresses.${index}.shippingState`,
                              //   ''
                              // )
                              setShippingCities(
                                stateCityMap[e.target.value] || []
                              )
                            }}
                            disabled={
                              values.addresses[index].isBillingAndShippingSame
                            }
                          >
                            {stateOptions.map((state) => (
                              <MenuItem key={state} value={state}>
                                {state}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.addresses?.[index]?.shippingState &&
                            errors.addresses?.[index]?.shippingState && (
                              <FormHelperText>
                                {errors.addresses[index].shippingState}
                              </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl
                          sx={{ width: '100%', mt: 2 }}
                          margin="dense"
                          error={
                            touched.addresses?.[index]?.shippingCity &&
                            Boolean(errors.addresses?.[index]?.shippingCity)
                          }
                        >
                          <InputLabel id={`addresses.${index}.shippingCity`}>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                padding: '0 6px',
                                '&:focus-within': {
                                  color: 'blue'
                                },
                                transition: 'color 0.3s ease'
                              }}
                            >
                              City
                            </Box>
                          </InputLabel>
                          <Select
                            labelId={`addresses.${index}.shippingCity`}
                            id={`addresses.${index}.shippingCity`}
                            name={`addresses.${index}.shippingCity`}
                            value={values.addresses[index].shippingCity}
                            onChange={(e) => {
                              handleChange(e)
                              // setFieldValue(
                              //   `addresses.${index}.shippingCity`,
                              //   ''
                              // )
                              // setShippingCities(
                              //   stateCityMap[e.target.value] || []
                              // )
                            }}
                            disabled={
                              values.addresses[index]
                                .isBillingAndShippingSame ||
                              !shippingCities.length
                            }
                          >
                            {shippingCities.map((city, idx) => (
                              <MenuItem key={idx} value={city}>
                                {city}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.addresses?.[index]?.shippingCity &&
                            errors.addresses?.[index]?.shippingCity && (
                              <FormHelperText>
                                {errors.addresses[index].shippingCity}
                              </FormHelperText>
                            )}
                        </FormControl>

                        <InputTextField
                          id={`addresses.${index}.shippingZipCode`}
                          name={`addresses.${index}.shippingZipCode`}
                          label="Zip Code"
                          formik={{ values, errors, touched, handleChange }}
                          value={values.addresses[index].shippingZipCode}
                          disabled={
                            values.addresses[index].isBillingAndShippingSame
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </FieldArray>
          {errors.apiError && (
            <Box color="error.main" mt={2}>
              {errors.apiError}
            </Box>
          )}
          <Box marginTop={4} display="flex" justifyContent="space-between">
            <Button variant="contained" color="primary" type="submit">
              {buttonTextSubmit}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCloseModal}
            >
              {buttonTextCancel}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  )
}

export default ShippingAndBilling
