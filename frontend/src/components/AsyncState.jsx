import React from 'react';
export function AsyncState({ loading, error, onRetry }) {
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <div role="alert" className="error"><p>{error.message}</p>{onRetry && <button onClick={onRetry}>Try again</button>}</div>;
  return null;
}
