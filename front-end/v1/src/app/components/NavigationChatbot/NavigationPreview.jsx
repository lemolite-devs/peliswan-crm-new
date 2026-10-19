import React from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Chip,
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
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
  NavigateNext
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { navigations } from 'app/navigations'
import useAuth from 'app/hooks/useAuth'

// STYLED COMPONENTS
const PreviewContainer = styled(Box)(({ theme }) => ({
  height: '350px',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  [theme.breakpoints.down('lg')]: {
    minHeight: 0
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 0
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 0
  },
  [theme.breakpoints.down('xs')]: {
    minHeight: 0
  },
  [theme.breakpoints.down(360)]: {
    minHeight: 0
  },
  [theme.breakpoints.down(320)]: {
    minHeight: 0
  }
}))

const SectionHeader = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 600,
  color: theme.palette.primary.main,
  minHeight: 48,
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  [theme.breakpoints.down('xl')]: {
    padding: theme.spacing(1.375, 2),
    fontSize: '0.85rem',
    minHeight: 44
  },
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.25, 2),
    fontSize: '0.8rem',
    minHeight: 40
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.125, 2),
    fontSize: '0.75rem',
    minHeight: 36
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5),
    fontSize: '0.8rem',
    minHeight: 36
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(0.75, 1),
    fontSize: '0.75rem',
    minHeight: 32
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.5, 0.75),
    fontSize: '0.7rem',
    minHeight: 28
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.375, 0.5),
    fontSize: '0.65rem',
    minHeight: 24
  }
}))

const NavigationList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  minHeight: 0,
  WebkitOverflowScrolling: 'touch',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(0.75)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0.5)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5)
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(0.25)
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.125)
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.125)
  }
}))

const NavigationItem = styled(ListItemButton)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  minHeight: 44,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '&.active': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText
    }
  },
  [theme.breakpoints.down('xl')]: {
    padding: theme.spacing(0.875, 2),
    minHeight: 40
  },
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(0.75, 2),
    minHeight: 38
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0.625, 2),
    minHeight: 36
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75, 1.5),
    minHeight: 38
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(0.5, 1),
    minHeight: 34
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.25, 0.75),
    minHeight: 30
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.125, 0.5),
    minHeight: 28
  }
}))

const PermissionChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  height: 20,
  fontSize: '0.7rem',
  [theme.breakpoints.down('lg')]: {
    height: 18,
    fontSize: '0.65rem'
  },
  [theme.breakpoints.down('md')]: {
    height: 16,
    fontSize: '0.6rem'
  },
  [theme.breakpoints.down('sm')]: {
    height: 16,
    fontSize: '0.6rem',
    marginLeft: theme.spacing(0.5)
  },
  [theme.breakpoints.down('xs')]: {
    height: 14,
    fontSize: '0.55rem'
  },
  [theme.breakpoints.down(360)]: {
    height: 12,
    fontSize: '0.5rem',
    marginLeft: theme.spacing(0.25)
  },
  [theme.breakpoints.down(320)]: {
    height: 10,
    fontSize: '0.45rem',
    marginLeft: theme.spacing(0.125)
  }
}))

