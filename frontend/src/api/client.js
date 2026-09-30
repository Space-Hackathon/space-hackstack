export class ApiError extends Error {
  constructor(message, status, detail) { super(message); this.name = 'ApiError'; this.status = status; this.detail = detail; }
}

export function createApiClient({ baseUrl = '/api', fetchImpl = globalThis.fetch } = {}) {
  const base = baseUrl.replace(/\/$/, '');
  async function request(path, { query, ...options } = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    const response = await fetchImpl(base + path + (params.size ? '?' + params : ''), options);
    if (response.status === 204) return null;
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.detail;
      const message = Array.isArray(detail) ? detail.map((item) => item.msg).join('; ') : typeof detail === 'string' ? detail : 'Request failed (' + response.status + ')';
      throw new ApiError(message, response.status, detail);
    }
    return body;
  }
  const filePath = (id) => '/files/' + encodeURIComponent(id);
  return {
    health: (signal) => request('/health', { signal }),
    processors: (signal) => request('/processors', { signal }),
    capabilities: (signal) => request('/capabilities', { signal }),
    listFiles: ({ offset = 0, limit = 20, signal } = {}) => request('/files', { query: { offset, limit }, signal }),
    getFile: (id, signal) => request(filePath(id), { signal }),
    uploadFile: (file, { process = true, processor } = {}) => {
      const body = new FormData(); body.append('file', file);
      return request('/files', { method: 'POST', body, query: { process, processor } });
    },
    processFile: (id, processor) => request(filePath(id) + '/process', { method: 'POST', query: { processor } }),
    deleteFile: (id) => request(filePath(id), { method: 'DELETE' }),
    downloadUrl: (id) => base + filePath(id) + '/download',
    modelInfo: (signal) => request('/ml/model', { signal }),
    predict: (payload) => request('/ml/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  };
}
