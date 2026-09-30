/** Error with an HTTP status, rendered as `{"detail": message}` like FastAPI. */
export class HttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function notFound(_req, res) {
  res.status(404).json({ detail: "Not Found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ detail: err.detail });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(422).json({ detail: "Request body is not valid JSON" });
  }
  console.error(err);
  return res.status(500).json({ detail: "Internal Server Error" });
}
