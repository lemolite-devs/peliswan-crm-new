import React, { useState } from 'react'
import { Container, Box, Button, TextField, Typography } from '@mui/material'
import axiosInstance from 'axiosInstance'
import { useSnackbar } from 'app/snakebarContext'
import { HandleError } from 'app/utils/handleError'
import { Formik, Field, Form, FieldArray } from 'formik'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'

const GstDetails = ({
  editId,
  buttonTextSubmit = 'Save',
  buttonTextCancel = 'Cancel',
  handleCloseModal,
  gstDetailsData
}) => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)

  const initialValues = {
    gstDetails: gstDetailsData?.length
      ? gstDetailsData.map((detail) => ({
          name: detail.name || '',
          file: null,
          originalFileName: detail.uploadedFile?.filename || ''
        }))
      : [{ name: '', file: null, originalFileName: '' }]
  }

  const validationSchema = Yup.object().shape({
    gstDetails: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('GST Name is required'),
        file: Yup.mixed()
          .test(
            'fileType',
            'Only PDF files are allowed',
            (value) => !value || (value && value.type === 'application/pdf')
          )
          .notRequired()
      })
    )
  })

  const handleSubmit = async (values) => {
    try {
      setLoading(true)

      const formData = new FormData()

      values.gstDetails.forEach((detail, index) => {
        formData.append(`name[${index}]`, detail.name)

        if (detail.file) {
          formData.append(`file[${index}]`, detail.file)
        } else if (detail.originalFileName) {
          formData.append(`file[${index}]`, null)
        }
      })

      let response

      if (gstDetailsData?.length > 0) {
        response = await axiosInstance.put(
          `/api/leads/${editId}/gst-details`,
          formData
        )
        showSnackbar({
          message: 'GST Details updated successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
      } else {
        response = await axiosInstance.post(
          `/api/leads/${editId}/gst-details`,
          formData
        )
        showSnackbar({
          message: 'GST Details added successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'right'
        })
      }

      handleCloseModal()
    } catch (error) {
      HandleError(error, showSnackbar, navigate)
    } finally {
      setLoading(false)
    }
  }

  const displayFileName = (file, originalFileName) => {
    if (file instanceof File) {
      return file.name
    }
    return originalFileName || 'No file uploaded.'
  }

  return (
    <Container>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, touched, errors }) => (
          <Form>
            <FieldArray name="gstDetails">
              {({ push, remove }) => (
                <div>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems={'center'}
                    marginBottom={2}
                  >
                    <Button
                      variant="outlined"
                      onClick={() =>
                        push({ name: '', file: null, originalFileName: '' })
                      }
                      sx={{ fontSize: 'medium' }}
                    >
                      +
                    </Button>
                  </Box>
                  {values.gstDetails.map((gstDetail, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                      justifyContent={'center'}
                      gap={2}
                      marginBottom={2}
                    >
                      <Field
                        name={`gstDetails[${index}].name`}
                        as={TextField}
                        label={`GST Name ${index + 1}`}
                        value={gstDetail.name}
                        onChange={(e) =>
                          setFieldValue(
                            `gstDetails[${index}].name`,
                            e.target.value
                          )
                        }
                        fullWidth
                        error={
                          touched.gstDetails?.[index]?.name &&
                          Boolean(errors.gstDetails?.[index]?.name)
                        }
                        helperText={
                          touched.gstDetails?.[index]?.name &&
                          errors.gstDetails?.[index]?.name
                        }
                      />

                      <Button variant="outlined" component="label" fullWidth>
                        Upload PDF
                        <input
                          type="file"
                          hidden
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            setFieldValue(`gstDetails[${index}].file`, file)
                          }}
                        />
                      </Button>

                      <Box mt={1} width="100%">
                        <Typography variant="body2">
                          {displayFileName(
                            gstDetail.file,
                            gstDetail.originalFileName
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => remove(index)}
                          sx={{
                            fontSize: 'medium',
                            visibility: index > 0 ? 'visible' : 'hidden'
                          }}
                        >
                          -
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </div>
              )}
            </FieldArray>

            <Box marginTop={4} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="secondary"
                type="submit"
                disabled={loading}
              >
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
    </Container>
  )
}

export default GstDetails
