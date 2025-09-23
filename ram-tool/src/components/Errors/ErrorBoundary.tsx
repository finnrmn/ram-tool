import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in component tree", error, info);
  }

  handleReload() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
          <div className="max-w-lg space-y-4 rounded-lg border border-rose-300 bg-white p-6 shadow-lg dark:border-rose-600 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-300">Etwas ist schiefgelaufen.</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Bitte lade die Seite neu. Falls das Problem bestehen bleibt, pruefe die Konsole oder kontaktiere das Team.
              </p>
            </div>
            <pre className="max-h-48 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-400 dark:bg-sky-400 dark:hover:bg-sky-300 dark:text-slate-900"
              onClick={this.handleReload}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
