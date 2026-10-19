// ---------------------------------------------------------------------------
// The adapter: the ONLY place that knows both the back-end's data shape and
// the shape the v2 screens want. Screens never touch `_id`, arrays of phone
// numbers, etc. directly. When you move the next module to v2, write one of
// these for it and keep the back-end as it is.
// ---------------------------------------------------------------------------
import { countryConfig, DEFAULT_COUNTRY, DEFAULT_DIAL_CODE } from './constants';
import type { ApiLead, ApiLeadRow, LeadPayload } from './types';

/** What the leads table renders. */
export interface LeadRow {
  id: string;
  name: string;
  company: string;
  phone: string;
  location: string;
  status: string;
  isCustomer: boolean;
  owner: string;
  products: string[];
  lastActivityAt?: string;
  lastActivity?: string;
  createdAt: string;
}

export function dialCodeOf(lead: { phoneCountryCode?: string; country?: string }): string {
  return lead.phoneCountryCode || countryConfig(lead.country).dialCode;
}

export function formatPhone(number: string | undefined, lead: { phoneCountryCode?: string; country?: string }) {
  return number ? `${dialCodeOf(lead)} ${number}` : '—';
}

export function toLeadRow(r: ApiLeadRow): LeadRow {
  return {
    id: r._id,
    name: r.customerName,
    company: (r.companyName ?? []).filter(Boolean).join(', '),
    phone: formatPhone(r.mobileNumber?.[0], r),
    location: [r.city, r.state, r.country && r.country !== DEFAULT_COUNTRY ? r.country : '']
      .filter(Boolean)
      .join(', '),
    status: r.status ?? '',
    isCustomer: !!r.isCustomer,
    owner: r.assignedToName ?? '—',
    products: (r.productDetails ?? []).map((p) => p.name),
    lastActivityAt: r.latestActivity?.updatedAt ?? undefined,
    lastActivity: r.latestActivity?.description ?? undefined,
    createdAt: r.createdAt,
  };
}

// ---- form <-> API ----------------------------------------------------------

/** Flat, string-friendly values the form edits. */
export interface LeadFormValues {
  customerName: string;
  companyName: string[];
  mobileNumber: string[];
  email: string;
  country: string;
  phoneCountryCode: string;
  state: string;
  city: string;
  zipCode: string;
  status: string;
  representative: string;
  inquiries: string;
  remark: string;
  products: string[]; // item ids
  quantity: string;
  unit: string;
  competitorName: string;
  competitorRate: string;
  comments: string;
  meeting: boolean;
  meetingType: '' | 'regularMeeting' | 'hotMeeting';
  requestSample: boolean;
  visitPlant: boolean;
  visitOffice: boolean;
  deliveryDestination: string[];
}

export const EMPTY_LEAD_FORM: LeadFormValues = {
  customerName: '',
  companyName: [''],
  mobileNumber: [''],
  email: '',
  country: DEFAULT_COUNTRY,
  phoneCountryCode: DEFAULT_DIAL_CODE,
  state: '',
  city: '',
  zipCode: '',
  status: '',
  representative: '',
  inquiries: '',
  remark: '',
  products: [],
  quantity: '',
  unit: '',
  competitorName: '',
  competitorRate: '',
  comments: '',
  meeting: false,
  meetingType: '',
  requestSample: false,
  visitPlant: false,
  visitOffice: false,
  deliveryDestination: [],
};

export function toFormValues(lead: ApiLead): LeadFormValues {
  return {
    customerName: lead.customerName ?? '',
    companyName: lead.companyName?.length ? lead.companyName : [''],
    mobileNumber: lead.mobileNumber?.length ? lead.mobileNumber : [''],
    email: lead.email ?? '',
    country: lead.country || DEFAULT_COUNTRY,
    phoneCountryCode: dialCodeOf(lead),
    state: lead.state ?? '',
    city: lead.city ?? '',
    zipCode: lead.zipCode ?? '',
    status: lead.status ?? '',
    representative: lead.representative ?? '',
    inquiries: lead.inquiries ?? '',
    remark: lead.remark ?? '',
    products: (lead.products ?? []).map((p) => p._id),
    quantity: lead.quantity != null ? String(lead.quantity) : '',
    unit: lead.unit ?? '',
    competitorName: lead.competitorName ?? '',
    competitorRate: lead.competitorRate != null ? String(lead.competitorRate) : '',
    comments: lead.comments ?? '',
    meeting: !!lead.meeting,
    meetingType: lead.meetingType ?? '',
    requestSample: !!lead.requestSample,
    visitPlant: !!lead.visitPlant,
    visitOffice: !!lead.visitOffice,
    deliveryDestination: lead.deliveryDestination ?? [],
  };
}

