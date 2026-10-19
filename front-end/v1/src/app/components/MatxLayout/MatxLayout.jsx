import { MatxSuspense } from 'app/components'
import useSettings from 'app/hooks/useSettings'
import { MatxLayouts } from './index'
import { Outlet, useLocation } from 'react-router-dom'

export default function MatxLayout(props) {
  const { pathname } = useLocation()

  const { settings } = useSettings()
  const Layout = MatxLayouts[settings.activeLayout]

  if (pathname === '/unauthorized') {
    return <Outlet />
  }

  return (
    <MatxSuspense>
      <Layout {...props} />
    </MatxSuspense>
  )
}
