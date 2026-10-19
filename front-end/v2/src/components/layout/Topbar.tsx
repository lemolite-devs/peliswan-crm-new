import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Menu, Moon, Repeat, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { V1_URL } from '@/lib/config';
import { EntityAvatar } from '@/components/shared/EntityAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = { leads: 'Leads', new: 'New Lead', edit: 'Edit' };

function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [];
  let acc = '';
  segments.forEach((seg) => {
    acc += `/${seg}`;
    // Mongo ids are long hex strings — show them as "Lead details".
    const label = LABELS[seg] ?? (/^[a-f0-9]{24}$/i.test(seg) ? 'Lead details' : seg);
    crumbs.push({ label, to: acc });
  });

  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 text-content-muted" />}
          {i < crumbs.length - 1 && c.to ? (
            <Link to={c.to} className="text-content-muted hover:text-content">
              {c.label}
            </Link>
          ) : (
            <span className={cn(i === crumbs.length - 1 ? 'font-medium text-content' : 'text-content-muted')}>
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme, setMobileSidebar } = useUiStore();

  return (
    <header className="glass-strong sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-5">
      <button
        className="rounded-md p-1.5 text-content-secondary hover:bg-muted lg:hidden"
        onClick={() => setMobileSidebar(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        {V1_URL && (
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <a href={V1_URL}>
              <Repeat className="size-4" /> Classic UI
            </a>
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted focus-ring">
              <EntityAvatar name={user?.name ?? 'User'} size="sm" />
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-sm font-medium text-content">{user?.name}</div>
                <div className="text-[11px] text-content-muted">{user?.role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            {V1_URL && (
              <>
                <DropdownMenuItem asChild>
                  <a href={V1_URL}>
                    <Repeat /> Switch to classic UI
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              destructive
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
