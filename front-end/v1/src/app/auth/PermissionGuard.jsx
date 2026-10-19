import useAuth from 'app/hooks/useAuth'
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const PermissionGuard = ({
  permissions,
  redirectTo = '/unauthorized',
  children
}) => {
  const { hasPermission, user } = useAuth()
  const location = useLocation()

  const hasAccess = () => {
    if (!permissions || permissions.length === 0) {
      // If no permissions are specified, allow access
      return true
    }
    return permissions.every((permission) => hasPermission(permission))
  }

  if (!hasAccess()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default PermissionGuard
