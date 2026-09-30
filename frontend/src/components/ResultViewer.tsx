import type { JsonValue, ResultRenderer } from "../types";

export interface ResultViewerProps {
  result: JsonValue | null;
  processor?: string | null;
  renderers?: Record<string, ResultRenderer>;
}

export function ResultViewer({ result, processor, renderers = {} }: ResultViewerProps) {
  const Renderer = processor ? renderers[processor] : undefined;
  if (Renderer) return <Renderer result={result} />;
  if (result == null) return <p className="text-sm text-slate-500">No result yet. Run a processor to produce one.</p>;
  return <pre aria-label="Processing result" className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-5 text-sm leading-6 text-slate-100">{JSON.stringify(result, null, 2)}</pre>;
}
