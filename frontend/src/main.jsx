import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[Tek Node] Root element not found!");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <App />
        </Router>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
