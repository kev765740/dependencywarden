import * as Sentry from "@sentry/node";

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      ...Sentry.getDefaultIntegrations({}),
    ],
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.npm_package_version || '1.0.0',
    // User context
    beforeSend(event, hint) {
      // Add additional context for debugging
      if (event.request) {
        event.tags = {
          ...event.tags,
          endpoint: event.request.url,
          method: event.request.method,
        };
      }
      return event;
    },
  });

  console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);
}

export function captureException(error: Error, context?: any) {
  if (process.env.NODE_ENV === 'production') {
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
  if (process.env.NODE_ENV === 'production') {
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

export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
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