const EmptyState = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  textAlign: 'center',
  minHeight: 200,
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(1.75),
    minHeight: 180
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5),
    minHeight: 160
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    minHeight: 140
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    minHeight: 120
  },
  [theme.breakpoints.down(360)]: {
    padding: theme.spacing(0.75),
    minHeight: 100
  },
  [theme.breakpoints.down(320)]: {
    padding: theme.spacing(0.5),
    minHeight: 80
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

const NavigationPreview = ({ onNavigate, currentPath }) => {
  const [expandedSections, setExpandedSections] = React.useState({})
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
  const { hasPermission } = useAuth()

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

  const handleSectionToggle = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const handleNavigationClick = (path, name) => {
    navigate(path)
    if (onNavigate) {
      onNavigate(path, name)
    }
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

  const renderNavigationItem = (item, level = 0) => {
    const isActive = currentPath === item.path
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections[item.name] || false

    if (hasChildren) {
      return (
        <React.Fragment key={item.name}>
          <ListItem disablePadding>
            <NavigationItem
              onClick={() => handleSectionToggle(item.name)}
              sx={{
                pl: getResponsiveValue(
                  2 + level * 2,
                  1.875 + level * 1.875,
                  1.75 + level * 1.75,
                  1.5 + level * 1.5,
                  1 + level * 1,
                  0.75 + level * 0.75,
                  0.5 + level * 0.5
                ),
                pr: getResponsiveValue(2, 2, 2, 1, 0.75, 0.5, 0.25)
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: getResponsiveValue(36, 34, 32, 28, 24, 20, 16),
                  '& .MuiSvgIcon-root': {
                    fontSize: getResponsiveValue(
                      '1.25rem',
                      '1.2rem',
                      '1.1rem',
                      '1rem',
                      '0.9rem',
                      '0.8rem',
                      '0.7rem'
                    )
                  }
                }}
              >
                {iconMap[item.icon] || <NavigateNext />}
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontSize: getResponsiveValue(
                    '0.9rem',
                    '0.85rem',
                    '0.8rem',
                    '0.8rem',
                    '0.75rem',
                    '0.7rem',
                    '0.65rem'
                  ),
                  fontWeight: 500
                }}
              />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </NavigationItem>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) =>
                renderNavigationItem(child, level + 1)
              )}
            </List>
          </Collapse>
        </React.Fragment>
      )
    }

    return (
      <ListItem disablePadding key={item.name}>
        <NavigationItem
          onClick={() => handleNavigationClick(item.path, item.name)}
          className={isActive ? 'active' : ''}
          sx={{
            pl: getResponsiveValue(
              2 + level * 2,
              1.875 + level * 1.875,
              1.75 + level * 1.75,
              1.5 + level * 1.5,
              1 + level * 1,
              0.75 + level * 0.75,
              0.5 + level * 0.5
            ),
            pr: getResponsiveValue(2, 2, 2, 1, 0.75, 0.5, 0.25)
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: getResponsiveValue(36, 34, 32, 28, 24, 20, 16),
              '& .MuiSvgIcon-root': {
                fontSize: getResponsiveValue(
                  '1.25rem',
                  '1.2rem',
                  '1.1rem',
                  '1rem',
                  '0.9rem',
                  '0.8rem',
                  '0.7rem'
                )
              }
            }}
          >
            {item.icon ? (
              iconMap[item.icon] || <NavigateNext />
            ) : (
              <Box
                sx={{
                  width: getResponsiveValue(8, 7, 6, 5, 4, 3, 2),
                  height: getResponsiveValue(8, 7, 6, 5, 4, 3, 2),
                  borderRadius: '50%',
                  backgroundColor: theme.palette.text.primary
                }}
              />
            )}
          </ListItemIcon>
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{
              fontSize: getResponsiveValue(
                '0.9rem',
                '0.85rem',
                '0.8rem',
                '0.8rem',
                '0.75rem',
                '0.7rem',
                '0.65rem'
              )
            }}
          />
        </NavigationItem>
      </ListItem>
    )
  }

  const filteredNavigations = getFilteredNavigations()

  return (
    <PreviewContainer>
      <SectionHeader variant="subtitle2">
        Available Pages ({filteredNavigations.length})
      </SectionHeader>

      {filteredNavigations.length > 0 ? (
        <NavigationList dense>
          {filteredNavigations.map((item) => renderNavigationItem(item))}
        </NavigationList>
      ) : (
        <EmptyState>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: getResponsiveValue(
                '0.875rem',
                '0.8rem',
                '0.75rem',
                '0.75rem',
                '0.7rem',
                '0.65rem',
                '0.6rem'
              )
            }}
          >
            No pages available with your current permissions.
          </Typography>
        </EmptyState>
      )}
    </PreviewContainer>
  )
}

export default NavigationPreview
