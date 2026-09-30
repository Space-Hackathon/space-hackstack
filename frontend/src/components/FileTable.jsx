import React, { useState } from 'react';
import { useApi } from '../api/ApiProvider.jsx';
import { useResource } from '../hooks/useResource.js';
import { AsyncState } from './AsyncState.jsx';

export function FileTable({ onSelect = () => {}, revision = 0, pageSize = 20 }) {
  const api = useApi();
  const [offset, setOffset] = useState(0);
  const files = useResource((signal) => api.listFiles({ offset, limit: pageSize, signal }), [api, offset, pageSize, revision]);
  return <section className="panel"><div className="section-heading"><h2>Files</h2><button className="secondary" onClick={files.refresh}>Refresh</button></div>
    <AsyncState {...files} onRetry={files.refresh} />
    {files.data && <><div className="table-scroll"><table><thead><tr><th>File</th><th>Status</th><th>Size</th></tr></thead><tbody>
      {files.data.map((file) => <tr key={file.id}><td><button className="link" onClick={() => onSelect(file.id)}>{file.filename}</button></td><td><span className={'badge ' + file.status}>{file.status}</span></td><td>{(file.size_bytes / 1024).toFixed(1)} KB</td></tr>)}
    </tbody></table></div>{files.data.length === 0 && <p>No files on this page. Upload data to get started.</p>}
    <nav aria-label="File pages"><button className="secondary" disabled={offset === 0 || files.loading} onClick={() => setOffset(Math.max(0, offset - pageSize))}>Previous</button><span>Page {Math.floor(offset / pageSize) + 1}</span><button className="secondary" disabled={files.data.length < pageSize || files.loading} onClick={() => setOffset(offset + pageSize)}>Next</button></nav></>}
  </section>;
}
