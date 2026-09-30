import { useCallback, useEffect, useState, type DependencyList } from "react";

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  refresh: () => void;
}

// Read-only requests are cancelled when the resource changes or unmounts.
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList = [],
): ResourceState<T> {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<Omit<ResourceState<T>, "refresh">>({
    data: null,
    loading: true,
    error: null,
  });
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => load(controller.signal))
      .then(
        (data) => {
          if (!controller.signal.aborted) setState({ data, loading: false, error: null });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setState({ data: null, loading: false, error });
        },
      );
    return () => controller.abort();
    // Callers pass every value used by load in dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision]);

  return { ...state, refresh };
}
