import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/Errors/ErrorBoundary";
import { ThemeProvider } from "./theme/useTheme";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element with id 'root' not found.");
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