/**
 * Build the request body. The back-end's Joi schema rejects unknown keys and
 * rejects empty strings for some optional fields (city, remark), so those are
 * left out when blank rather than sent as ''.
 */
export function toPayload(v: LeadFormValues): LeadPayload {
  const payload: LeadPayload = {
    customerName: v.customerName.trim(),
    companyName: v.companyName.map((c) => c.trim()).filter(Boolean),
    mobileNumber: v.mobileNumber.map((m) => m.trim()).filter(Boolean),
    email: v.email.trim(),
    country: v.country,
    phoneCountryCode: v.phoneCountryCode,
    zipCode: v.zipCode.trim(),
    status: v.status,
    state: v.state,
    products: v.products,
    representative: v.representative,
    quantity: Number(v.quantity),
    unit: v.unit,
    competitorName: v.competitorName.trim(),
    competitorRate: v.competitorRate.trim() === '' ? null : Number(v.competitorRate),
    comments: v.comments.trim(),
    inquiries: v.inquiries,
    meeting: v.meeting,
    meetingType: v.meeting ? v.meetingType : '',
    requestSample: v.requestSample,
    visitPlant: v.visitPlant,
    visitOffice: v.visitOffice,
    deliveryDestination: v.deliveryDestination,
  };
  if (v.city.trim()) payload.city = v.city.trim();
  if (v.remark) payload.remark = v.remark;
  return payload;
}

/** Same rules the back-end enforces, checked before sending. */
export function validateLead(v: LeadFormValues): Partial<Record<keyof LeadFormValues, string>> {
  const e: Partial<Record<keyof LeadFormValues, string>> = {};
  const cfg = countryConfig(v.country);

  if (v.customerName.trim().length < 3) e.customerName = 'At least 3 characters.';
  if (v.companyName.some((c) => c.trim() && c.trim().length < 3))
    e.companyName = 'Company names need at least 3 characters.';

  const phones = v.mobileNumber.map((m) => m.trim()).filter(Boolean);
  if (phones.length === 0) e.mobileNumber = 'At least one mobile number is required.';
  else if (phones.some((p) => !/^\d+$/.test(p) || p.length !== cfg.phoneLength))
    e.mobileNumber = `Mobile numbers must be ${cfg.phoneLength} digits.`;
  else if (new Set(phones).size !== phones.length) e.mobileNumber = 'Duplicate mobile number.';

  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email.';
  if (!v.state) e.state = 'State is required.';
  if (v.zipCode.trim() && !new RegExp(`^\\d{${cfg.zipLength}}$`).test(v.zipCode.trim()))
    e.zipCode = `Must be ${cfg.zipLength} digits for ${cfg.name}.`;
  if (!v.status) e.status = 'Status is required.';
  if (!v.representative) e.representative = 'Representative is required.';
  if (!v.inquiries) e.inquiries = 'Inquiry source is required.';
  if (!v.remark) e.remark = 'Remark is required.';
  if (v.products.length === 0) e.products = 'Pick at least one product.';
  if (v.products.length > 10) e.products = 'At most 10 products.';
  if (!v.quantity || Number(v.quantity) < 1) e.quantity = 'Quantity must be at least 1.';
  if (!v.unit) e.unit = 'Unit is required.';
  if (v.competitorRate.trim() && (Number.isNaN(Number(v.competitorRate)) || Number(v.competitorRate) < 0))
    e.competitorRate = 'Enter a valid rate.';
  if (v.comments.length > 300) e.comments = 'Max 300 characters.';
  return e;
}
