import { useApi } from "../api/ApiProvider";
import { useResource } from "../hooks/useResource";
import { AsyncState } from "./AsyncState";

export function HealthStatus() {
  const api = useApi();
  const health = useResource((signal) => api.health(signal), [api]);
  return (
    <div>
      <AsyncState {...health} onRetry={health.refresh} />
      {health.data && (
        <span className={"inline-flex rounded-full px-3 py-1.5 text-sm " +
          (health.data.status === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
          API {health.data.status} · Database {health.data.database}
        </span>
      )}
    </div>
  );
}
