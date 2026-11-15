import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2">Something went wrong</h2>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            The page encountered an unexpected rendering error. You can reload this view or navigate back to the dashboard.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details className="mt-8 text-left max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-300 font-mono overflow-auto max-h-40">
              <summary className="cursor-pointer text-slate-400 mb-2 font-bold">Error Details</summary>
              {this.state.error.toString()}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
