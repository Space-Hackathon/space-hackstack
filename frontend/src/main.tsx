import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApiProvider } from "./api/ApiProvider";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element was not found");

createRoot(rootElement).render(
  <StrictMode>
    <ApiProvider><App /></ApiProvider>
  </StrictMode>,
);
