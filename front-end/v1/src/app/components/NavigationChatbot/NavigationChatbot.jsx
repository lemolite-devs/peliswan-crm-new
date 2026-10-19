import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  Fade,
  Zoom,
  styled,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge
} from '@mui/material'
import {
  SmartToy,
  Send,
  Close,
  Search,
  NavigateNext,
  Dashboard,
  People,
  Assignment,
  TrendingUp,
  Group,
  LocalOffer,
  AdminPanelSettings,
  RingVolume,
  ShoppingCart,
  Description,
  List as ListIcon,
  Chat
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { navigations } from 'app/navigations'
import useAuth from 'app/hooks/useAuth'
import NavigationPreview from './NavigationPreview'

// STYLED COMPONENTS
const ChatbotContainer = styled(Box)(({ theme, position }) => ({
  position: 'fixed',
  bottom: position ? undefined : theme.spacing(3),
  right: position ? undefined : theme.spacing(3),
  left: position ? position.x : undefined,
  top: position ? position.y : undefined,
  zIndex: 9999,
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing'
  },
  '@media (max-height: 600px)': {
    bottom: position ? undefined : theme.spacing(1)
  },
  [theme.breakpoints.down('lg')]: {
    bottom: position ? undefined : theme.spacing(2.5),
    right: position ? undefined : theme.spacing(2.5)
  },
  [theme.breakpoints.down('md')]: {
    bottom: position ? undefined : theme.spacing(2),
    right: position ? undefined : theme.spacing(2)
  },
  [theme.breakpoints.down('sm')]: {
    bottom: position ? undefined : theme.spacing(1.5),
    right: position ? undefined : theme.spacing(2.5),
    left: position ? undefined : theme.spacing(1.5)
  },
  [theme.breakpoints.down('xs')]: {
    bottom: position ? undefined : theme.spacing(1),
    right: position ? undefined : theme.spacing(1),
    left: position ? undefined : theme.spacing(1)
  },
  [theme.breakpoints.down(360)]: {
    bottom: position ? undefined : theme.spacing(0.5),
    right: position ? undefined : theme.spacing(0.5),
    left: position ? undefined : theme.spacing(0.5)
  },
  [theme.breakpoints.down(320)]: {
    bottom: position ? undefined : theme.spacing(0.25),
    right: position ? undefined : theme.spacing(0.25),
    left: position ? undefined : theme.spacing(0.25)
  }
}))

const ChatbotButton = styled(IconButton)(({ theme, isOpen }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  boxShadow: theme.shadows[8],
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: isOpen
      ? theme.palette.primary.light
      : theme.palette.primary.dark,
    transform: 'scale(1.1)'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem'
  },
  '@media (max-width: 480px)': {
    minWidth: 44,
    minHeight: 44
  },
  [theme.breakpoints.down('xl')]: {
    width: 58,
    height: 58,
    '& .MuiSvgIcon-root': {
      fontSize: '1.45rem'
    }
  },
  [theme.breakpoints.down('lg')]: {
    width: 55,
    height: 55,
    '& .MuiSvgIcon-root': {
      fontSize: '1.4rem'
    }
  },
  [theme.breakpoints.down('md')]: {
    width: 52,
    height: 52,
    '& .MuiSvgIcon-root': {
      fontSize: '1.35rem'
    }
  },
  [theme.breakpoints.down('sm')]: {
    width: 48,
    height: 48,
    '& .MuiSvgIcon-root': {
      fontSize: '1.3rem'
    },
    '& .MuiBadge-badge': {
      fontSize: '0.6rem',
      height: 16,
      minWidth: 16
    }
  },
  [theme.breakpoints.down('xs')]: {
    width: 44,
    height: 44,
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem'
    },
    '& .MuiBadge-badge': {
      fontSize: '0.55rem',
      height: 14,
      minWidth: 14
    }
  },
  [theme.breakpoints.down(360)]: {
    width: 40,
    height: 40,
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem'
    },
    '& .MuiBadge-badge': {
      fontSize: '0.5rem',
      height: 12,
      minWidth: 12
    }
  },
  [theme.breakpoints.down(320)]: {
    width: 36,
    height: 36,
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem'
    },
    '& .MuiBadge-badge': {
      fontSize: '0.45rem',
      height: 10,
      minWidth: 10
    }
  }
}))

const ChatbotPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 80,
  right: 0,
  width: 420,
  maxHeight: 600,
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.shadows[12],
  borderRadius: 16,
  overflow: 'hidden',
  '@media (max-height: 700px)': {
    maxHeight: 'calc(100vh - 100px)',
    minHeight: 250
  },
  '@media (max-height: 500px)': {
    maxHeight: 'calc(100vh - 80px)',
    minHeight: 200
  },
  [theme.breakpoints.down('xl')]: {
    width: 400,
    maxHeight: 580,
    minHeight: 380,
    bottom: 76
  },
  [theme.breakpoints.down('lg')]: {
    width: 380,
    maxHeight: 560,
    minHeight: 360,
    bottom: 72
  },
  [theme.breakpoints.down('md')]: {
    width: 360,
    maxHeight: 540,
    minHeight: 340,
    bottom: 68
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    bottom: 64,
    maxHeight: 'calc(100vh - 120px)',
    minHeight: 300,
    borderRadius: 12
  },
  [theme.breakpoints.down('xs')]: {
    width: '100%',
    bottom: 56,
    maxHeight: 'calc(100vh - 100px)',
    minHeight: 280,
    borderRadius: 10
  },
  [theme.breakpoints.down(360)]: {
    width: '100%',
    bottom: 48,
    maxHeight: 'calc(100vh - 80px)',
    minHeight: 260,
    borderRadius: 8
  },
  [theme.breakpoints.down(320)]: {
    width: '100%',
    bottom: 40,
    maxHeight: 'calc(100vh - 60px)',
    minHeight: 240,
    borderRadius: 6
  }
}))

const ChatHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minHeight: 64,
  flexShrink: 0,
  [theme.breakpoints.down('xl')]: {
    padding: theme.spacing(1.75, 2),
    minHeight: 60
  },
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.5, 2),
    minHeight: 56
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.25, 2),
    minHeight: 52
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    minHeight: 48,
    '& .MuiTypography-h6': {
      fontSize: '0.95rem'
    },
    '& .MuiTypography-caption': {
      fontSize: '0.65rem'
    }
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    minHeight: 44,
    '& .MuiTypography-h6': {
      fontSize: '0.85rem'
    },
    '& .MuiTypography-caption': {
      fontSize: '0.6rem'
    }
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.75),
    minHeight: 40,
    '& .MuiTypography-h6': {
      fontSize: '0.75rem'
    },
    '& .MuiTypography-caption': {
      fontSize: '0.55rem'
    }
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.5),
    minHeight: 36,
    '& .MuiTypography-h6': {
      fontSize: '0.7rem'
    },
    '& .MuiTypography-caption': {
      fontSize: '0.5rem'
    }
  }
}))

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  WebkitOverflowScrolling: 'touch',
  [theme.breakpoints.down('xl')]: {
    padding: theme.spacing(1.75, 2)
  },
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.5, 2)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.25, 2)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    maxHeight: 300
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    maxHeight: 280
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.75),
    maxHeight: 260
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.5),
    maxHeight: 240
  }
}))

const MessageBubble = styled(Box)(({ theme, isBot }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
  justifyContent: isBot ? 'flex-start' : 'flex-end',
  [theme.breakpoints.down('lg')]: {
    marginBottom: theme.spacing(0.875)
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(0.75)
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(0.5)
  },
  [theme.breakpoints.down('xs')]: {
    marginBottom: theme.spacing(0.25)
  },
  [theme.breakpoints.down(360)]: {
    marginBottom: theme.spacing(0.125)
  }
}))

