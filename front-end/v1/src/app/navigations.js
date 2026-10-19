export const navigations = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    permissions: ['Dashboard:view']
  },
  {
    name: 'Leads',
    path: '/leads',
    icon: 'ring_volume',
    permissions: ['Leads:view']
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: 'people',
    permissions: ['Customers:view']
  },
  {
    name: 'Tasks',
    path: '/tasks',
    icon: 'border_color',
    permissions: ['Tasks:view']
  },
  {
    name: 'Chat',
    path: '/chat',
    icon: 'chat',
    permissions: ['Chat:view']
  },
  {
    name: 'Transportation',
    path: '/transportation',
    icon: 'local_shipping',
    permissions: ['Leads:view']
  },

  {
    name: 'Sales',
    icon: 'trending_up',
    children: [
      {
        name: 'Proposals',
        iconText: 'PS',
        path: '/sales/proposals',
        permissions: ['Sales.Proposals:view']
      },
      {
        name: 'Items',
        iconText: 'IS',
        path: '/sales/items',
        permissions: ['Sales.Items:view']
      }
    ]
  },

  {
    name: 'Staff Management',
    path: '/users',
    icon: 'group_add',
    permissions: ['Staff:view']
  },
  {
    name: 'Definition Page',
    path: '/definition',
    icon: 'local_offer',
    permissions: ['Definition:view']
  },
  {
    name: 'Roles and Permissions',
    path: '/roles-permissions',
    icon: 'admin_panel_settings',
    permissions: ['RolesAndPermissions:view']
  }

  //Below code need to remove
  // { name: 'Dashboard1', path: '/dashboard1', icon: 'dashboard' },
  // { label: 'PAGES', type: 'label' },
  // {
  //   name: 'Session/Auth',
  //   icon: 'security',
  //   children: [
  //     { name: 'Sign in', iconText: 'SI', path: '/session/signin' },
  //     { name: 'Sign up', iconText: 'SU', path: '/session/signup' },
  //     {
  //       name: 'Forgot Password',
  //       iconText: 'FP',
  //       path: '/session/forgot-password'
  //     },
  //     { name: 'Error', iconText: '404', path: '/session/404' }
  //   ]
  // },
  // { label: 'Components', type: 'label' },
  // {
  //   name: 'Components',
  //   icon: 'favorite',
  //   badge: { value: '30+', color: 'secondary' },
  //   children: [
  //     { name: 'Auto Complete', path: '/material/autocomplete', iconText: 'A' },
  //     { name: 'Buttons', path: '/material/buttons', iconText: 'B' },
  //     { name: 'Checkbox', path: '/material/checkbox', iconText: 'C' },
  //     { name: 'Dialog', path: '/material/dialog', iconText: 'D' },
  //     {
  //       name: 'Expansion Panel',
  //       path: '/material/expansion-panel',
  //       iconText: 'E'
  //     },
  //     { name: 'Form', path: '/material/form', iconText: 'F' },
  //     { name: 'Icons', path: '/material/icons', iconText: 'I' },
  //     { name: 'Menu', path: '/material/menu', iconText: 'M' },
  //     { name: 'Progress', path: '/material/progress', iconText: 'P' },
  //     { name: 'Radio', path: '/material/radio', iconText: 'R' },
  //     { name: 'Switch', path: '/material/switch', iconText: 'S' },
  //     { name: 'Slider', path: '/material/slider', iconText: 'S' },
  //     { name: 'Snackbar', path: '/material/snackbar', iconText: 'S' },
  //     { name: 'Table', path: '/material/table', iconText: 'T' }
  //   ]
  // },
  // {
  //   name: 'Charts',
  //   icon: 'trending_up',
  //   children: [{ name: 'Echarts', path: '/charts/echarts', iconText: 'E' }]
  // },
  // {
  //   name: 'Documentation',
  //   icon: 'launch',
  //   type: 'extLink',
  //   path: 'http://demos.ui-lib.com/matx-react-doc/'
  // }
]
