import { Component, type ErrorInfo, type ReactNode } from "react";
import { SystemScreen } from "./system-screen";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unable to render workspace", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <SystemScreen
          title="We couldn’t open this page"
          description="Something interrupted the workspace. Try loading the page again."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
