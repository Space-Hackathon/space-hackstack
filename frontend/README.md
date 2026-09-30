# Reusable frontend

React, TypeScript, Vite, and Tailwind CSS v4. Node 22.12+ is recommended.

Run npm ci, copy .env.example to .env, then npm run dev.
Set VITE_API_URL to the complete API base including its prefix (default http://localhost:8000/api).
Start one backend separately from its backend directory.
Run npm run typecheck for strict TypeScript checking, npm test for UI/client tests, and npm run build for a production build.

Wrap your application in ApiProvider (src/api/ApiProvider.tsx). You can pass baseUrl or inject an ApiClient
for tests and alternative transports. Import independent components from src/components/index.ts:
HealthStatus, FileUploader, ProcessorSelect, FileTable, FileDetail, ResultViewer, InferencePanel, AsyncState.
The demonstration App composes them; application features need not depend on App.

FileUploader emits onUploaded(record). FileTable emits onSelect(id), supports pageSize (1–200),
and refreshes when its revision prop changes. FileDetail emits onChanged(id) and onDeleted(id).
Mount it with key={fileId} to reset action state when selecting another file.
Pass renderers={{ processorName: YourComponent }} to FileDetail/ResultViewer for domain views.
Renderers receive a typed result. Unknown results fall back to readable JSON.
InferencePanel accepts initialPayload; its JSON editor works with any model payload.
useResource wraps cancellable reads with loading/error/data/refresh state.
The API client handles multipart, JSON, validation errors, cancellation, and 204 responses.
Uploads are not restricted to known extensions: unknown types can be stored without processing.

Tailwind v4 is loaded through its Vite plugin. The default model is a demo mean calculator, not trained inference.
