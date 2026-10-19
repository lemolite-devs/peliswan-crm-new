import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  styled,
  Avatar,
  Hidden,
  useTheme,
  MenuItem,
  IconButton,
  useMediaQuery
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'

import useAuth from 'app/hooks/useAuth'
import useSettings from 'app/hooks/useSettings'

import { Span } from 'app/components/Typography'
import { MatxMenu } from 'app/components'
import { NotificationBar } from 'app/components/NotificationBar'
import { themeShadows } from 'app/components/MatxTheme/themeColors'

import { topBarHeight } from 'app/utils/constant'

import { Home, Menu, PowerSettingsNew } from '@mui/icons-material'

// STYLED COMPONENTS
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.primary
}))

const TopbarRoot = styled('div')({
  top: 0,
  zIndex: 96,
  height: topBarHeight,
  boxShadow: themeShadows[8],
  transition: 'all 0.3s ease'
})

const TopbarContainer = styled(Box)(({ theme }) => ({
  padding: '8px',
  paddingLeft: 18,
  paddingRight: 20,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: theme.palette.primary.main,
  [theme.breakpoints.down('sm')]: { paddingLeft: 16, paddingRight: 16 },
  [theme.breakpoints.down('xs')]: { paddingLeft: 14, paddingRight: 16 }
}))

const UserMenu = styled(Box)({
  padding: 4,
  display: 'flex',
  borderRadius: 24,
  cursor: 'pointer',
  alignItems: 'center',
  '& span': { margin: '0 8px' },
  '&:hover': {
    // Override the hover effect here
    backgroundColor: 'transparent !important',
    boxShadow: 'none !important'
  }
})

const StyledItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: 185,
  '& a': {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none'
  },
  '& span': { marginRight: '10px', color: theme.palette.text.primary }
}))

const Layout1Topbar = () => {
  const theme = useTheme()
  const { settings, updateSettings } = useSettings()
  const { logout, user } = useAuth()

  const isMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const updateSidebarMode = (sidebarSettings) => {
    updateSettings({
      layout1Settings: { leftSidebar: { ...sidebarSettings } }
    })
  }

  const handleSidebarToggle = () => {
    let { layout1Settings } = settings
    let mode
    if (isMdScreen) {
      mode = layout1Settings.leftSidebar.mode === 'close' ? 'mobile' : 'close'
    } else {
      mode = layout1Settings.leftSidebar.mode === 'full' ? 'close' : 'full'
    }
    updateSidebarMode({ mode })
  }

  return (
    <TopbarRoot>
      <TopbarContainer>
        <Box display="flex">
          <StyledIconButton onClick={handleSidebarToggle}>
            <Menu />
          </StyledIconButton>

          {/* <IconBox>
            <StyledIconButton>
              <MailOutline />
            </StyledIconButton>

            <StyledIconButton>
              <WebAsset />
            </StyledIconButton>

            <StyledIconButton>
              <StarOutline />
            </StyledIconButton>
          </IconBox> */}
        </Box>
        <Box>
          <img
            src="logo.svg"
            alt="Peliswan Sales CRM"
            style={{
              height: isMobile ? '20px' : '40px',
              objectFit: 'contain',
              marginTop: '5px'
            }}
          />
        </Box>
        <Box display="flex" alignItems="center">
          {/* <MatxSearchBox /> */}

          <NotificationBar />

          <MatxMenu
            menuButton={
              <UserMenu
                sx={{
                  marginLeft: '10px',
                  paddingLeft: '15px',
                  fontSize: '0.9rem',
                  textAlign: 'end'
                }}
              >
                <Hidden xsDown>
                  <Span>
                    <strong>{user?.name}</strong> <br />
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.role}
                    </div>
                  </Span>
                </Hidden>
                <Avatar
                  sx={{
                    cursor: 'pointer',
                    width: 35,
                    height: 35,
                    bgcolor: '#232944',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#232944 !important'
                    }
                  }}
                >
                  <PersonIcon sx={{ fontSize: 20 }} />{' '}
                  {/* Icon inside the Avatar */}
                </Avatar>
              </UserMenu>
            }
          >
            <StyledItem>
              <Link to="/">
                <Home />
                <Span>Home</Span>
              </Link>
            </StyledItem>

            {/* <StyledItem>
              <Link to="/page-layouts/user-profile">
                <Person />
                <Span>Profile</Span>
              </Link>
            </StyledItem>

            <StyledItem>
              <Settings />
              <Span>Settings</Span>
            </StyledItem> */}

            <StyledItem onClick={logout}>
              <PowerSettingsNew />
              <Span>Logout</Span>
            </StyledItem>
          </MatxMenu>
        </Box>
      </TopbarContainer>
    </TopbarRoot>
  )
}

export default memo(Layout1Topbar)
