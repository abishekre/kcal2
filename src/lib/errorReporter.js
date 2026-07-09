// Single seam for wiring up a real error-reporting service (Sentry, etc.)
// later without touching ErrorBoundary itself — call setErrorReporter once
// at app startup. Left unset by default, so errors only go to the console.
let errorReporter = null;

export function setErrorReporter(fn) {
  errorReporter = fn;
}

export function reportError(error, errorInfo) {
  errorReporter?.(error, errorInfo);
}
