import { useState, type FormEvent } from "react";
import { useApi } from "../api/ApiProvider";
import { useResource } from "../hooks/useResource";
import type { JsonObject, JsonValue } from "../types";
import { AsyncState } from "./AsyncState";
import { ResultViewer } from "./ResultViewer";

export interface InferencePanelProps {
  initialPayload?: JsonObject;
}

export function InferencePanel({ initialPayload = { features: [1, 2, 3] } }: InferencePanelProps) {
  const api = useApi();
  const model = useResource((signal) => api.modelInfo(signal), [api]);
  const [payload, setPayload] = useState(() => JSON.stringify(initialPayload, null, 2));
  const [result, setResult] = useState<JsonValue | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data: unknown = JSON.parse(payload);
      if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("Enter a JSON object");
      setResult(await api.predict(data as JsonObject));
    } catch (predictionError: unknown) {
      setError(predictionError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">Model playground</h2>
      <AsyncState {...model} onRetry={model.refresh} />
      {model.data && (
        <p className="mt-2 text-sm text-slate-600">
          Model: <span className="font-medium text-slate-900">{model.data.model}</span>
          {model.data.model === "dummy-mean" && " (demo: returns the feature mean)"}
        </p>
      )}
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label htmlFor="prediction-payload" className="block text-sm font-medium text-slate-700">
          JSON input
          <textarea
            id="prediction-payload"
            rows={6}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50"
            value={payload}
            disabled={busy}
            onChange={(event) => setPayload(event.currentTarget.value)}
          />
        </label>
        <button className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50" disabled={busy}>{busy ? "Running…" : "Run prediction"}</button>
      </form>
      <AsyncState error={error} />
      {result !== null && <div className="mt-5"><ResultViewer result={result} /></div>}
    </section>
  );
}
