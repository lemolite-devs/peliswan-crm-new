import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import * as serviceWorker from './serviceWorker'
import App from './app/App'
import { AuthProvider } from 'app/contexts/JWTAuthContext'

// third party style
import 'perfect-scrollbar/css/perfect-scrollbar.css'
import { SnackbarProvider } from 'app/snakebarContext'

const root = createRoot(document.getElementById('root'))

root.render(
  <BrowserRouter>
    <SnackbarProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SnackbarProvider>
  </BrowserRouter>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
