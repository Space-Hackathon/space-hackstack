import React, { useState } from 'react';
import { useApi } from '../api/ApiProvider.jsx';
import { useResource } from '../hooks/useResource.js';
import { AsyncState } from './AsyncState.jsx';
import { ResultViewer } from './ResultViewer.jsx';
import { ProcessorSelect } from './ProcessorSelect.jsx';

export function FileDetail({ fileId, onChanged = () => {}, onDeleted = () => {}, renderers = {} }) {
  const api = useApi();
  const file = useResource((signal) => api.getFile(fileId, signal), [api, fileId]);
  const processors = useResource((signal) => api.processors(signal), [api]);
  const [processor, setProcessor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function run(action) {
    setBusy(true); setError(null);
    try {
      if (action === 'delete') { await api.deleteFile(fileId); onDeleted(fileId); }
      else { await api.processFile(fileId, processor); file.refresh(); onChanged(fileId); }
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  }
  return <section className="panel"><h2>File details</h2><AsyncState {...file} onRetry={file.refresh} /><AsyncState error={error} />
    {file.data && <><h3>{file.data.filename}</h3><p>Status: {file.data.status} · Processor: {file.data.processor || 'none'}</p>
      {file.data.error && <p className="error" role="alert">{file.data.error}</p>}
      <ResultViewer result={file.data.result} processor={file.data.processor} renderers={renderers} />
      <AsyncState error={processors.error} onRetry={processors.refresh} />
      <ProcessorSelect id="reprocess-selector" processors={processors.data || []} value={processor} onChange={setProcessor} disabled={busy} />
      <div className="actions"><button disabled={busy} onClick={() => run('process')}>{busy ? 'Working…' : 'Run processor'}</button>
      <a href={api.downloadUrl(fileId)}>Download original</a><button className="danger" disabled={busy} onClick={() => run('delete')}>Delete file</button></div>
    </>}
  </section>;
}
