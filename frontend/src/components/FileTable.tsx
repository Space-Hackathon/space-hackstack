import { useState } from "react";
import { useApi } from "../api/ApiProvider";
import { useResource } from "../hooks/useResource";
import { AsyncState } from "./AsyncState";

export interface FileTableProps {
  onSelect?: (id: number) => void;
  revision?: number;
  pageSize?: number;
}

export function FileTable({ onSelect = () => {}, revision = 0, pageSize = 20 }: FileTableProps) {
  const api = useApi();
  const [offset, setOffset] = useState(0);
  const files = useResource((signal) => api.listFiles({ offset, limit: pageSize, signal }), [api, offset, pageSize, revision]);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Files</h2>
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={files.refresh}>Refresh</button>
      </div>
      <AsyncState {...files} onRetry={files.refresh} />
      {files.data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-2 py-3 font-medium">File</th><th className="px-2 py-3 font-medium">Status</th><th className="px-2 py-3 text-right font-medium">Size</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.data.map((file) => (
                  <tr key={file.id}>
                    <td className="max-w-64 break-all px-2 py-3">
                      <button className="text-left font-medium text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={() => onSelect(file.id)}>{file.filename}</button>
                    </td>
                    <td className="px-2 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-medium " + statusClass(file.status)}>{file.status}</span></td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums text-slate-600">{(file.size_bytes / 1024).toFixed(1)} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {files.data.length === 0 && <p className="py-5 text-sm text-slate-500">No files on this page. Upload data to get started.</p>}
          <nav className="mt-5 flex items-center justify-between" aria-label="File pages">
            <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50" disabled={offset === 0 || files.loading} onClick={() => setOffset(Math.max(0, offset - pageSize))}>Previous</button>
            <span className="text-sm tabular-nums text-slate-500">Page {Math.floor(offset / pageSize) + 1}</span>
            <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50" disabled={files.data.length < pageSize || files.loading} onClick={() => setOffset(offset + pageSize)}>Next</button>
          </nav>
        </>
      )}
    </section>
  );
}

function statusClass(status: string): string {
  if (status === "processed") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}
