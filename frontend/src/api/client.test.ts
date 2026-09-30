import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";

describe("swappable backend client", () => {
  it("keeps multipart boundaries browser-managed and serializes options", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 201 }),
    );
    const api = createApiClient({ baseUrl: "http://example.test/custom/", fetchImpl });
    await api.uploadFile(new File(["a"], "a.txt"), { process: false, processor: "custom" });
    const [url, options] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://example.test/custom/files?process=false&processor=custom");
    expect(options?.body).toBeInstanceOf(FormData);
    expect(options?.headers).toBeUndefined();
  });

  it("accepts 204 without parsing JSON", async () => {
    const api = createApiClient({ fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 })) });
    expect(await api.deleteFile(7)).toBeNull();
  });

  it("turns FastAPI/Node validation errors into readable messages", async () => {
    const api = createApiClient({
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ detail: [{ msg: "Invalid value" }] }), { status: 422 }),
      ),
    });
    await expect(api.predict({})).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid value",
      status: 422,
    });
  });

  it("preserves cancellation and pagination parameters", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("[]"));
    const api = createApiClient({ fetchImpl });
    const controller = new AbortController();
    await api.listFiles({ offset: 20, limit: 20, signal: controller.signal });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/files?offset=20&limit=20");
    expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});
