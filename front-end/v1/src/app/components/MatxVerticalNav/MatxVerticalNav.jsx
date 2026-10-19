import { Fragment, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Box,
  ButtonBase,
  Icon,
  styled,
  useMediaQuery,
  useTheme
} from '@mui/material'

import useSettings from 'app/hooks/useSettings'
import { Paragraph, Span } from '../Typography'
import MatxVerticalNavExpansionPanel from './MatxVerticalNavExpansionPanel'
import useAuth from 'app/hooks/useAuth'
import LogoutIcon from '@mui/icons-material/Logout'

// STYLED COMPONENTS
const ListLabel = styled(Paragraph)(({ theme, mode }) => ({
  fontSize: '12px',
  marginTop: '20px',
  marginLeft: '15px',
  marginBottom: '10px',
  textTransform: 'uppercase',
  display: mode === 'compact' && 'none',
  color: theme.palette.text.secondary
}))

const ExtAndIntCommon = {
  display: 'flex',
  overflow: 'hidden',
  borderRadius: '4px',
  height: 44,
  whiteSpace: 'pre',
  marginBottom: '8px',
  textDecoration: 'none',
  justifyContent: 'space-between',
  transition: 'all 150ms ease-in',
  '&:hover': { background: 'rgba(255, 255, 255, 0.08)' },
  '&.compactNavItem': {
    overflow: 'hidden',
    justifyContent: 'center !important'
  },
  '& .icon': {
    fontSize: '18px',
    paddingLeft: '16px',
    paddingRight: '16px',
    verticalAlign: 'middle'
  }
}
const ExternalLink = styled('a')(({ theme }) => ({
  ...ExtAndIntCommon,
  color: theme.palette.text.primary
}))

const InternalLink = styled(Box)(({ theme }) => ({
  '& a': {
    ...ExtAndIntCommon,
    color: theme.palette.text.primary
  },
  '& .navItemActive': {
    backgroundColor: 'rgba(255, 255, 255, 0.16)'
  }
}))

const StyledText = styled(Span)(({ mode }) => ({
  fontSize: '0.875rem',
  paddingLeft: '0.8rem',
  display: mode === 'compact' && 'none'
}))

const BulletIcon = styled('div')(({ theme }) => ({
  padding: '2px',
  marginLeft: '24px',
  marginRight: '8px',
  overflow: 'hidden',
  borderRadius: '300px',
  background: theme.palette.text.primary
}))

const BadgeValue = styled('div')(() => ({
  padding: '1px 8px',
  overflow: 'hidden',
  borderRadius: '300px'
}))

