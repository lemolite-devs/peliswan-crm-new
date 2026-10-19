// ---------------------------------------------------------------------------
// Shapes exactly as the existing back-end sends / accepts them
// (back-end/models/Leads.js and back-end/services/leads.js). Nothing here is
// invented — if the back-end changes, change it here.
// ---------------------------------------------------------------------------

/** One row of GET /api/leads (the aggregate `$project` in getLeadData). */
export interface ApiLeadRow {
  _id: string;
  customerName: string;
  companyName?: string[];
  mobileNumber?: string[];
  status?: string;
  country?: string;
  phoneCountryCode?: string;
  state?: string;
  city?: string;
  createdAt: string;
  isCustomer?: boolean;
  assignedToName?: string;
  productDetails?: { name: string }[];
  latestActivity?: { updatedAt?: string | null; description?: string | null };
}

export interface ApiLeadListResponse {
  lead: ApiLeadRow[];
  currentPage: number;
  totalPages: number;
  totalLeads: number;
}

export interface ApiActivity {
  _id: string;
  description: string;
  isCallTrue?: boolean;
  user?: { _id: string; name: string } | null;
  createdAt: string;
}

export interface ApiReminder {
  _id: string;
  message: string;
  baseDate?: string;
  dueDate?: string;
  isReadTrue?: boolean;
}

/** GET /api/leads/:id — products, assignedTo and activities.user are populated. */
export interface ApiLead {
  _id: string;
  customerName: string;
  companyName?: string[];
  mobileNumber?: string[];
  email?: string;
  zipCode?: string;
  status?: string;
  country?: string;
  phoneCountryCode?: string;
  state?: string;
  city?: string;
  products?: { _id: string; name: string }[];
  representative?: string;
  competitorName?: string;
  competitorRate?: number | null;
  quantity?: number;
  unit?: string;
  comments?: string;
  reminders?: ApiReminder[];
  inquiries?: string;
  assignedTo?: { _id: string; name: string } | null;
  activities?: ApiActivity[];
  meeting?: boolean;
  meetingType?: '' | 'regularMeeting' | 'hotMeeting';
  requestSample?: boolean;
  visitPlant?: boolean;
  visitOffice?: boolean;
  remark?: string;
  deliveryDestination?: string[];
  isCustomer?: boolean;
  createdAt: string;
  updatedAt: string;
  latestActivity?: { updatedAt?: string | null; description?: string | null };
}

/** Body accepted by POST /api/leads and PUT /api/leads/:id (Joi leadValidationSchema). */
export interface LeadPayload {
  customerName: string;
  companyName: string[];
  mobileNumber: string[];
  email: string;
  country: string;
  phoneCountryCode: string;
  zipCode: string;
  status: string;
  state: string;
  city?: string;
  products: string[];
  representative: string;
  quantity: number;
  unit: string;
  competitorName: string;
  competitorRate: number | null;
  comments: string;
  inquiries: string;
  remark?: string;
  meeting: boolean;
  meetingType: '' | 'regularMeeting' | 'hotMeeting';
  requestSample: boolean;
  visitPlant: boolean;
  visitOffice: boolean;
  deliveryDestination: string[];
}

/** GET /api/states */
export interface ApiState {
  country?: string;
  state: string;
  cities: string[];
}

/** GET /api/items/lookUps → { items: [{ key, value }] } */
export interface ItemLookup {
  key: string;
  value: string;
}

/** GET /api/users/lookUps → { users: [{ id, name, role }] } */
export interface UserLookup {
  id: string;
  name: string;
  role: string;
}

/** Filters understood by getLeadData on the back-end. */
export interface LeadFilters {
  combineField?: string; // free-text search over name / company / mobile
  status?: string;
  country?: string;
  state?: string;
  assignedTo?: string; // comma separated ids
  products?: string; // comma separated ids
  startDate?: string; // yyyy-mm-dd
  endDate?: string; // yyyy-mm-dd
}
