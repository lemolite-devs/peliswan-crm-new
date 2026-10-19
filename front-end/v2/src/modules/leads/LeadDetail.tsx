import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarClock,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EntityAvatar } from '@/components/shared/EntityAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import { leadsApi } from './api';
import { formatPhone } from './adapter';
import { MEETING_TYPES } from './constants';
import type { ApiActivity, ApiLead } from './types';

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-content-muted" />
      <span className="text-xs text-content-muted">{label}</span>
      <span className="num ml-auto text-right text-sm font-medium text-content">{value}</span>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-content">{value || '—'}</dd>
    </div>
  );
}

function Timeline({ activities }: { activities: ApiActivity[] }) {
  const sorted = [...activities].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  if (sorted.length === 0) {
    return <EmptyState compact icon={MessageSquare} title="No activity yet" description="Calls and notes will appear here." />;
  }
  return (
    <div>
      {sorted.map((a, i) => {
        const Icon = a.isCallTrue ? PhoneCall : MessageSquare;
        return (
          <div key={a._id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  a.isCallTrue ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                }`}
              >
                <Icon className="size-4" strokeWidth={1.5} />
              </div>
              {i < sorted.length - 1 && <div className="w-px flex-1 bg-line" />}
            </div>
            <div className="pb-5">
              <p className="text-sm text-content">
                <span className="font-medium">{a.user?.name ?? 'Someone'}</span>{' '}
                <span className="text-content-secondary">{a.isCallTrue ? 'logged a call' : 'added a note'}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-content-secondary">{a.description}</p>
              <p className="mt-0.5 text-[11px] text-content-muted" title={formatDateTime(a.createdAt)}>
                {formatRelative(a.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeadDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const can = useAuthStore((s) => s.can);

  const [lead, setLead] = useState<ApiLead | null>(null);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [note, setNote] = useState('');
  const [isCall, setIsCall] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, acts] = await Promise.all([leadsApi.get(id), leadsApi.activities(id).catch(() => null)]);
      setLead(l);
      // The activity endpoint filters to the user's own entries for Sales Executives.
      setActivities(acts ?? l.activities ?? []);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404 || status === 500) setNotFound(true);
      else toast.error(apiErrorMessage(err, 'Could not load lead'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const addActivity = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await leadsApi.addActivity(id, note.trim(), isCall);
      setNote('');
      toast.success(isCall ? 'Call logged' : 'Note added');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await leadsApi.remove(id);
      toast.success('Lead deleted');
      navigate('/leads');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete lead'));
    }
  };

  const convert = async () => {
    try {
      await leadsApi.convertToCustomer(id);
      toast.success('Converted to customer');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not convert'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <EmptyState
        icon={Building2}
        title="Lead not found"
        description="It may have been deleted or you may not have access to it."
        actionLabel="Back to Leads"
        onAction={() => navigate('/leads')}
      />
    );
  }

  const company = (lead.companyName ?? []).filter(Boolean);
  const phones = (lead.mobileNumber ?? []).filter(Boolean);
  const location = [lead.city, lead.state, lead.country].filter(Boolean).join(', ');
  const nextSteps = [
    lead.meeting && (MEETING_TYPES.find((m) => m.value === lead.meetingType)?.label ?? 'Meeting'),
    lead.requestSample && 'Sample requested',
    lead.visitPlant && 'Plant visit',
    lead.visitOffice && 'Office visit',
  ].filter(Boolean) as string[];
  const reminders = [...(lead.reminders ?? [])].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  return (
    <div className="space-y-5">
      <PageHeader
        title={lead.customerName}
        description={[company.join(', '), lead.inquiries && `via ${lead.inquiries}`].filter(Boolean).join(' · ') || undefined}
        icon={<Building2 />}
        actions={
          <>
            {can('Leads:edit') && (
              <Button variant="outline" onClick={() => navigate(`/leads/${id}/edit`)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            {!lead.isCustomer && (
              <Button onClick={() => setConfirmConvert(true)}>
                <UserPlus className="size-4" /> Convert to Customer
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left rail */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <EntityAvatar name={lead.customerName} size="xl" />
              <h3 className="mt-3 font-display text-base font-semibold text-content">{lead.customerName}</h3>
              <p className="text-sm text-content-muted">{company[0] ?? 'No company'}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <StatusBadge label={lead.status} dot />
                {lead.isCustomer && (
                  <Badge tone="success" uppercase>
                    <UserCheck /> Customer
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {phones.map((p, i) => (
                <InfoRow key={p} icon={Phone} label={i === 0 ? 'Mobile' : `Mobile ${i + 1}`} value={formatPhone(p, lead)} />
              ))}
              {lead.email && <InfoRow icon={Mail} label="Email" value={lead.email} />}
              <InfoRow icon={MapPin} label="Location" value={location || '—'} />
              {lead.zipCode && <InfoRow icon={MapPin} label="Zip code" value={lead.zipCode} />}
              <div className="border-t border-line pt-2.5 text-xs text-content-muted">
                Owner: <span className="font-medium text-content">{lead.assignedTo?.name ?? '—'}</span>
                <br />
                Created {formatDate(lead.createdAt)} · Updated {formatRelative(lead.updatedAt)}
              </div>
              {can('Leads:delete') && (
                <Button variant="ghost" size="sm" className="w-full text-danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Delete Lead
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultValue="overview">
              <div className="px-2 pt-1">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
                  <TabsTrigger value="log">Log Activity</TabsTrigger>
                  <TabsTrigger value="reminders">Reminders ({reminders.length})</TabsTrigger>
                </TabsList>
              </div>

              <CardContent>
                <TabsContent value="overview">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <Field label="Products" value={(lead.products ?? []).map((p) => p.name).join(', ')} full />
                    <Field
                      label="Quantity"
                      value={lead.quantity != null ? `${formatNumber(lead.quantity)} ${lead.unit ?? ''}` : null}
                    />
                    <Field label="Representative" value={lead.representative} />
                    <Field label="Inquiry source" value={lead.inquiries} />
                    <Field label="Remark" value={lead.remark} />
                    <Field label="Competitor" value={lead.competitorName} />
                    <Field
                      label="Competitor rate"
                      value={lead.competitorRate != null ? `₹ ${formatNumber(lead.competitorRate)}` : null}
                    />
                    <Field label="Delivery destinations" value={(lead.deliveryDestination ?? []).join(', ')} full />
                    <div className="col-span-2">
                      <dt className="text-xs text-content-muted">Next steps</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {nextSteps.length ? (
                          nextSteps.map((s) => (
                            <Badge key={s} tone="brand">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="font-medium text-content">—</span>
                        )}
                      </dd>
                    </div>
                    <Field label="Comments" value={lead.comments} full />
                  </dl>
                </TabsContent>

                <TabsContent value="activity">
                  <Timeline activities={activities} />
                </TabsContent>

                <TabsContent value="log">
                  <div className="space-y-3">
                    <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-content-secondary">
                      <Switch checked={isCall} onCheckedChange={setIsCall} />
                      {isCall ? 'This was a call' : 'Just a note'}
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What happened? Call summary, price discussed, next step…"
                      rows={4}
                    />
                    <Button size="sm" onClick={addActivity} disabled={!note.trim()} loading={saving}>
                      {!saving && <Plus className="size-4" />} {isCall ? 'Log call' : 'Add note'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="reminders">
                  {reminders.length === 0 ? (
                    <EmptyState compact icon={Bell} title="No reminders" description="Reminders set on this lead appear here." />
                  ) : (
                    <div className="space-y-2">
                      {reminders.map((r) => (
                        <div key={r._id} className="flex items-center gap-3 rounded-md border border-line p-3">
                          <CalendarClock className="size-4 shrink-0 text-brand-secondary" />
                          <span className="text-sm text-content">{r.message}</span>
                          <span className="num ml-auto whitespace-nowrap text-xs text-content-muted">
                            {formatDate(r.dueDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this lead?"
        description="The lead and its activity history are removed for everyone. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={remove}
      />
      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title="Convert to customer?"
        description="This creates a customer and client record from this lead, exactly as the classic CRM does."
        confirmLabel="Convert"
        onConfirm={convert}
      />
    </div>
  );
}
