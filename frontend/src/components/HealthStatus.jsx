import React from 'react';
import { useApi } from '../api/ApiProvider.jsx';
import { useResource } from '../hooks/useResource.js';
import { AsyncState } from './AsyncState.jsx';
export function HealthStatus() {
  const api = useApi();
  const health = useResource((signal) => api.health(signal), [api]);
  return <div><AsyncState {...health} onRetry={health.refresh} />{health.data && <span className={'badge ' + (health.data.status === 'ok' ? 'processed' : 'failed')}>API {health.data.status} · Database {health.data.database}</span>}</div>;
}