export default function MatxVerticalNav({ items }) {
  const { settings, updateSettings } = useSettings()
  const { mode } = settings.layout1Settings.leftSidebar
  const { hasPermission } = useAuth()
  const { logout, user, token } = useAuth()

  const theme = useTheme()
  const isMdScreen = useMediaQuery(theme.breakpoints.down('md'))

  const filteredItems = useMemo(() => {
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
    return filterItems(items)
  }, [items, hasPermission])

  const updateSidebarMode = (sidebarSettings) => {
    let activeLayoutSettingsName = settings.activeLayout + 'Settings'
    let activeLayoutSettings = settings[activeLayoutSettingsName]

    if (isMdScreen) {
      updateSettings({
        ...settings,
        [activeLayoutSettingsName]: {
          ...activeLayoutSettings,
          leftSidebar: {
            ...activeLayoutSettings.leftSidebar,
            ...sidebarSettings
          }
        }
      })
    }
  }

  const renderLevels = (data) => {
    return data.map((item, index) => {
      if (item.type === 'label')
        return (
          <ListLabel key={index} mode={mode} className="sidenavHoverShow">
            {item.label}
          </ListLabel>
        )

      if (item.children) {
        return (
          <MatxVerticalNavExpansionPanel mode={mode} item={item} key={index}>
            {renderLevels(item.children)}
          </MatxVerticalNavExpansionPanel>
        )
      } else if (item.type === 'extLink') {
        return (
          <ExternalLink
            key={index}
            href={item.path}
            className={`${mode === 'compact' && 'compactNavItem'}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ButtonBase key={item.name} name="child" sx={{ width: '100%' }}>
              {(() => {
                if (item.icon) {
                  return <Icon className="icon">{item.icon}</Icon>
                } else {
                  return (
                    <span className="item-icon icon-text">{item.iconText}</span>
                  )
                }
              })()}
              <StyledText mode={mode} className="sidenavHoverShow">
                {item.name}
              </StyledText>
              <Box mx="auto"></Box>
              {item.badge && <BadgeValue>{item.badge.value}</BadgeValue>}
            </ButtonBase>
          </ExternalLink>
        )
      } else {
        return (
          <InternalLink key={index}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? `navItemActive ${mode === 'compact' && 'compactNavItem'}`
                  : `${mode === 'compact' && 'compactNavItem'}`
              }
            >
              <ButtonBase
                key={item.name}
                name="child"
                sx={{ width: '100%' }}
                onClick={() => {
                  updateSidebarMode({ mode: 'close' })
                }}
              >
                {item?.icon ? (
                  <Icon className="icon" sx={{ width: 36 }}>
                    {item.icon}
                  </Icon>
                ) : (
                  <Fragment>
                    <BulletIcon
                      className={`nav-bullet`}
                      sx={{ display: mode === 'compact' && 'none' }}
                    />
                    <Box
                      className="nav-bullet-text"
                      sx={{
                        ml: '20px',
                        fontSize: '11px',
                        display: mode !== 'compact' && 'none'
                      }}
                    >
                      {item.iconText}
                    </Box>
                  </Fragment>
                )}
                <StyledText mode={mode} className="sidenavHoverShow">
                  {item.name}
                </StyledText>

                <Box mx="auto" />

                {item.badge && (
                  <BadgeValue className="sidenavHoverShow">
                    {item.badge.value}
                  </BadgeValue>
                )}
              </ButtonBase>
            </NavLink>
          </InternalLink>
        )
      }
    })
  }

  return (
    <div
      className="navigation"
      style={{
        padding: 2,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Main navigation links */}
      <div
        style={{
          flexGrow: 1,
          overflowY: 'scroll', // Allows scrolling
          scrollbarWidth: 'none', // Hides scrollbar for Firefox
          msOverflowStyle: 'none', // Hides scrollbar for IE and Edge
          // For WebKit-based browsers (Chrome, Safari, etc.)
          overflow: '-moz-hidden-unscrollable'
        }}
      >
        {renderLevels(filteredItems)} {/* Renders all your dynamic links */}
      </div>

      {/* Sticky bottom section for version and logout */}
      <div
        style={{
          padding: '10px 15px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: mode === 'compact' ? 'center' : 'flex-start',
          position: 'sticky',
          bottom: 0
        }}
      >
        {/* Version Info */}
        <div
          style={{
            color: 'white',
            fontSize: mode === 'compact' ? '12px' : '18px',
            transition: 'font-size 0.3s ease',
            marginBottom: '10px',
            textAlign: mode === 'compact' ? 'center' : 'left'
          }}
        >
          v 1.1
        </div>

        {/* Logout section */}
        <NavLink
          to="/logout"
          style={{
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            justifyContent: mode === 'compact' ? 'center' : 'flex-start',
            width: '100%'
          }}
          onClick={(e) => {
            e.preventDefault()
            logout()
          }}
        >
          {/* Always show icon */}
          <LogoutIcon
            fontSize="small"
            sx={{
              color: 'white',
              marginRight: mode !== 'compact' ? '10px' : '0'
            }}
          />
          {/* Show text only if mode is not compact */}
          {mode !== 'compact' && 'Logout'}
        </NavLink>
      </div>
    </div>
  )
}
