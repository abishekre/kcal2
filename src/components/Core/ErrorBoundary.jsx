import { Component } from 'react';
import { motion } from 'framer-motion';
import { reportError } from '../../lib/errorReporter';

/**
 * Global error boundary — catches render errors and shows a friendly fallback.
 * Prevents white-screen-of-death from unhandled exceptions.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    reportError(error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#0A0A0C] flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center max-w-sm"
          >
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[24px] flex items-center justify-center mb-6">
              <span className="text-[32px]">😵</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              The app ran into an unexpected error. Your data is safe — just tap below to reload.
            </p>
            <button
              onClick={this.handleReload}
              className="px-8 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-gray-100 active:scale-95 transition-all"
            >
              Reload App
            </button>
            {this.state.error && (
              <details className="mt-6 text-left w-full">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                  Technical details
                </summary>
                <pre className="mt-2 text-red-400/60 text-xs font-mono p-3 bg-red-500/5 rounded-xl overflow-x-auto select-text">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
