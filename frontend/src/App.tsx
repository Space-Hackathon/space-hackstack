import { useState } from "react";
import { useApi } from "./api/ApiProvider";
import { useResource } from "./hooks/useResource";
import { FileUploader, FileTable, FileDetail, HealthStatus, InferencePanel } from "./components";
import type { FileRecord } from "./types";

export default function App() {
  const api = useApi();
  const capabilities = useResource((signal) => api.capabilities(signal), [api]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  function handleUploaded(file: FileRecord) {
    setSelected(file.id);
    refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-slate-800 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-teal-700">UPLOAD · PROCESS · EXPERIMENT</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Hackstack workspace</h1>
          <p className="mt-2 text-slate-600">Build your next idea with reusable data tools.</p>
        </div>
        <HealthStatus />
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <FileUploader maxUploadBytes={capabilities.data?.max_upload_bytes} onUploaded={handleUploaded} />
        <FileTable revision={revision} onSelect={setSelected} />
      </div>
      {selected !== null && (
        <div className="mt-6">
          <FileDetail key={selected} fileId={selected} onChanged={refresh} onDeleted={() => { setSelected(null); refresh(); }} />
        </div>
      )}
      <div className="mt-6"><InferencePanel /></div>
      <footer className="mt-8 text-sm text-slate-500">
        Connect either backend through VITE_API_URL. Components work independently inside ApiProvider.
      </footer>
    </main>
  );
}
