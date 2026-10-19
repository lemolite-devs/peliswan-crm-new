import type { LucideIcon } from 'lucide-react';
import {
  Target,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CheckSquare,
  Truck,
  MessagesSquare,
  UserCog,
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** In-app route for modules already on v2. */
  path?: string;
  /** Path in the classic (v1) app for modules not migrated yet. */
  v1Path?: string;
  /** Hide unless the user has this permission (same names as the back-end). */
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// As you migrate a module, give it a `path` here and drop its `v1Path`.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'New UI',
    items: [{ label: 'Leads', icon: Target, path: '/leads', permission: 'Leads:view' }],
  },
  {
    label: 'Classic CRM (v1)',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, v1Path: '/dashboard' },
      { label: 'Customers', icon: Users, v1Path: '/customers' },
      { label: 'Items', icon: Package, v1Path: '/sales/items' },
      { label: 'Proposals', icon: FileText, v1Path: '/sales/proposals' },
      { label: 'Tasks', icon: CheckSquare, v1Path: '/tasks' },
      { label: 'Transportation', icon: Truck, v1Path: '/transportation' },
      { label: 'Chat', icon: MessagesSquare, v1Path: '/chat' },
      { label: 'Users', icon: UserCog, v1Path: '/users' },
    ],
  },
];
