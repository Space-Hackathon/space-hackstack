import React from 'react';
export function ResultViewer({ result, processor, renderers = {} }) {
  const Renderer = renderers[processor];
  if (Renderer) return <Renderer result={result} />;
  if (result == null) return <p>No result yet. Run a processor to produce one.</p>;
  return <pre aria-label="Processing result">{JSON.stringify(result, null, 2)}</pre>;
}
