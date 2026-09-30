import { useCallback, useEffect, useState } from 'react';

// Read-only requests are cancelled when the resource changes or unmounts.
export function useResource(load, dependencies = []) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    Promise.resolve().then(() => load(controller.signal)).then(
      (data) => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); },
      (error) => { if (!controller.signal.aborted) setState({ data: null, loading: false, error }); },
    );
    return () => controller.abort();
  }, [...dependencies, revision]);
  return { ...state, refresh };
}
