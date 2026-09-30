import React, { createContext, useContext, useMemo } from 'react';
import { createApiClient } from './client.js';
const ApiContext = createContext(null);

export function ApiProvider({ baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api', client, children }) {
  const api = useMemo(() => client || createApiClient({ baseUrl }), [baseUrl, client]);
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}
export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('Wrap components in ApiProvider');
  return api;
}
