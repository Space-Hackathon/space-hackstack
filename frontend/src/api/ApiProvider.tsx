import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "./client";

const ApiContext = createContext<ApiClient | null>(null);

export interface ApiProviderProps {
  baseUrl?: string;
  client?: ApiClient;
  children: ReactNode;
}

export function ApiProvider({
  baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  client,
  children,
}: ApiProviderProps) {
  const api = useMemo(() => client || createApiClient({ baseUrl }), [baseUrl, client]);
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) throw new Error("Wrap components in ApiProvider");
  return api;
}
