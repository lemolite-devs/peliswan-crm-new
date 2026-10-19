import { useEffect, useState } from 'react';
import { lookupsApi } from './api';
import type { ApiState, ItemLookup, UserLookup } from './types';

// Loaded once per session and shared by every screen.
let cache: Promise<{ items: ItemLookup[]; users: UserLookup[]; states: ApiState[] }> | null = null;

function load() {
  cache ??= Promise.all([
    lookupsApi.items().catch(() => [] as ItemLookup[]),
    // Only roles with Staff access can list users; others simply get none.
    lookupsApi.salesUsers().catch(() => [] as UserLookup[]),
    lookupsApi.states().catch(() => [] as ApiState[]),
  ]).then(([items, users, states]) => ({ items, users, states }));
  return cache;
}

export function useLookups() {
  const [data, setData] = useState<{ items: ItemLookup[]; users: UserLookup[]; states: ApiState[] }>({
    items: [],
    users: [],
    states: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    load().then((d) => {
      if (alive) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { ...data, loading };
}

/** Forget cached lookups (e.g. after sign-out). */
export function resetLookups() {
  cache = null;
}
