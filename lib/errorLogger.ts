/**
 * Centralized error logging utility for Dream AI
 * In production, this should be connected to an error tracking service like Sentry
 */

const isDev = __DEV__;

/**
 * Log an error with context
 */
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  if (isDev) {
    console.error(`[${context}] Error:`, message);
    if (stack) {
      console.error(stack);
    }
  }

  // TODO: In production, send to error tracking service (Sentry, Bugsnag, etc.)
  // Example:
  // Sentry.captureException(error, { tags: { context } });
}

/**
 * Log a warning with context
 */
export function logWarning(context: string, message: string): void {
  if (isDev) {
    console.warn(`[${context}] Warning:`, message);
  }
}

/**
 * Log debug info (only in development)
 */
export function logDebug(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.log(`[${context}]`, message, data ?? '');
  }
}
