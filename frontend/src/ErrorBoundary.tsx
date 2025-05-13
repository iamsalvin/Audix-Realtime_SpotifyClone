import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            margin: "20px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ color: "#d32f2f" }}>Something went wrong</h2>
          <details style={{ whiteSpace: "pre-wrap", margin: "20px 0" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
              Show Error Details
            </summary>
            <p>{this.state.error?.toString()}</p>
            <p>{this.state.errorInfo?.componentStack}</p>
          </details>
          <button
            style={{
              backgroundColor: "#2196f3",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
