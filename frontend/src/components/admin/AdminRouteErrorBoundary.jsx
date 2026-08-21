import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

function ErrorView({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-5" role="alert">
      <div className="w-16 h-16 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        <AlertTriangle size={28} />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-lg">Unable to load this page</p>
        <p className="text-gray-500 text-xs mt-2 max-w-sm">
          A required part of this section failed to load. This is usually
          temporary — please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition text-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]"
      >
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );
}

/**
 * Error boundary for dynamically imported Admin pages. If a lazy chunk fails
 * to load (offline, bad build, chunk dropped after deploy), the Admin shell
 * stays visible and this shows a friendly error with a Retry action instead
 * of a blank screen.
 */
export default class AdminRouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("[Admin] Route chunk failed to load:", error?.message || error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    // The failing dynamic import is cached by React after a reject, so a full
    // reload is the reliable way to re-attempt fetching the chunk assets.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}