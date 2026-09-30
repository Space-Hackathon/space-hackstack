import React, { useState } from 'react';
import { useApi } from '../api/ApiProvider.jsx';
import { useResource } from '../hooks/useResource.js';
import { AsyncState } from './AsyncState.jsx';
import { ResultViewer } from './ResultViewer.jsx';

export function InferencePanel({ initialPayload = { features: [1, 2, 3] } }) {
  const api = useApi();
  const model = useResource((signal) => api.modelInfo(signal), [api]);
  const [payload, setPayload] = useState(() => JSON.stringify(initialPayload, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null); setResult(null);
    try {
      const data = JSON.parse(payload);
      if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Enter a JSON object');
      setResult(await api.predict(data));
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  }
  return <section className="panel"><h2>Model playground</h2><AsyncState {...model} onRetry={model.refresh} />
    {model.data && <p>Model: {model.data.model}{model.data.model === 'dummy-mean' ? ' (demo: returns the feature mean)' : ''}</p>}
    <form onSubmit={submit}><label htmlFor="prediction-payload">JSON input<textarea id="prediction-payload" rows={6} value={payload} disabled={busy} onChange={(e) => setPayload(e.target.value)} /></label>
      <button disabled={busy}>{busy ? 'Running…' : 'Run prediction'}</button></form>
    <AsyncState error={error} />{result && <ResultViewer result={result} />}
  </section>;
}
