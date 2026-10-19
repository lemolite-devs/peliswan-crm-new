import { lazy } from 'react'
import { Navigate } from 'react-router-dom'

import AuthGuard from './auth/AuthGuard'
import Loadable from './components/Loadable'
import MatxLayout from './components/MatxLayout/MatxLayout'
import materialRoutes from 'app/views/material-kit/MaterialRoutes'
import PermissionGuard from './auth/PermissionGuard'
import CustomersList from './views/sales/CustomersList'

const NotFound = Loadable(lazy(() => import('app/views/sessions/NotFound')))
const JwtLogin = Loadable(lazy(() => import('app/views/sessions/JwtLogin')))
const JwtRegister = Loadable(
  lazy(() => import('app/views/sessions/JwtRegister'))
)
const ForgotPassword = Loadable(
  lazy(() => import('app/views/sessions/ForgotPassword'))
)
const Unauthorized = Loadable(
  lazy(() => import('app/views/sessions/Unauthorized'))
)

// DASHBOARD PAGE
const Analytics = Loadable(lazy(() => import('app/views/dashboard/Analytics')))
const Analytics_main = Loadable(
  lazy(() => import('app/views/dashboard/AppDashboard'))
)

// OTHER PAGES

const LeadList = Loadable(lazy(() => import('app/views/leads/LeadList')))
const ItemList = Loadable(lazy(() => import('app/views/sales/ItemList')))
const ProposalList = Loadable(
  lazy(() => import('app/views/sales/ProposalList'))
)
const Transportation = Loadable(lazy(() => import('app/views/transportation')))
const TaskList = Loadable(lazy(() => import('app/views/tasks/TaskList')))
const UserList = Loadable(lazy(() => import('app/views/users/UserList')))
const DefinitionTypes = Loadable(
  lazy(() => import('app/views/definition/DefinitionTypes'))
)
const RolesAndPermissions = Loadable(
  lazy(() => import('./views/RolesAndPermissions'))
)
const IndividualPerfomance = Loadable(
  lazy(() => import('app/views/IndividualPerformance'))
)

// CHAT PAGES
const ChatLayout = Loadable(lazy(() => import('app/views/chat/ChatLayout')))
const ChatWindow = Loadable(lazy(() => import('app/views/chat/ChatWindow')))

const routes = [
  {
    element: (
      <AuthGuard>
        <MatxLayout />
      </AuthGuard>
    ),
    children: [
      ...materialRoutes,
      {
        path: '/dashboard',
        element: (
          <PermissionGuard
            permissions={['Dashboard:view']}
            redirectTo="/unauthorized"
          >
            <Analytics />
          </PermissionGuard>
        )
      },
      // {
      //   path: '/dashboard1',
      //   element: (
      //     <PermissionGuard
      //       permissions={['Dashboard:view']}
      //       redirectTo="/unauthorized"
      //     >
      //       <Analytics_main />
      //     </PermissionGuard>
      //   )
      // },
      {
        path: '/customers',
        element: (
          <PermissionGuard
            permissions={['Customers:view']}
            redirectTo="/unauthorized"
          >
            <CustomersList />
          </PermissionGuard>
        )
      },
      {
        path: '/sales/proposals',
        element: (
          <PermissionGuard
            permissions={['Sales.Proposals:view']}
            redirectTo="/unauthorized"
          >
            <ProposalList />
          </PermissionGuard>
        )
      },
      {
        path: '/sales/items',
        element: (
          <PermissionGuard
            permissions={['Sales.Items:view']}
            redirectTo="/unauthorized"
          >
            <ItemList />
          </PermissionGuard>
        )
      },
      {
        path: '/transportation',
        element: <Transportation />
      },

      {
        path: '/details-page/:userId',
        element: (
          // <PermissionGuard permissions={['IP:view']} redirectTo="/unauthorized">
          //   <IndividualPerfomance />
          // </PermissionGuard>
          <IndividualPerfomance />
        )
      },
      {
        path: '/tasks',
        element: (
          <PermissionGuard
            permissions={['Tasks:view']}
            redirectTo="/unauthorized"
          >
            <TaskList />
          </PermissionGuard>
        )
      },
      {
        path: '/leads',
        element: (
          <PermissionGuard
            permissions={['Leads:view']}
            redirectTo="/unauthorized"
          >
            <LeadList />
          </PermissionGuard>
        )
      },
      {
        path: '/users',
        element: (
          <PermissionGuard
            permissions={['Staff:view']}
            redirectTo="/unauthorized"
          >
            <UserList />
          </PermissionGuard>
        )
      },
      {
        path: '/definition',
        element: (
          <PermissionGuard
            permissions={['Definition:view']}
            redirectTo="/unauthorized"
          >
            <DefinitionTypes />
          </PermissionGuard>
        )
      },
      {
        path: '/roles-permissions',
        element: (
          <PermissionGuard
            permissions={['RolesAndPermissions:view']}
            redirectTo="/unauthorized"
          >
            <RolesAndPermissions />
          </PermissionGuard>
        )
      },
      // Chat routes
      {
        path: '/chat',
        element: (
          <PermissionGuard
            permissions={['Chat:view']}
            redirectTo="/unauthorized"
          >
            <ChatLayout />
          </PermissionGuard>
        ),
        children: [
          {
            path: ':userId',
            element: <ChatWindow />
          }
        ]
      }
    ]
  },

  // SESSION PAGES
  { path: '/session/404', element: <NotFound /> },
  { path: '/session/signin', element: <JwtLogin /> },
  { path: '/session/signup', element: <JwtRegister /> },
  { path: '/session/forgot-password', element: <ForgotPassword /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  { path: '/', element: <Navigate to="dashboard" /> },
  { path: '*', element: <NotFound /> }
]

export default routes
