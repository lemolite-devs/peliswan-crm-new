// ---------------------------------------------------------------------------
// Every call the Leads module makes. These are the SAME endpoints v1 uses —
// see back-end/routes/leads.js. No new back-end routes were added.
// ---------------------------------------------------------------------------
import { api } from '@/lib/api';
import type {
  ApiActivity,
  ApiLead,
  ApiLeadListResponse,
  ApiState,
  ItemLookup,
  LeadFilters,
  LeadPayload,
  UserLookup,
} from './types';

function clean(filters: LeadFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = String(v);
  }
  return out;
}

export const leadsApi = {
  list: async (page: number, limit: number, filters: LeadFilters) => {
    const { data } = await api.get<ApiLeadListResponse>('/api/leads', {
      params: { page, limit, ...clean(filters) },
    });
    return data;
  },

  /** Only the total — used for the status count cards. */
  count: async (filters: LeadFilters) => {
    const { data } = await api.get<ApiLeadListResponse>('/api/leads', {
      params: { page: 1, limit: 1, ...clean(filters) },
    });
    return data.totalLeads;
  },

  exportXlsx: async (filters: LeadFilters) => {
    const { data } = await api.get<Blob>('/api/leads', {
      params: { export: true, ...clean(filters) },
      responseType: 'blob',
    });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<{ lead: ApiLead }>(`/api/leads/${id}`);
    return data.lead;
  },

  create: async (payload: LeadPayload, isCallTrue: boolean) => {
    const { data } = await api.post<{ lead: ApiLead }>('/api/leads', { ...payload, isCallTrue });
    return data.lead;
  },

  update: async (id: string, payload: LeadPayload) => {
    await api.put(`/api/leads/${id}`, payload);
  },

  remove: async (id: string) => {
    await api.delete(`/api/leads/${id}`);
  },

  convertToCustomer: async (id: string) => {
    await api.post(`/api/leads/${id}/convert-to-customer`);
  },

  activities: async (id: string) => {
    const { data } = await api.get<ApiActivity[]>(`/api/leads/${id}/activity`);
    return data;
  },

  addActivity: async (id: string, description: string, isCallTrue: boolean) => {
    await api.post(`/api/leads/${id}/activity`, { description, isCallTrue });
  },

  /** Returns null when free, or a message naming who already added the number. */
  checkMobile: async (numbers: string[], dialCode: string, leadId?: string) => {
    try {
      await api.get('/api/leads/exists-by-mobile', {
        params: {
          mobileNumbers: numbers.join(','),
          leadId: leadId ?? '',
          phoneCountryCode: dialCode,
        },
      });
      return null;
    } catch (err: unknown) {
      const data = (err as { response?: { status?: number; data?: { existingLeads?: { addedBy: string }[] } } })
        .response;
      if (data?.status === 400 && data.data?.existingLeads?.length) {
        return `Already added by ${data.data.existingLeads[0]!.addedBy}`;
      }
      return null;
    }
  },
};

export const lookupsApi = {
  items: async () => {
    const { data } = await api.get<{ items: ItemLookup[] }>('/api/items/lookUps');
    return data.items ?? [];
  },
  salesUsers: async () => {
    const { data } = await api.get<{ users: UserLookup[] }>('/api/users/lookUps', {
      params: { allowRole: ['Sales Executive', 'Sales Manager'] },
    });
    return data.users ?? [];
  },
  states: async () => {
    const { data } = await api.get<ApiState[]>('/api/states');
    return data ?? [];
  },
};
