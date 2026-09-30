/** Error with an HTTP status, rendered as `{"detail": message}` like FastAPI. */
export class HttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

/** 422 in FastAPI's validation format: `{"detail": [{type, loc, msg, input, ctx?}]}`. */
export function validationError(type, loc, msg, input, ctx) {
  return new HttpError(422, [{ type, loc, msg, input, ...(ctx ? { ctx } : {}) }]);
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
    const position = Number(/position (\d+)/.exec(err.message)?.[1] ?? 0);
    return res.status(422).json({
      detail: [{ type: "json_invalid", loc: ["body", position], msg: "JSON decode error", input: {}, ctx: { error: err.message } }],
    });
  }
  console.error(err);
  return res.status(500).json({ detail: "Internal Server Error" });
}
