import { useState } from "react";
import { useApi } from "../api/ApiProvider";
import { useResource } from "../hooks/useResource";
import type { ResultRenderer } from "../types";
import { AsyncState } from "./AsyncState";
import { ProcessorSelect } from "./ProcessorSelect";
import { ResultViewer } from "./ResultViewer";

export interface FileDetailProps {
  fileId: number;
  onChanged?: (id: number) => void;
  onDeleted?: (id: number) => void;
  renderers?: Record<string, ResultRenderer>;
}

export function FileDetail({ fileId, onChanged = () => {}, onDeleted = () => {}, renderers = {} }: FileDetailProps) {
  const api = useApi();
  const file = useResource((signal) => api.getFile(fileId, signal), [api, fileId]);
  const processors = useResource((signal) => api.processors(signal), [api]);
  const [processor, setProcessor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  async function run(action: "process" | "delete") {
    setBusy(true);
    setError(null);
    try {
      if (action === "delete") {
        await api.deleteFile(fileId);
        onDeleted(fileId);
      } else {
        await api.processFile(fileId, processor || undefined);
        file.refresh();
        onChanged(fileId);
      }
    } catch (actionError: unknown) {
      setError(actionError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">File details</h2>
      <AsyncState {...file} onRetry={file.refresh} />
      <AsyncState error={error} />
      {file.data && (
        <>
          <h3 className="mt-5 break-all text-lg font-semibold text-slate-900">{file.data.filename}</h3>
          <p className="mt-2 text-sm text-slate-600">Status: {file.data.status} · Processor: {file.data.processor || "none"}</p>
          {file.data.error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{file.data.error}</p>}
          <div className="my-5"><ResultViewer result={file.data.result} processor={file.data.processor} renderers={renderers} /></div>
          <AsyncState error={processors.error} onRetry={processors.refresh} />
          <ProcessorSelect id="reprocess-selector" processors={processors.data ?? []} value={processor} onChange={setProcessor} disabled={busy || processors.loading} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50" disabled={busy} onClick={() => run("process")}>{busy ? "Working…" : "Run processor"}</button>
            <a className="rounded-lg px-3 py-2 text-sm font-medium text-teal-800 underline underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-600" href={api.downloadUrl(fileId)}>Download original</a>
            <button className="ml-auto rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50" disabled={busy} onClick={() => run("delete")}>Delete file</button>
          </div>
        </>
      )}
    </section>
  );
}
