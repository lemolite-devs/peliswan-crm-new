import { useRoutes } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'

import { MatxTheme } from './components'
// ALL CONTEXTS
import { AuthProvider } from './contexts/JWTAuthContext'
import SettingsProvider from './contexts/SettingsContext'
// ROUTES
import routes from './routes'
import { SocketProvider } from './contexts/SocketContext'

export default function App() {
  const content = useRoutes(routes)

  return (
    <SettingsProvider>
      <AuthProvider>
        <SocketProvider>
          <MatxTheme>
            <CssBaseline />
            {content}
          </MatxTheme>
        </SocketProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}
