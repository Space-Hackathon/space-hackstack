import { isValidElement } from "react";
import type { ReactNode } from "react";
import type { ResourceState } from "../hooks/useResource";

export interface AsyncStateProps {
  loading?: boolean;
  error?: unknown | null;
  onRetry?: () => void;
}

function errorMessage(error: unknown): ReactNode {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (isValidElement(error)) return error;
  return "Something went wrong.";
}

export function AsyncState({ loading, error, onRetry }: AsyncStateProps) {
  if (loading) {
    return <p role="status" className="text-sm text-slate-500">Loading…</p>;
  }
  if (error) {
    return (
      <div role="alert" className="my-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
        <p>{errorMessage(error)}</p>
        {onRetry && <button className="mt-2 rounded-md bg-rose-700 px-3 py-2 text-white hover:bg-rose-800" onClick={onRetry}>Try again</button>}
      </div>
    );
  }
  return null;
}

export function ResourceStateMessage<T>(props: ResourceState<T>) {
  return <AsyncState {...props} />;
}
