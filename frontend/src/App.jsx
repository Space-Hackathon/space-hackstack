import React, { useState } from 'react';
import { useApi } from './api/ApiProvider.jsx';
import { useResource } from './hooks/useResource.js';
import { FileUploader, FileTable, FileDetail, HealthStatus, InferencePanel } from './components/index.js';

export default function App() {
  const api = useApi();
  const capabilities = useResource((signal) => api.capabilities(signal), [api]);
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  return <main><header><div><p className="eyebrow">UPLOAD · PROCESS · EXPERIMENT</p><h1>Hackstack workspace</h1><p>Build your next idea with reusable data tools.</p></div><HealthStatus /></header>
    <div className="grid"><FileUploader maxUploadBytes={capabilities.data?.max_upload_bytes} onUploaded={(file) => { setSelected(file.id); refresh(); }} /><FileTable revision={revision} onSelect={setSelected} /></div>
    {selected !== null && <FileDetail key={selected} fileId={selected} onChanged={refresh} onDeleted={() => { setSelected(null); refresh(); }} />}
    <InferencePanel /><footer>Connect either backend through VITE_API_URL. Components work independently inside ApiProvider.</footer>
  </main>;
}
