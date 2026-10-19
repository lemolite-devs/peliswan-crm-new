// Mirrors front-end (v1) src/app/utils/constant.js and the back-end enums.
// Keep these lists in sync with back-end/models/Leads.js.

export const SUPPORTED_COUNTRIES = [
  { name: 'India', dialCode: '+91', zipLength: 6, phoneLength: 10 },
  { name: 'Nepal', dialCode: '+977', zipLength: 5, phoneLength: 10 },
] as const;

export const DEFAULT_COUNTRY = 'India';
export const DEFAULT_DIAL_CODE = '+91';

export function countryConfig(name?: string) {
  return (
    SUPPORTED_COUNTRIES.find((c) => c.name === name) ??
    SUPPORTED_COUNTRIES.find((c) => c.name === DEFAULT_COUNTRY)!
  );
}

export const LEAD_STATUSES = ['Hot', 'Warm', 'Cold', 'Follow Up', 'Irrelevant', 'Others'] as const;
export const REPRESENTATIVES = ['Trader', 'Manufacturer', 'Owner', 'End User', 'Others', 'TBD'] as const;
export const INQUIRY_SOURCES = ['IndiaMART', 'TradeIndia', 'Facebook', 'Whatsapp', 'Instagram', 'References'] as const;
export const REMARKS = ['No Answer', 'Call Later', 'Interested', 'Not Interested', 'Switch Off', 'Other'] as const;
export const UNITS = ['Barrels', 'KL', 'MTS'] as const;

export const MEETING_TYPES = [
  { value: 'regularMeeting', label: 'Regular meeting' },
  { value: 'hotMeeting', label: 'Hot meeting' },
] as const;

// ---- Sarvadesk visual language, mapped onto Peliswan statuses -------------
export type BadgeTone =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'followup'
  | 'neutral'
  | 'success'
  | 'danger'
  | 'info'
  | 'brand';

export const STATUS_TONE: Record<string, BadgeTone> = {
  Hot: 'hot',
  Warm: 'warm',
  Cold: 'cold',
  'Follow Up': 'followup',
  Irrelevant: 'neutral',
  Others: 'neutral',
};

/** Soft row tint per status, like Sarvadesk's lead table. */
export const STATUS_ROW_TINT: Record<string, string> = {
  Hot: 'bg-[var(--row-hot)]',
  Warm: 'bg-[var(--row-warm)]',
  Cold: 'bg-[var(--row-cold)]',
  'Follow Up': 'bg-[var(--row-followup)]',
};

export const STATUS_ACCENT: Record<string, string> = {
  Hot: '#DC2626',
  Warm: '#F59E0B',
  Cold: '#3B82F6',
  'Follow Up': '#10B981',
};
