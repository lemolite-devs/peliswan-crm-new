import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FilterX,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EntityAvatar } from '@/components/shared/EntityAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatNumber, formatRelative } from '@/lib/format';
import { cn, downloadBlob } from '@/lib/utils';
import { leadsApi } from './api';
import { toLeadRow, type LeadRow } from './adapter';
import { LEAD_STATUSES, STATUS_ROW_TINT, SUPPORTED_COUNTRIES } from './constants';
import { useLookups } from './useLookups';
import type { LeadFilters } from './types';

const PAGE_SIZES = [10, 25, 50, 100];

/** Debounce a fast-changing value (search box). */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function LeadsList() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.can);
  const { users } = useLookups();

  // Filters live in the URL so Back / refresh / sharing a link keep them.
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 25;
  const status = params.get('status') ?? '';
  const owner = params.get('owner') ?? '';
  const country = params.get('country') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounced(search.trim(), 400);

  const setParam = useCallback(
    (patch: Record<string, string | number>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v === undefined) next.delete(k);
            else next.set(k, String(v));
          }
          if (!('page' in patch)) next.delete('page'); // any filter change → back to page 1
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  useEffect(() => {
    if ((params.get('q') ?? '') !== q) setParam({ q });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: LeadFilters = useMemo(
    () => ({ combineField: q, status, assignedTo: owner, country, startDate: from, endDate: to }),
    [q, status, owner, country, from, to],
  );

  // ---- table data ----
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    leadsApi
      .list(page, limit, filters)
      .then((res) => {
        if (!alive) return;
        setRows(res.lead.map(toLeadRow));
        setTotal(res.totalLeads);
      })
      .catch((err) => alive && toast.error(apiErrorMessage(err, 'Could not load leads')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, limit, filters, reload]);

  // ---- actions ----
  const [confirmDelete, setConfirmDelete] = useState<LeadRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleDelete = async (row: LeadRow) => {
    try {
      await leadsApi.remove(row.id);
      toast.success('Lead deleted');
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete lead'));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await leadsApi.exportXlsx(filters);
      downloadBlob(blob, `leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = !!(q || status || owner || country || from || to);
  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isExec = user?.role === 'Sales Executive';
  const showOwnerFilter = !isExec && users.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description={
          loading ? 'Loading…' : `${formatNumber(total)} leads${hasFilters ? ' match your filters' : ' in your pipeline'}`
        }
        icon={<Target />}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} loading={exporting}>
              {!exporting && <Download className="size-4" />} Export
            </Button>
            {can('Leads:add') && (
              <Button onClick={() => navigate('/leads/new')}>
                <Plus className="size-4" /> Add Lead
              </Button>
            )}
          </>
        }
      />

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company or mobile…"
              className="h-9 pl-8"
            />
          </div>
          <div className="w-36">
            <SelectField
              value={status || 'all'}
              onChange={(v) => setParam({ status: v === 'all' ? '' : v })}
              options={[{ value: 'all', label: 'All statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s })), { value: 'Customer', label: 'Customers' }]}
            />
          </div>
          {showOwnerFilter && (
            <div className="w-44">
              <SelectField
                value={owner || 'all'}
                onChange={(v) => setParam({ owner: v === 'all' ? '' : v })}
                options={[{ value: 'all', label: 'All owners' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
              />
            </div>
          )}
          <div className="w-36">
            <SelectField
              value={country || 'all'}
              onChange={(v) => setParam({ country: v === 'all' ? '' : v })}
              options={[{ value: 'all', label: 'All countries' }, ...SUPPORTED_COUNTRIES.map((c) => ({ value: c.name, label: c.name }))]}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setParam({ from: e.target.value })}
              className="h-9 w-[138px]"
              aria-label="Created from"
            />
            <span className="text-xs text-content-muted">to</span>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setParam({ to: e.target.value })}
              className="h-9 w-[138px]"
              aria-label="Created to"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="size-4" /> Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No leads found"
              description={hasFilters ? 'Try clearing a filter or searching for something else.' : 'Add your first lead to get started.'}
              actionLabel={hasFilters ? 'Clear filters' : can('Leads:add') ? 'Add Lead' : undefined}
              onAction={hasFilters ? clearFilters : () => navigate('/leads/new')}
            />
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted">
                <tr>
                  {['Lead', 'Contact', 'Status', 'Products', 'Owner', 'Last activity', 'Created', ''].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-line px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-content-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/leads/${r.id}`)}
                    className={cn(
                      'cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-muted',
                      STATUS_ROW_TINT[r.status],
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <EntityAvatar name={r.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium text-content">
                            {r.name}
                            {r.isCustomer && (
                              <Badge tone="success" size="sm">
                                <UserCheck /> Customer
                              </Badge>
                            )}
                          </div>
                          <div className="max-w-[220px] truncate text-xs text-content-muted">{r.company || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="num whitespace-nowrap text-content-secondary">{r.phone}</div>
                      <div className="max-w-[180px] truncate text-xs text-content-muted">{r.location || '—'}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge label={r.status} dot />
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5">
                      <div className="truncate text-content-secondary" title={r.products.join(', ')}>
                        {r.products.length ? r.products.join(', ') : '—'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-content-secondary">{r.owner}</td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <div className="text-xs text-content-muted">{formatRelative(r.lastActivityAt)}</div>
                      <div className="truncate text-xs text-content-secondary" title={r.lastActivity}>
                        {r.lastActivity ?? ''}
                      </div>
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-xs text-content-muted">{formatDate(r.createdAt)}</td>
                    <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/leads/${r.id}`)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          {can('Leads:edit') && (
                            <DropdownMenuItem onClick={() => navigate(`/leads/${r.id}/edit`)}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                          )}
                          {can('Leads:delete') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem destructive onClick={() => setConfirmDelete(r)}>
                                <Trash2 /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination (server side) */}
        {!loading && total > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2.5 text-sm">
            <span className="text-content-muted">
              {formatNumber((page - 1) * limit + 1)}–{formatNumber(Math.min(page * limit, total))} of {formatNumber(total)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => setParam({ limit: Number(e.target.value) })}
                  className="h-8 cursor-pointer appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 text-xs text-content-secondary hover:border-brand-secondary/40 focus:border-brand-secondary focus:outline-none"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} / page
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-content-muted" />
              </div>
              <span className="text-content-muted">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setParam({ page: page - 1 })} aria-label="Previous page">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setParam({ page: page + 1 })} aria-label="Next page">
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name ?? 'this lead'}?`}
        description="The lead and its activity history are removed for everyone. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}
