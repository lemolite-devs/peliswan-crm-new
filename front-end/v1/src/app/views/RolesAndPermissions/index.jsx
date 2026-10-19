import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
  FormControlLabel
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import axiosInstance from 'axiosInstance'
import styled from '@emotion/styled'
import { Breadcrumb } from 'app/components'

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  }
}))

const permissions = {
  Dashboard: [
    // 'LiveAnalytics',
    'TeamPerformance',
    'QuantityRecords',
    // 'OverallSalesRecord',
    'LeadOverview',
    'SalesHistory'
  ],
  Leads: ['view', 'add', 'edit', 'delete', 'transfer'],
  Customers: ['view', 'add', 'edit', 'delete'],
  Tasks: ['view', 'add', 'edit', 'delete'],
  Sales: {
    Proposals: ['view', 'add', 'edit', 'delete'],
    Items: ['view', 'add', 'edit', 'delete']
  },
  Chat: ['view'],
  Staff: ['view', 'add', 'edit', 'delete'],
  Definition: ['view', 'add', 'edit', 'delete'],
  RolesAndPermissions: ['view', 'edit']
}

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([])
  const [expandedModule, setExpandedModule] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'))

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get('/api/roles')
      setRoles(response.data)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handlePermissionChange = async (
    role,
    module,
    subModule,
    permission
  ) => {
    const permissionKey = subModule ? `${module}.${subModule}` : module
    const permissionString = `${permissionKey}:${permission}`

    let updatedPermissions = [...role.permissions]

    const index = updatedPermissions.indexOf(permissionString)

    if (index > -1) {
      // If the permission is being removed
      updatedPermissions.splice(index, 1)
    } else {
      // If the permission is being added
      updatedPermissions.push(permissionString)
      // Always ensure Dashboard:view is included
      if (!updatedPermissions.includes('Dashboard:view')) {
        updatedPermissions.push('Dashboard:view')
      }
    }

    try {
      await axiosInstance.put(`/api/roles/${role._id}`, {
        permissions: updatedPermissions
      })
      fetchRoles() // Fetch updated roles after successful update
    } catch (error) {
      console.error('Error updating permissions:', error)
    }
  }

  const handleAllPermissionsChange = async (role, module, subModule = null) => {
    const modulePermissions = subModule
      ? permissions[module][subModule]
      : permissions[module]
    const permissionKey = subModule ? `${module}.${subModule}` : module

    let updatedPermissions = [...role.permissions]
    let allPermissions = []

    if (Array.isArray(modulePermissions)) {
      allPermissions = modulePermissions
    } else if (typeof modulePermissions === 'object') {
      allPermissions = Object.values(modulePermissions).flat()
    }

    const allPermissionsSelected = allPermissions.every((permission) =>
      updatedPermissions.includes(`${permissionKey}:${permission}`)
    )

    if (allPermissionsSelected) {
      // Remove all permissions for this module, but keep Dashboard:view
      updatedPermissions = updatedPermissions.filter(
        (p) => !p.startsWith(`${permissionKey}:`) || p === 'Dashboard:view'
      )
    } else {
      // Add all permissions for this module and ensure Dashboard:view is included
      allPermissions.forEach((permission) => {
        const permissionString = `${permissionKey}:${permission}`
        if (!updatedPermissions.includes(permissionString)) {
          updatedPermissions.push(permissionString)
        }
      })
      // Always ensure Dashboard:view is included
      if (!updatedPermissions.includes('Dashboard:view')) {
        updatedPermissions.push('Dashboard:view')
      }
    }

    try {
      await axiosInstance.put(`/api/roles/${role._id}`, {
        permissions: updatedPermissions
      })
      fetchRoles()
    } catch (error) {
      console.error('Error updating permissions:', error)
    }
  }

  const renderPermissionCheckboxes = (
    role,
    module,
    subModule = null,
    isMobileView = false
  ) => {
    const modulePermissions = subModule
      ? permissions[module][subModule]
      : permissions[module]
    const permissionKey = subModule ? `${module}.${subModule}` : module

    let allPermissions = []
    if (Array.isArray(modulePermissions)) {
      allPermissions = modulePermissions
    } else if (typeof modulePermissions === 'object') {
      allPermissions = Object.values(modulePermissions).flat()
    }

    const allPermissionsSelected = allPermissions.every((permission) =>
      role.permissions.includes(`${permissionKey}:${permission}`)
    )

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {(module !== 'Sales' || subModule) && (
          <FormControlLabel
            control={
              <Checkbox
                checked={allPermissionsSelected}
                onChange={() =>
                  handleAllPermissionsChange(role, module, subModule)
                }
                size="medium"
                sx={{ '& .MuiSvgIcon-root': { fontSize: 40 } }}
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Select All
              </Typography>
            }
          />
        )}
        <Box
          sx={{
            display: isMobileView ? 'block' : 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            ml: subModule ? 4 : 0
          }}
        >
          {allPermissions.map((permission) => (
            <Box
              key={permission}
              sx={{
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                mb: isMobileView ? 1 : 0,
                width: isMobileView ? '100%' : 'auto'
              }}
            >
              <Checkbox
                checked={role.permissions.includes(
                  `${permissionKey}:${permission}`
                )}
                onChange={() =>
                  handlePermissionChange(role, module, subModule, permission)
                }
                size="medium"
                sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
              />
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {permission}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  const renderModuleAccordion = (role, module) => {
    return (
      <Accordion
        key={module}
        expanded={expandedModule === module}
        onChange={() =>
          setExpandedModule(expandedModule === module ? null : module)
        }
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {module === 'RolesAndPermissions' ? 'Role And Permissions' : module}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {module === 'Sales' ? (
            <Box>
              {Object.keys(permissions[module]).map((subModule) => (
                <Box key={subModule} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">{subModule}</Typography>
                  {renderPermissionCheckboxes(role, module, subModule, true)}
                </Box>
              ))}
            </Box>
          ) : (
            renderPermissionCheckboxes(role, module, null, true)
          )}
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderTableContent = (role, module) => {
    if (module === 'Sales') {
      return (
        <Box>
          {Object.keys(permissions[module]).map((subModule) => (
            <Box key={subModule} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {/* {subModule === 'Orders'
                  ? subModule.replace('Orders', 'Sales Orders')
                  : subModule} */}
                {subModule === 'Orders'
                  ? subModule.replace('Orders', ' Orders')
                  : subModule}
              </Typography>
              {renderPermissionCheckboxes(role, module, subModule)}
            </Box>
          ))}
        </Box>
      )
    } else {
      return renderPermissionCheckboxes(role, module)
    }
  }

  return (
    <Container>
      <Box className="breadcrumb">
        <Breadcrumb routeSegments={[{ name: 'Roles and Permissions' }]} />
      </Box>
      <Box>
        <Paper
          elevation={isMobile ? 0 : 3}
          sx={{
            p: isMobile ? 1 : 3,
            bgcolor: 'background.paper',
            boxShadow: isMobile ? 'none' : undefined
          }}
        >
          {roles.map((role) => (
            <Accordion
              key={role._id}
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '16px 0'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: (theme) =>
                    role.name === 'Admin'
                      ? '#002855'
                      : role.name === 'Sales Manager'
                        ? '#023e7d'
                        : '#0353a4',
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  '&.Mui-expanded': {
                    minHeight: 56
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0'
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }}
              >
                <Typography variant="h6">{role.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {isMobile || isTablet ? (
                  Object.keys(permissions).map((module) =>
                    renderModuleAccordion(role, module)
                  )
                ) : (
                  <TableContainer>
                    <Table size="medium">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              width: '40px',
                              fontWeight: 'bold',
                              fontSize: '1rem'
                            }}
                          >
                            No
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                          >
                            Module
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                          >
                            Permissions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.keys(permissions).map(
                          (module, index, array) => (
                            <TableRow
                              key={module}
                              sx={
                                index === array.length - 1
                                  ? {
                                      '&:last-child td, &:last-child th': {
                                        border: 0
                                      }
                                    }
                                  : {}
                              }
                            >
                              <TableCell sx={{ width: '40px' }}>
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                {module === 'RolesAndPermissions'
                                  ? 'Role And Permissions'
                                  : module}
                              </TableCell>
                              <TableCell>
                                {renderTableContent(role, module)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Box>
    </Container>
  )
}

export default RolesAndPermissions
