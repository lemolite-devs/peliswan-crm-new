import { NavLink } from 'react-router-dom'
import {
  Box,
  Breadcrumbs,
  Hidden,
  Icon,
  styled,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material'

// STYLED COMPONENTS
const BreadcrumbRoot = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center'
})

const BreadcrumbName = styled(Typography)(({ theme }) => ({
  marginBottom: '4px',
  verticalAlign: 'middle',
  textTransform: 'capitalize'
}))

const SubName = styled(Typography)(({ theme }) => ({
  textTransform: 'capitalize',
  color: theme.palette.text.secondary
}))

const Separator = styled(Icon)(({ theme }) => ({
  margin: '0 8px',
  color: theme.palette.text.hint
}))

const StyledIcon = styled(Icon)({
  marginRight: '8px',
  marginBottom: '4px',
  verticalAlign: 'middle'
})

export default function Breadcrumb({ routeSegments }) {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'))

  const getFontSize = () => {
    if (isSmallScreen) return '0.875rem'
    if (isMediumScreen) return '1rem'
    if (isLargeScreen) return '1.125rem'
    return '1rem' // Default size
  }

  return (
    <BreadcrumbRoot>
      {routeSegments ? (
        <Hidden xsDown>
          <BreadcrumbName variant="h6" sx={{ fontSize: getFontSize }}>
            {routeSegments[routeSegments.length - 1]['name']}
          </BreadcrumbName>
          <Separator>|</Separator>
        </Hidden>
      ) : null}

      <Breadcrumbs
        separator={
          <Icon sx={{ color: theme.palette.text.hint }}>navigate_next</Icon>
        }
        sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}
      >
        <NavLink to="/">
          <StyledIcon color="primary">home</StyledIcon>
        </NavLink>

        {routeSegments
          ? routeSegments.map((route, index) => {
              return index !== routeSegments.length - 1 ? (
                <NavLink key={index} to={route.path}>
                  <SubName sx={{ fontSize: getFontSize }}>{route.name}</SubName>
                </NavLink>
              ) : (
                <SubName key={index} sx={{ fontSize: getFontSize }}>
                  {route.name}
                </SubName>
              )
            })
          : null}
      </Breadcrumbs>
    </BreadcrumbRoot>
  )
}
