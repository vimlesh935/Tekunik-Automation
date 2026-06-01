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
    // Output precise debug info to console for identifying the crashing component
    console.group("%c 🚨 REACT RENDER CRASH ", "background: #ff0000; color: #fff; font-weight: bold; padding: 4px;");
    console.error("Error Message:", error);
    console.error("Component Stack Trace:", errorInfo.componentStack);
    console.groupEnd();
  }

  render() {
    return this.props.children;
  }
}