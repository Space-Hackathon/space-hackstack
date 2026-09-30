import React, { useRef, useState } from 'react';
import { useApi } from '../api/ApiProvider.jsx';
import { useResource } from '../hooks/useResource.js';
import { AsyncState } from './AsyncState.jsx';
import { ProcessorSelect } from './ProcessorSelect.jsx';

export function FileUploader({ onUploaded = () => {}, maxUploadBytes }) {
  const api = useApi();
  const processors = useResource((signal) => api.processors(signal), [api]);
  const [file, setFile] = useState(null);
  const [processor, setProcessor] = useState('');
  const [process, setProcess] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef();
  async function submit(event) {
    event.preventDefault(); setError(null);
    if (!file) return;
    if (maxUploadBytes && file.size > maxUploadBytes) { setError(new Error('File exceeds the upload limit')); return; }
    setBusy(true);
    try {
      const record = await api.uploadFile(file, { processor, process });
      setFile(null); input.current.value = ''; onUploaded(record);
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  }
  return <section className="panel"><h2>Upload data</h2><p>Upload a file, choose a processor, and inspect the result.</p>
    <AsyncState error={error} /><AsyncState {...processors} onRetry={processors.refresh} />
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor="upload-file">Data file<input ref={input} id="upload-file" type="file" disabled={busy} onChange={(e) => setFile(e.target.files[0] || null)} /></label>
      <ProcessorSelect processors={processors.data || []} value={processor} onChange={setProcessor} disabled={busy || processors.loading} />
      <label className="checkbox"><input type="checkbox" checked={process} disabled={busy} onChange={(e) => setProcess(e.target.checked)} />Process immediately</label>
      <button disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload file'}</button>
    </form>
  </section>;
}