const MessageContent = styled(Box)(({ theme, isBot }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1.5),
  borderRadius: 16,
  backgroundColor: isBot ? theme.palette.grey[100] : theme.palette.primary.main,
  color: isBot ? theme.palette.text.primary : 'white',
  boxShadow: theme.shadows[1],
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  [theme.breakpoints.down('lg')]: {
    maxWidth: '82%',
    padding: theme.spacing(1.375, 1.5)
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '84%',
    padding: theme.spacing(1.25, 1.5)
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '85%',
    padding: theme.spacing(1),
    borderRadius: 12,
    '& .MuiTypography-body2': {
      fontSize: '0.75rem'
    }
  },
  [theme.breakpoints.down('xs')]: {
    maxWidth: '90%',
    padding: theme.spacing(0.75),
    borderRadius: 10,
    '& .MuiTypography-body2': {
      fontSize: '0.7rem'
    }
  },
  [theme.breakpoints.down(360)]: {
    maxWidth: '95%',
    padding: theme.spacing(0.5),
    borderRadius: 8,
    '& .MuiTypography-body2': {
      fontSize: '0.65rem'
    }
  },
  [theme.breakpoints.down(320)]: {
    maxWidth: '98%',
    padding: theme.spacing(0.375),
    borderRadius: 6,
    '& .MuiTypography-body2': {
      fontSize: '0.6rem'
    }
  }
}))

const NavigationSuggestions = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  minHeight: 80,
  flexShrink: 0,
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.75, 2),
    minHeight: 76
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5, 2),
    minHeight: 72
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    minHeight: 68,
    '& .MuiTypography-subtitle2': {
      fontSize: '0.75rem'
    }
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    minHeight: 64,
    '& .MuiTypography-subtitle2': {
      fontSize: '0.7rem'
    }
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.75),
    minHeight: 60,
    '& .MuiTypography-subtitle2': {
      fontSize: '0.65rem'
    }
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.5),
    minHeight: 56,
    '& .MuiTypography-subtitle2': {
      fontSize: '0.6rem'
    }
  }
}))

const SuggestionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  },
  '@media (max-width: 480px)': {
    minHeight: 32
  },
  [theme.breakpoints.down('lg')]: {
    margin: theme.spacing(0.375, 0.5)
  },
  [theme.breakpoints.down('md')]: {
    margin: theme.spacing(0.25, 0.5)
  },
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0.25),
    fontSize: '0.65rem',
    height: 26
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '0.6rem',
    height: 24
  },
  [theme.breakpoints.down(360)]: {
    fontSize: '0.55rem',
    height: 22
  },
  [theme.breakpoints.down(320)]: {
    fontSize: '0.5rem',
    height: 20
  }
}))

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  minHeight: 80,
  flexShrink: 0,
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.75, 2),
    minHeight: 76
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5, 2),
    minHeight: 72
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    minHeight: 68
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    minHeight: 64
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.75),
    minHeight: 60
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.5),
    minHeight: 56
  }
}))

const TabPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0
}))

const ChatTabContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  [theme.breakpoints.down('sm')]: {
    maxHeight: 300
  },
  [theme.breakpoints.down('xs')]: {
    maxHeight: 280
  },
  [theme.breakpoints.down(360)]: {
    maxHeight: 260
  },
  [theme.breakpoints.down(320)]: {
    maxHeight: 240
  }
}))

const PagesTabContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  [theme.breakpoints.down('sm')]: {
    maxHeight: 300
  },
  [theme.breakpoints.down('xs')]: {
    maxHeight: 280
  },
  [theme.breakpoints.down(360)]: {
    maxHeight: 260
  },
  [theme.breakpoints.down(320)]: {
    maxHeight: 240
  }
}))

const TabContainer = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 48,
  flexShrink: 0,
  [theme.breakpoints.down('lg')]: {
    minHeight: 44
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 40
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 36
  },
  [theme.breakpoints.down('xs')]: {
    minHeight: 32
  },
  [theme.breakpoints.down(360)]: {
    minHeight: 28
  },
  [theme.breakpoints.down(320)]: {
    minHeight: 24
  }
}))

// Icon mapping for navigation items
const iconMap = {
  dashboard: <Dashboard />,
  people: <People />,
  ring_volume: <RingVolume />,
  border_color: <Assignment />,
  trending_up: <TrendingUp />,
  group_add: <Group />,
  local_offer: <LocalOffer />,
  admin_panel_settings: <AdminPanelSettings />,
  shopping_cart: <ShoppingCart />,
  description: <Description />
}

