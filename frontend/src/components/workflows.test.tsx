// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../api/ApiProvider";
import type { ApiClient } from "../api/client";
import type { FileRecord, FileSummary, JsonValue, ProcessorDescriptor } from "../types";
import { FileUploader, FileTable, FileDetail, InferencePanel, ResultViewer } from "./index";

afterEach(cleanup);

const processors: ProcessorDescriptor[] = [{ name: "ndjson", description: "Records", extensions: [".jsonl"] }];
const fullRecord: FileRecord = {
  id: 7,
  filename: "a.csv",
  content_type: "text/csv",
  size_bytes: 20,
  status: "processed",
  processor: "csv",
  created_at: "2026-09-30T00:00:00Z",
  processed_at: "2026-09-30T00:00:01Z",
  result: { row_count: 3 },
  error: null,
};

function mount(element: React.ReactNode, client: Partial<ApiClient>) {
  return render(<ApiProvider client={client as ApiClient}>{element}</ApiProvider>);
}

it("uploads through a discovered processor with deferred processing", async () => {
  const user = userEvent.setup();
  const onUploaded = vi.fn<(record: FileRecord) => void>();
  const record = { ...fullRecord, filename: "a.jsonl" };
  const client = {
    processors: vi.fn<() => Promise<ProcessorDescriptor[]>>().mockResolvedValue(processors),
    uploadFile: vi.fn<ApiClient["uploadFile"]>().mockResolvedValue(record),
  };
  mount(<FileUploader onUploaded={onUploaded} />, client);
  await screen.findByRole("option", { name: /ndjson/ });
  const file = new File(['{"a":1}'], "a.jsonl");
  await user.upload(screen.getByLabelText("Data file"), file);
  await user.selectOptions(screen.getByLabelText("Processor"), "ndjson");
  await user.click(screen.getByLabelText("Process immediately"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(record));
  expect(client.uploadFile).toHaveBeenCalledWith(file, { processor: "ndjson", process: false });
});

it("rejects oversize uploads without contacting the backend", async () => {
  const client = {
    processors: vi.fn<() => Promise<ProcessorDescriptor[]>>().mockResolvedValue([]),
    uploadFile: vi.fn<ApiClient["uploadFile"]>(),
  };
  const user = userEvent.setup();
  mount(<FileUploader maxUploadBytes={1} />, client);
  await user.upload(screen.getByLabelText("Data file"), new File(["abc"], "a.txt"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "File exceeds the upload limit");
  expect(client.uploadFile).not.toHaveBeenCalled();
});

it("paginates file lists and emits the selected ID", async () => {
  const onSelect = vi.fn<(id: number) => void>();
  const firstPage: FileSummary[] = [{ ...fullRecord }];
  const client = {
    listFiles: vi.fn<ApiClient["listFiles"]>().mockResolvedValueOnce(firstPage).mockResolvedValueOnce([]),
  };
  const user = userEvent.setup();
  mount(<FileTable pageSize={1} onSelect={onSelect} />, client);
  await user.click(await screen.findByRole("button", { name: "a.csv" }));
  expect(onSelect).toHaveBeenCalledWith(7);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText(/No files on this page/);
  expect(client.listFiles.mock.calls[1]?.[0]?.offset).toBe(1);
});

it("reprocesses and deletes a selected file using the shared contract", async () => {
  const client = {
    getFile: vi.fn<ApiClient["getFile"]>().mockResolvedValue(fullRecord),
    processors: vi.fn<() => Promise<ProcessorDescriptor[]>>().mockResolvedValue(processors),
    processFile: vi.fn<ApiClient["processFile"]>().mockResolvedValue(fullRecord),
    deleteFile: vi.fn<ApiClient["deleteFile"]>().mockResolvedValue(null),
    downloadUrl: vi.fn<ApiClient["downloadUrl"]>().mockReturnValue("/api/files/7/download"),
  };
  const onChanged = vi.fn<(id: number) => void>();
  const onDeleted = vi.fn<(id: number) => void>();
  const user = userEvent.setup();
  mount(<FileDetail fileId={7} onChanged={onChanged} onDeleted={onDeleted} />, client);
  await screen.findByText("a.csv");
  await user.click(screen.getByRole("button", { name: "Run processor" }));
  await waitFor(() => expect(onChanged).toHaveBeenCalledWith(7));
  expect(client.processFile).toHaveBeenCalledWith(7, undefined);
  await user.click(screen.getByRole("button", { name: "Delete file" }));
  await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(7));
  expect(client.deleteFile).toHaveBeenCalledWith(7);
});

it("renders domain results through an injected view", () => {
  function CustomView({ result }: { result: JsonValue | null }) {
    return <p>Records: {String((result as { count: number }).count)}</p>;
  }
  render(<ResultViewer processor="custom" result={{ count: 4 }} renderers={{ custom: CustomView }} />);
  expect(screen.getByText("Records: 4")).toBeTruthy();
});

it("validates model JSON locally and displays backend errors", async () => {
  const user = userEvent.setup();
  const client = {
    modelInfo: vi.fn<ApiClient["modelInfo"]>().mockResolvedValue({ model: "custom", model_path: "", model_file_present: false }),
    predict: vi.fn<ApiClient["predict"]>().mockRejectedValue(new Error("Model rejected input")),
  };
  mount(<InferencePanel />, client);
  await user.clear(screen.getByLabelText("JSON input"));
  await user.paste("[]");
  await user.click(screen.getByRole("button", { name: "Run prediction" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Enter a JSON object");
  expect(client.predict).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText("JSON input"));
  await user.paste('{"features":[1]}');
  await user.click(screen.getByRole("button", { name: "Run prediction" }));
  await screen.findByText("Model rejected input");
});
