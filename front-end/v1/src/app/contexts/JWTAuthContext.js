import { createContext, useEffect, useReducer, useState } from 'react'
// CUSTOM COMPONENT
import { MatxLoading } from 'app/components'
import axiosInstance from 'axiosInstance'
import {
  clearAllCookies,
  getCookie,
  setCookie
} from 'app/utils/cookieFunctions'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_NAMES, DEFAULT_COUNTRY } from 'app/utils/constant'
const initialState = {
  user: null,
  isInitialized: false,
  isAuthenticated: false
}
const reducer = (state, action) => {
  switch (action.type) {
    case 'INIT': {
      const { isAuthenticated, user } = action.payload || {}

      return { ...state, isAuthenticated, isInitialized: true, user }
    }
    case 'LOGIN': {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      }
    }

    case 'LOGOUT': {
      return { ...state, isAuthenticated: false, user: null }
    }

    case 'REGISTER': {
      const { user } = action.payload

      return { ...state, isAuthenticated: true, user }
    }
    default:
      return state
  }
}
const AuthContext = createContext({
  ...initialState,
  method: 'JWT',
  login: () => {},
  logout: () => {},
  register: () => {},
  hasRole: () => {},
  hasPermission: () => {}
})

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const defaultVisibilityModel = {
    _id: true,
    action: true,
    customerName: true,
    companyName: true,
    mobileNumber: true,
    assignedToName: true,
    status: true,
    createdAt: true,
    // Visible by default: with more than one country in play it's the column
    // that disambiguates a lead's state/city and phone number.
    country: true,
    state: false,
    city: false,
    products: false,
    quantity: false
  }

  const initialVisibilityModel =
    JSON.parse(localStorage.getItem('lead_column_visibility_model')) ||
    defaultVisibilityModel

  const [leadColumnVisibilityModel, setLeadColumnVisibilityModel] = useState(
    initialVisibilityModel
  )

  useEffect(() => {
    localStorage.setItem(
      'lead_column_visibility_model',
      JSON.stringify(leadColumnVisibilityModel)
    )
  }, [leadColumnVisibilityModel])

  const [token, setToken] = useState(
    getCookie('peliswan_sales_crm_token') || ''
  )

  const navigate = useNavigate()

  // States and cities related state
  const [states, setStates] = useState([])
  const [stateCityMap, setStateCityMap] = useState({})
  const [allCities, setAllCities] = useState([])
  // country name -> state/province names, for the country -> state cascade
  const [countryStateMap, setCountryStateMap] = useState({})

  const [definitions, setDefinitions] = useState({
    id: '',
    values: []
  }) // state for the definitions

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get('/api/states')

      const statesData = response.data

      const stateNames = statesData.map((item) => item.state)
      setStates(stateNames)

      const stateCityMap = statesData.reduce((acc, item) => {
        acc[item.state] = item.cities
        return acc
      }, {})
      setStateCityMap(stateCityMap)

      // Group state/province names by country. Documents seeded before
      // countries existed have no `country`, so they fall back to India.
      const countryStateMap = statesData.reduce((acc, item) => {
        const country = item.country || DEFAULT_COUNTRY
        acc[country] = [...(acc[country] || []), item.state]
        return acc
      }, {})
      setCountryStateMap(countryStateMap)

      const allCities = Object.values(stateCityMap).flat()

      const uniqueCities = [...new Set(allCities)]

      const formattedCities = uniqueCities.map((name, index) => ({
        key: index,
        value: name
      }))
      setAllCities(formattedCities)
    } catch (err) {}
  }

  useEffect(() => {
    if (token) {
      fetchStates()
    }
  }, [token])

  const fetchDefinition = async (key) => {
    try {
      const response = await axiosInstance.get(`api/settings?key=definition`)
      setDefinitions(response.data)
    } catch (error) {
      console.error('Error fetching in definitions', error)
    }
  }
  useEffect(() => {
    if (token) {
      fetchDefinition('definition')
    }
  }, [token])

  const login = async (identifier, password) => {
    const response = await axiosInstance.post('/api/login', {
      identifier,
      password
    })

    if (response.status === 200) {
      const { accessToken, user } = response.data

      setCookie('peliswan_sales_crm_token', accessToken, 7)
      setToken(response.data.accessToken)

      // Store user data in localStorage for page refresh
      localStorage.setItem('tempUser', JSON.stringify(user))
      dispatch({ type: 'LOGIN', payload: { user } })
      return {
        status: 200
      }
    }
  }

  const register = async (email, username, password) => {
    const response = await axiosInstance.post('/api/auth/register', {
      email,
      username,
      password
    })
    const { user } = response.data

    dispatch({ type: 'REGISTER', payload: { user } })
  }

  const logout = () => {
    clearAllCookies()
    localStorage.removeItem('tempUser')
    navigate('/session/signin')
    dispatch({ type: 'LOGOUT' })
  }
  useEffect(() => {
    ;(async () => {
      try {
        const token = getCookie('peliswan_sales_crm_token')
        const tempUser = JSON.parse(localStorage.getItem('tempUser'))

        if (!token) {
          dispatch({
            type: 'INIT',
            payload: { isAuthenticated: false, user: null, token: null }
          })
        } else {
          if (tempUser) {
            // If we have a tempUser in localStorage, use it and remove it
            dispatch({
              type: 'INIT',
              payload: { isAuthenticated: true, user: tempUser }
            })
            localStorage.removeItem('tempUser')
            // navigate('/dashboard')
          } else {
            // If no tempUser, fetch user data from the server
            const payload = jwtDecode(token)
            const result = await axiosInstance.get(`/api/users/${payload.id}`)
            if (result.status === 200) {
              dispatch({
                type: 'INIT',
                payload: { isAuthenticated: true, user: result.data.user }
              })
              // navigate('/dashboard')
            }
          }
        }
      } catch (err) {
        console.error(err)
        logout()
      }
    })()
  }, [])

  const hasRole = (role) => {
    return state.user && state.user.role === role
  }

  const hasPermission = (permission) => {
    return (
      state.user &&
      state.user.permissions &&
      state.user.permissions.includes(permission)
    )
  }

  // SHOW LOADER
  if (!state.isInitialized) return <MatxLoading />

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'JWT',
        login,
        logout,
        register,
        states,
        stateCityMap,
        allCities,
        countries: COUNTRY_NAMES,
        countryStateMap,
        token,
        definitions,
        setDefinitions,
        fetchDefinition,
        hasRole,
        hasPermission,
        setLeadColumnVisibilityModel,
        leadColumnVisibilityModel
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