// Sample responses for the chatbot
const botResponses = {
  greeting: [
    "Hello! I'm your navigation assistant. How can I help you today?",
    'Hi there! I can help you navigate through the application. What would you like to do?',
    "Welcome! I'm here to help you find what you're looking for. What page would you like to visit?"
  ],
  help: [
    "I can help you navigate to any page in the application. Just tell me what you're looking for!",
    'You can ask me to take you to Dashboard, Leads, Customers, Tasks, Sales, or any other section.',
    "Try saying things like 'Go to Dashboard', 'Show me Leads', or 'Take me to Customers'."
  ],
  notFound: [
    "I couldn't find a page matching that. Try asking for Dashboard, Leads, Customers, Tasks, Sales, or Staff Management.",
    "I'm not sure about that page. Would you like to see the available pages?",
    'Let me show you the available navigation options.'
  ]
}

const NavigationChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [position, setPosition] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const theme = useTheme()
  const isXLarge = useMediaQuery(theme.breakpoints.up('xl'))
  const isLarge = useMediaQuery(theme.breakpoints.between('lg', 'xl'))
  const isMedium = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isSmall = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'))
  const isTinyMobile = useMediaQuery('(max-width:360px)')
  const isMicroMobile = useMediaQuery('(max-width:320px)')
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = useAuth()

  // Handle mouse down event for dragging
  const handleMouseDown = (e) => {
    if (
      e.target.closest('.MuiPaper-root') ||
      e.target.closest('.MuiTabs-root')
    ) {
      return // Don't start dragging if clicking on the panel or tabs
    }

    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // Handle mouse move event for dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Constrain to viewport bounds
    const maxX = window.innerWidth - 60 // 60 is the button width
    const maxY = window.innerHeight - 60 // 60 is the button height

    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))

    setPosition({ x: constrainedX, y: constrainedY })
  }

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Prevent text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging])

  // Filter navigation items based on user permissions
  const getFilteredNavigations = () => {
    const filterItems = (items) => {
      return items.filter((item) => {
        if (
          item.permissions &&
          !item.permissions.every((perm) => hasPermission(perm))
        ) {
          return false
        }
        if (item.children) {
          item.children = filterItems(item.children)
          return item.children.length > 0
        }
        return true
      })
    }
    return filterItems(navigations)
  }

  // Flatten navigation structure for easier searching
  const getFlattenedNavigations = () => {
    const flattened = []
    const flatten = (items, parentName = '') => {
      items.forEach((item) => {
        if (item.children) {
          flatten(item.children, item.name)
        } else if (item.path) {
          flattened.push({
            ...item,
            parentName,
            fullName: parentName ? `${parentName} > ${item.name}` : item.name
          })
        }
      })
    }
    flatten(getFilteredNavigations())
    return flattened
  }

  // Search through navigation items
  const searchNavigation = (query) => {
    const searchTerm = query.toLowerCase()
    const allItems = getFlattenedNavigations()

    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.fullName.toLowerCase().includes(searchTerm) ||
        (item.parentName && item.parentName.toLowerCase().includes(searchTerm))
    )
  }

  // Add message to chat
  const addMessage = (text, isBot = false) => {
    const newMessage = {
      id: Date.now(),
      text,
      isBot,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, newMessage])
  }

  // Handle user input
  const handleUserInput = (input) => {
    if (!input.trim()) return

    addMessage(input, false)
    setInputValue('')

    // Process the input and generate response
    setTimeout(() => {
      const response = processUserInput(input)
      addMessage(response, true)

      // Update suggestions based on context
      updateSuggestions(input)
    }, 500)
  }

  // Process user input and generate appropriate response
  const processUserInput = (input) => {
    const lowerInput = input.toLowerCase()

    // Greeting patterns
    if (
      lowerInput.includes('hello') ||
      lowerInput.includes('hi') ||
      lowerInput.includes('hey')
    ) {
      return botResponses.greeting[
        Math.floor(Math.random() * botResponses.greeting.length)
      ]
    }

    // Help patterns
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return botResponses.help[
        Math.floor(Math.random() * botResponses.help.length)
      ]
    }

    // Navigation patterns
    const searchResults = searchNavigation(input)

    if (searchResults.length === 1) {
      const item = searchResults[0]
      navigate(item.path)
      return `Taking you to ${item.fullName || item.name}...`
    } else if (searchResults.length > 1) {
      const suggestions = searchResults
        .slice(0, 5)
        .map((item) => item.fullName || item.name)
      return `I found multiple matches. Did you mean:\n${suggestions.map((s) => `• ${s}`).join('\n')}`
    } else {
      return botResponses.notFound[
        Math.floor(Math.random() * botResponses.notFound.length)
      ]
    }
  }

  // Update suggestions based on user input
  const updateSuggestions = (input) => {
    const searchResults = searchNavigation(input)
    const suggestions = searchResults.slice(0, 6).map((item) => ({
      label: item.fullName || item.name,
      path: item.path,
      icon: item.icon
    }))
    setSuggestions(suggestions)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    navigate(suggestion.path)
    addMessage(`Navigating to ${suggestion.label}...`, true)
    setSuggestions([])
  }

  // Handle search input
  const handleSearchInput = (value) => {
    setInputValue(value)
    if (value.trim()) {
      const results = searchNavigation(value)
      setSearchResults(results.slice(0, 8))
    } else {
      setSearchResults([])
    }
  }

  // Handle navigation from preview
  const handlePreviewNavigation = (path, name) => {
    navigate(path)
    addMessage(`Navigating to ${name}...`, true)
  }

  // Initialize chatbot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage(botResponses.greeting[0], true)
      setSuggestions(
        getFlattenedNavigations()
          .slice(0, 6)
          .map((item) => ({
            label: item.fullName || item.name,
            path: item.path,
            icon: item.icon
          }))
      )
    }
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setMessages([])
      setSuggestions([])
      setSearchResults([])
      setActiveTab(0)
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Get responsive values for all screen sizes
  const getResponsiveValue = (xl, lg, md, sm, xs, tiny, micro) => {
    if (isMicroMobile) return micro
    if (isTinyMobile) return tiny
    if (isSmallMobile) return xs
    if (isMobile) return sm
    if (isSmall) return md
    if (isLarge) return lg
    if (isXLarge) return xl
    return lg // default
  }

  return (
    <ChatbotContainer
      ref={containerRef}
      position={position}
      onMouseDown={handleMouseDown}
      sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <ChatbotButton
        onClick={toggleChatbot}
        isOpen={isOpen}
        size="large"
        sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <Badge
          badgeContent={getFilteredNavigations().length}
          color="secondary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: getResponsiveValue(
                '0.75rem',
                '0.7rem',
                '0.65rem',
                '0.6rem',
                '0.55rem',
                '0.5rem',
                '0.45rem'
              ),
              height: getResponsiveValue(20, 18, 16, 16, 14, 12, 10),
              minWidth: getResponsiveValue(20, 18, 16, 16, 14, 12, 10)
            }
          }}
        >
          <SmartToy />
        </Badge>
      </ChatbotButton>

      <Fade in={isOpen} timeout={300}>
        <ChatbotPanel>
          <ChatHeader>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                width: getResponsiveValue(40, 38, 36, 32, 28, 24, 20),
                height: getResponsiveValue(40, 38, 36, 32, 28, 24, 20)
              }}
            >
              <SmartToy />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6">Navigation Assistant</Typography>
              <Typography variant="caption">
                Your smart assistant for navigating easily
              </Typography>
            </Box>
            <IconButton
              onClick={toggleChatbot}
              sx={{ color: 'white' }}
              size="small"
            >
              <Close />
            </IconButton>
          </ChatHeader>

          <TabContainer>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                minHeight: getResponsiveValue(48, 44, 40, 36, 32, 28, 24),
                '& .MuiTab-root': {
                  fontSize: getResponsiveValue(
                    '0.75rem',
                    '0.7rem',
                    '0.65rem',
                    '0.7rem',
                    '0.65rem',
                    '0.6rem',
                    '0.55rem'
                  ),
                  minHeight: getResponsiveValue(48, 44, 40, 36, 32, 28, 24),
                  padding: getResponsiveValue(
                    '6px 12px',
                    '6px 10px',
                    '5px 8px',
                    '6px 8px',
                    '4px 6px',
                    '3px 4px',
                    '2px 3px'
                  )
                }
              }}
            >
              <Tab
                icon={<Chat />}
                label="Chat"
                sx={{
                  fontSize: getResponsiveValue(
                    '0.75rem',
                    '0.7rem',
                    '0.65rem',
                    '0.7rem',
                    '0.65rem',
                    '0.6rem',
                    '0.55rem'
                  ),
                  minHeight: getResponsiveValue(48, 44, 40, 36, 32, 28, 24)
                }}
              />
              <Tab
                icon={<ListIcon />}
                label="Pages"
                sx={{
                  fontSize: getResponsiveValue(
                    '0.75rem',
                    '0.7rem',
                    '0.65rem',
                    '0.7rem',
                    '0.65rem',
                    '0.6rem',
                    '0.55rem'
                  ),
                  minHeight: getResponsiveValue(48, 44, 40, 36, 32, 28, 24)
                }}
              />
            </Tabs>
          </TabContainer>

          <TabPanel>
            {activeTab === 0 && (
              <ChatTabContent>
                <ChatMessages>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} isBot={message.isBot}>
                      <MessageContent isBot={message.isBot}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {message.text}
                        </Typography>
                      </MessageContent>
                    </MessageBubble>
                  ))}
                  <div ref={messagesEndRef} />
                </ChatMessages>

                {suggestions.length > 0 && (
                  <NavigationSuggestions>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Navigation:
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: getResponsiveValue(
                          1,
                          0.875,
                          0.75,
                          0.75,
                          0.5,
                          0.25,
                          0.125
                        )
                      }}
                    >
                      {suggestions.map((suggestion, index) => (
                        <SuggestionChip
                          key={index}
                          label={suggestion.label}
                          icon={iconMap[suggestion.icon] || <NavigateNext />}
                          onClick={() => handleSuggestionClick(suggestion)}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{
                            p: getResponsiveValue(
                              1,
                              0.875,
                              0.75,
                              0.75,
                              0.5,
                              0.25,
                              0.125
                            )
                          }}
                        />
                      ))}
                    </Box>
                  </NavigationSuggestions>
                )}

                <InputContainer>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      ref={inputRef}
                      fullWidth
                      size="small"
                      placeholder="Ask me to navigate somewhere..."
                      value={inputValue}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUserInput(inputValue)
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: getResponsiveValue(
                            '0.875rem',
                            '0.85rem',
                            '0.8rem',
                            '0.8rem',
                            '0.75rem',
                            '0.7rem',
                            '0.65rem'
                          )
                        }
                      }}
                    />
                    <IconButton
                      onClick={() => handleUserInput(inputValue)}
                      disabled={!inputValue.trim()}
                      color="primary"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: getResponsiveValue(40, 38, 36, 36, 32, 28, 24),
                        height: getResponsiveValue(40, 38, 36, 36, 32, 28, 24)
                      }}
                    >
                      <Send
                        sx={{
                          fontSize: getResponsiveValue(
                            '1.25rem',
                            '1.2rem',
                            '1.1rem',
                            '1rem',
                            '0.9rem',
                            '0.8rem',
                            '0.7rem'
                          )
                        }}
                      />
                    </IconButton>
                  </Box>
                </InputContainer>
              </ChatTabContent>
            )}

            {activeTab === 1 && (
              <PagesTabContent>
                <NavigationPreview
                  onNavigate={handlePreviewNavigation}
                  currentPath={location.pathname}
                />
              </PagesTabContent>
            )}
          </TabPanel>
        </ChatbotPanel>
      </Fade>
    </ChatbotContainer>
  )
}

export default NavigationChatbot
