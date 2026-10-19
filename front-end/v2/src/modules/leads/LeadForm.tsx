import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Plus, Save, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField, FormGrid, FormSection } from '@/components/forms/FormField';
import { SelectField } from '@/components/forms/SelectField';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { leadsApi } from './api';
import { EMPTY_LEAD_FORM, toFormValues, toPayload, validateLead, type LeadFormValues } from './adapter';
import {
  countryConfig,
  INQUIRY_SOURCES,
  LEAD_STATUSES,
  MEETING_TYPES,
  REMARKS,
  REPRESENTATIVES,
  SUPPORTED_COUNTRIES,
  UNITS,
} from './constants';
import { useLookups } from './useLookups';

type Errors = Partial<Record<keyof LeadFormValues, string>>;
const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

export default function LeadForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { items, states } = useLookups();

  const [values, setValues] = useState<LeadFormValues>(EMPTY_LEAD_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [isCallTrue, setIsCallTrue] = useState(false);
  const [duplicate, setDuplicate] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    leadsApi
      .get(id)
      .then((lead) => setValues(toFormValues(lead)))
      .catch((err) => {
        toast.error(apiErrorMessage(err, 'Could not load lead'));
        navigate('/leads');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ---- cascading location lists from GET /api/states ----
  const statesForCountry = useMemo(
    () => states.filter((s) => (s.country ?? 'India') === values.country).map((s) => s.state).sort(),
    [states, values.country],
  );
  const citiesForState = useMemo(
    () => states.find((s) => s.state === values.state && (s.country ?? 'India') === values.country)?.cities ?? [],
    [states, values.state, values.country],
  );
  const allCities = useMemo(
    () => [...new Set(states.flatMap((s) => s.cities))].sort().map((c) => ({ value: c, label: c })),
    [states],
  );
  const productOptions = useMemo(() => items.map((i) => ({ value: i.key, label: i.value })), [items]);

  const cfg = countryConfig(values.country);

  const changeCountry = (country: string) => {
    setValues((v) => ({
      ...v,
      country,
      phoneCountryCode: countryConfig(country).dialCode,
      state: '',
      city: '',
    }));
  };

  // Same duplicate check as v1, run when a number looks complete.
  const checkDuplicate = async () => {
    const nums = values.mobileNumber.map((m) => m.trim()).filter((m) => m.length === cfg.phoneLength);
    if (!nums.length) return setDuplicate(null);
    setDuplicate(await leadsApi.checkMobile(nums, values.phoneCountryCode, id));
  };

  const updateList = (key: 'companyName' | 'mobileNumber', index: number, value: string) =>
    set(key, values[key].map((v, i) => (i === index ? value : v)));
  const addToList = (key: 'companyName' | 'mobileNumber') => set(key, [...values[key], '']);
  const removeFromList = (key: 'companyName' | 'mobileNumber', index: number) =>
    set(key, values[key].filter((_, i) => i !== index));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateLead(values);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (duplicate) {
      toast.error(`Mobile number ${duplicate.toLowerCase()}`);
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(values);
      if (isEdit) {
        await leadsApi.update(id!, payload);
        toast.success('Lead updated');
        navigate(`/leads/${id}`);
      } else {
        const lead = await leadsApi.create(payload, isCallTrue);
        toast.success('Lead created');
        navigate(`/leads/${lead._id}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save lead'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={isEdit ? 'Edit Lead' : 'Add New Lead'}
        description={isEdit ? `Updating ${values.customerName}` : 'Capture a new sales enquiry'}
        icon={<Target />}
      />

      <form onSubmit={submit} noValidate>
        <Card>
          <CardContent className="space-y-7">
            {duplicate && (
              <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 p-3">
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <div className="text-xs text-content-secondary">
                  <span className="font-semibold text-content">Duplicate mobile number.</span> {duplicate}. The back-end
                  will not accept the same number twice.
                </div>
              </div>
            )}

            <FormSection title="Contact details">
              <FormGrid>
                <FormField label="Customer name" required error={errors.customerName}>
                  <Input
                    value={values.customerName}
                    onChange={(e) => set('customerName', e.target.value)}
                    placeholder="e.g. Rajesh Patel"
                    className={cn(errors.customerName && 'border-danger')}
                  />
                </FormField>
                <FormField label="Email" error={errors.email}>
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="name@company.com"
                    className={cn(errors.email && 'border-danger')}
                  />
                </FormField>

                <FormField label="Company name(s)" error={errors.companyName}>
                  <div className="space-y-2">
                    {values.companyName.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={c}
                          onChange={(e) => updateList('companyName', i, e.target.value)}
                          placeholder="e.g. Shree Krishna Petroleum"
                        />
                        {values.companyName.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFromList('companyName', i)} aria-label="Remove company">
                            <X />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => addToList('companyName')}>
                      <Plus className="size-3.5" /> Add another company
                    </Button>
                  </div>
                </FormField>

                <FormField label="Mobile number(s)" required error={errors.mobileNumber}>
                  <div className="space-y-2">
                    {values.mobileNumber.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="num flex h-9 shrink-0 items-center rounded-md border border-line bg-muted px-2.5 text-sm text-content-secondary">
                          {values.phoneCountryCode}
                        </span>
                        <Input
                          value={m}
                          inputMode="numeric"
                          maxLength={cfg.phoneLength}
                          onChange={(e) => updateList('mobileNumber', i, e.target.value.replace(/\D/g, ''))}
                          onBlur={checkDuplicate}
                          placeholder={`${cfg.phoneLength} digits`}
                          className={cn('num', errors.mobileNumber && 'border-danger')}
                        />
                        {values.mobileNumber.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFromList('mobileNumber', i)} aria-label="Remove number">
                            <X />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => addToList('mobileNumber')}>
                      <Plus className="size-3.5" /> Add another number
                    </Button>
                  </div>
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Location">
              <FormGrid cols={3}>
                <FormField label="Country" required>
                  <SelectField value={values.country} onChange={changeCountry} options={SUPPORTED_COUNTRIES.map((c) => ({ value: c.name, label: c.name }))} />
                </FormField>
                <FormField label="State" required error={errors.state}>
                  <SelectField
                    value={values.state}
                    onChange={(v) => {
                      setValues((s) => ({ ...s, state: v, city: '' }));
                      setErrors((e) => ({ ...e, state: undefined }));
                    }}
                    options={opts(statesForCountry)}
                    placeholder="Select state"
                    className={cn(errors.state && 'border-danger')}
                  />
                </FormField>
                <FormField label="City">
                  <Input
                    value={values.city}
                    onChange={(e) => set('city', e.target.value)}
                    list="city-options"
                    placeholder={values.state ? 'Type or pick a city' : 'Pick a state first'}
                    disabled={!values.state}
                  />
                  <datalist id="city-options">
                    {citiesForState.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </FormField>
                <FormField label="Zip code" error={errors.zipCode}>
                  <Input
                    value={values.zipCode}
                    inputMode="numeric"
                    maxLength={cfg.zipLength}
                    onChange={(e) => set('zipCode', e.target.value.replace(/\D/g, ''))}
                    placeholder={`${cfg.zipLength} digits`}
                    className={cn('num', errors.zipCode && 'border-danger')}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Qualification">
              <FormGrid cols={3}>
                <FormField label="Status" required error={errors.status}>
                  <SelectField value={values.status} onChange={(v) => set('status', v)} options={opts(LEAD_STATUSES)} placeholder="Select status" className={cn(errors.status && 'border-danger')} />
                </FormField>
                <FormField label="Inquiry source" required error={errors.inquiries}>
                  <SelectField value={values.inquiries} onChange={(v) => set('inquiries', v)} options={opts(INQUIRY_SOURCES)} placeholder="Where did it come from?" className={cn(errors.inquiries && 'border-danger')} />
                </FormField>
                <FormField label="Representative" required error={errors.representative}>
                  <SelectField value={values.representative} onChange={(v) => set('representative', v)} options={opts(REPRESENTATIVES)} placeholder="Who are they?" className={cn(errors.representative && 'border-danger')} />
                </FormField>
                <FormField label="Remark" required error={errors.remark}>
                  <SelectField value={values.remark} onChange={(v) => set('remark', v)} options={opts(REMARKS)} placeholder="Call outcome" className={cn(errors.remark && 'border-danger')} />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Requirement">
              <FormGrid cols={3}>
                <FormField label="Products" required error={errors.products} className="sm:col-span-2 lg:col-span-3">
                  <MultiSelect
                    options={productOptions}
                    value={values.products}
                    onChange={(v) => set('products', v)}
                    placeholder="Pick up to 10 products"
                    invalid={!!errors.products}
                  />
                </FormField>
                <FormField label="Quantity" required error={errors.quantity}>
                  <Input
                    type="number"
                    min={1}
                    value={values.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    className={cn('num', errors.quantity && 'border-danger')}
                  />
                </FormField>
                <FormField label="Unit" required error={errors.unit}>
                  <SelectField value={values.unit} onChange={(v) => set('unit', v)} options={opts(UNITS)} placeholder="Unit" className={cn(errors.unit && 'border-danger')} />
                </FormField>
                <FormField label="Delivery destinations">
                  <MultiSelect options={allCities} value={values.deliveryDestination} onChange={(v) => set('deliveryDestination', v)} placeholder="Cities" />
                </FormField>
                <FormField label="Competitor name">
                  <Input value={values.competitorName} onChange={(e) => set('competitorName', e.target.value)} placeholder="Optional" />
                </FormField>
                <FormField label="Competitor rate (₹)" error={errors.competitorRate}>
                  <Input
                    type="number"
                    min={0}
                    value={values.competitorRate}
                    onChange={(e) => set('competitorRate', e.target.value)}
                    placeholder="Optional"
                    className={cn('num', errors.competitorRate && 'border-danger')}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Next steps">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {(
                  [
                    ['meeting', 'Meeting'],
                    ['requestSample', 'Sample requested'],
                    ['visitPlant', 'Plant visit'],
                    ['visitOffice', 'Office visit'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-content-secondary">
                    <Checkbox checked={values[key]} onCheckedChange={(c) => set(key, !!c)} />
                    {label}
                  </label>
                ))}
                {values.meeting && (
                  <div className="w-48">
                    <SelectField
                      value={values.meetingType}
                      onChange={(v) => set('meetingType', v as LeadFormValues['meetingType'])}
                      options={MEETING_TYPES.map((m) => ({ value: m.value, label: m.label }))}
                      placeholder="Meeting type"
                    />
                  </div>
                )}
              </div>
              <FormField label="Comments" error={errors.comments} hint={`${values.comments.length}/300`}>
                <Textarea
                  value={values.comments}
                  onChange={(e) => set('comments', e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Anything the team should know…"
                />
              </FormField>
            </FormSection>
          </CardContent>

          <CardFooter className="flex-wrap justify-between">
            {!isEdit ? (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-content-secondary">
                <Switch checked={isCallTrue} onCheckedChange={setIsCallTrue} />
                Lead came from a call
              </label>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {!saving && <Save className="size-4" />} {isEdit ? 'Save changes' : 'Create lead'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
