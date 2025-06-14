import * as Sentry from "@sentry/react";

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    // Only enable in production
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    // User context
    beforeSend(event, hint) {
      // Add additional context for debugging
      if (event.request) {
        event.tags = {
          ...event.tags,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
        };
      }
      return event;
    },
  });

  console.log(`Sentry initialized for ${import.meta.env.MODE} environment`);
}

export function captureException(error: Error, context?: any) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });
  } else {
    console.error('Error captured:', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: any) {
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setLevel(level as any);
      if (context?.tags) scope.setTags(context.tags);
      if (context?.extra) scope.setExtras(context.extra);
      if (context?.user) scope.setUser(context.user);
      Sentry.captureMessage(message);
    });
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

export function setUserContext(user: { id: string; email?: string; firstName?: string; lastName?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
  });
}

export function addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    timestamp: Date.now() / 1000,
  });
}

export { Sentry };