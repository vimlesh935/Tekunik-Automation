import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group(
      "%c 🚨 REACT RENDER CRASH - FULL DEBUG INFO ",
      "background: #ff0000; color: #fff; font-weight: bold; padding: 8px; font-size: 16px;",
    );

    console.error("=== ERROR DETAILS ===");
    console.error("Error Message:", error?.message);
    console.error("Error Name:", error?.name);
    console.error("Error Type:", typeof error);
    console.error("Error Constructor:", error?.constructor?.name);

    console.error("\n=== STACK TRACE ===");
    console.error(error?.stack);

    console.error("\n=== COMPONENT STACK ===");
    console.error(errorInfo?.componentStack);

    console.error("\n=== FULL ERROR OBJECT ===");
    console.error(error);

    console.error("\n=== ERROR INFO OBJECT ===");
    console.error(errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const errorString = error?.toString?.() || String(error);
      const stack = error?.stack || "No stack trace available";

      return (
        <div className="min-h-screen bg-red-950 text-red-100 flex items-center justify-center px-4 py-8 font-mono text-sm">
          <div className="max-w-4xl w-full bg-red-900/20 border-2 border-red-700 rounded-lg p-6 overflow-auto max-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-red-300">
              ⚠️ REACT CRASH DEBUG MODE
            </h1>

            <div className="space-y-6">
              <div className="bg-red-950/40 border border-red-700/50 rounded p-4">
                <h2 className="text-red-400 font-bold mb-2">ERROR MESSAGE:</h2>
                <p className="text-red-200 break-words whitespace-pre-wrap">
                  {errorString}
                </p>
              </div>

              <div className="bg-red-950/40 border border-red-700/50 rounded p-4">
                <h2 className="text-red-400 font-bold mb-2">STACK TRACE:</h2>
                <pre className="text-red-200 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
                  {stack}
                </pre>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-700/50 rounded p-4">
                <h2 className="text-yellow-400 font-bold mb-2">
                  KEY INFORMATION:
                </h2>
                <ul className="text-yellow-200 space-y-1 text-xs">
                  <li>
                    📄 <strong>Error Type:</strong> {error?.name || "Unknown"}
                  </li>
                  <li>
                    🔍 <strong>Error Constructor:</strong>{" "}
                    {error?.constructor?.name || "Unknown"}
                  </li>
                  <li>
                    ⏱️ <strong>Timestamp:</strong> {new Date().toLocaleString()}
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded transition"
              >
                Go Home
              </button>
            </div>

            <p className="mt-6 text-xs text-red-300/60 border-t border-red-700/30 pt-4">
              ℹ️ This debug view is temporarily enabled. Check browser console
              (F12) for more details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
