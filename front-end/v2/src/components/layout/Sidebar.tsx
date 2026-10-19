import { NavLink } from 'react-router-dom';
import { ExternalLink, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NAV_GROUPS, type NavItem } from '@/lib/nav';
import { V1_URL } from '@/lib/config';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Logo } from '@/components/shared/Logo';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const itemClass = (collapsed: boolean, active = false) =>
  cn(
    'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
    collapsed && 'justify-center px-0',
    active
      ? 'bg-brand-primary/8 text-brand-primary dark:bg-brand-secondary/12 dark:text-brand-secondary'
      : 'text-content-secondary hover:bg-muted hover:text-content',
  );

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const Icon = item.icon;

  const link = item.path ? (
    <NavLink to={item.path} onClick={onNavigate} className={({ isActive }) => itemClass(collapsed, isActive)}>
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-secondary" />
          )}
          <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  ) : (
    // Not migrated yet — opens the same page in the classic app.
    <a href={`${V1_URL}${item.v1Path ?? ''}`} className={itemClass(collapsed)}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          <ExternalLink className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
        </>
      )}
    </a>
  );

  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function Sidebar() {
  const can = useAuthStore((s) => s.can);
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebar } = useUiStore();

  const content = (mobile: boolean) => {
    const collapsed = mobile ? false : sidebarCollapsed;
    const close = () => mobile && setMobileSidebar(false);
    return (
      <div className="glass-soft flex h-full flex-col backdrop-blur-xl backdrop-saturate-150">
        <div className={cn('flex h-14 shrink-0 items-center border-b border-line px-4', collapsed && 'justify-center px-0')}>
          <NavLink to="/leads" onClick={close} aria-label="Go to home" className="rounded-md hover:opacity-80">
            <Logo showWordmark={!collapsed} size="lg" />
          </NavLink>
          {mobile && (
            <button
              onClick={() => setMobileSidebar(false)}
              className="ml-auto rounded-md p-1.5 text-content-muted hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const visible = group.items.filter(
              (it) => (!it.permission || can(it.permission)) && (it.path || V1_URL),
            );
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                {collapsed ? (
                  <div className="mx-auto mb-1.5 h-px w-6 bg-line" />
                ) : (
                  <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <SidebarLink key={item.label} item={item} collapsed={collapsed} onNavigate={close} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {!mobile && (
          <div className="shrink-0 border-t border-line p-3">
            <button
              onClick={toggleSidebar}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-content-muted transition-colors hover:bg-muted hover:text-content',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[18px]" strokeWidth={1.5} />
              ) : (
                <>
                  <PanelLeftClose className="size-[18px]" strokeWidth={1.5} />
                  <span>Collapse</span>
                </>
              )}
            </button>
            {!collapsed && <div className="mt-1 px-2.5 text-[10px] text-content-muted">Peliswan CRM · UI v2 (preview)</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          'no-print hidden shrink-0 transition-[width] duration-200 lg:block',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="fixed inset-y-0 left-0 z-30">
          <div className={cn('h-full border-r border-line transition-[width] duration-200', sidebarCollapsed ? 'w-16' : 'w-60')}>
            {content(false)}
          </div>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50" onClick={() => setMobileSidebar(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-right border-r border-line bg-surface shadow-pop">
            {content(true)}
          </div>
        </div>
      )}
    </>
  );
}
