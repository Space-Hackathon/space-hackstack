import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useApi } from "../api/ApiProvider";
import { useResource } from "../hooks/useResource";
import type { FileRecord } from "../types";
import { AsyncState } from "./AsyncState";
import { ProcessorSelect } from "./ProcessorSelect";

export interface FileUploaderProps {
  onUploaded?: (record: FileRecord) => void;
  maxUploadBytes?: number;
}

export function FileUploader({ onUploaded = () => {}, maxUploadBytes }: FileUploaderProps) {
  const api = useApi();
  const processors = useResource((signal) => api.processors(signal), [api]);
  const [file, setFile] = useState<File | null>(null);
  const [processor, setProcessor] = useState("");
  const [processImmediately, setProcessImmediately] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) return;
    if (maxUploadBytes !== undefined && file.size > maxUploadBytes) {
      setError(new Error("File exceeds the upload limit"));
      return;
    }
    setBusy(true);
    try {
      const record = await api.uploadFile(file, { processor, process: processImmediately });
      setFile(null);
      if (input.current) input.current.value = "";
      onUploaded(record);
    } catch (uploadError: unknown) {
      setError(uploadError);
    } finally {
      setBusy(false);
    }
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.currentTarget.files?.[0] ?? null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">Upload data</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Upload a file, choose a processor, and inspect the result.</p>
      <AsyncState error={error} />
      <AsyncState {...processors} onRetry={processors.refresh} />
      <form className="mt-5 space-y-4" onSubmit={submit} aria-busy={busy}>
        <label htmlFor="upload-file" className="block text-sm font-medium text-slate-700">
          Data file
          <input
            ref={input}
            id="upload-file"
            type="file"
            className="mt-1.5 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-teal-50 file:px-4 file:py-2.5 file:font-medium file:text-teal-800 hover:file:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 disabled:opacity-50"
            disabled={busy}
            onChange={selectFile}
          />
        </label>
        <ProcessorSelect processors={processors.data ?? []} value={processor} onChange={setProcessor} disabled={busy || processors.loading} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-teal-700 focus:ring-teal-600"
            checked={processImmediately}
            disabled={busy}
            onChange={(event) => setProcessImmediately(event.currentTarget.checked)}
          />
          Process immediately
        </label>
        <button className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !file}>
          {busy ? "Uploading…" : "Upload file"}
        </button>
      </form>
    </section>
  );
}
