import React from 'react'
import { TextField, InputLabel } from '@mui/material'
import { styled } from '@mui/material/styles'

const RedAsterisk = styled('span')({
  color: 'red'
})

const InputTextField = ({
  id,
  name,
  label,
  required = false,
  formik,
  margin = 'dense',
  fullWidth = true,
  rows,
  type = 'text',
  ...props
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      id={id}
      type={type}
      name={name}
      label={
        <>
          {label}
          {/* {required && <RedAsterisk> *</RedAsterisk>} */}
        </>
      }
      margin={margin}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      multiline={Boolean(rows)}
      rows={rows || 1}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...props}
    />
  )
}

export default InputTextField
