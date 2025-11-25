export type TelemetryEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export type ErrorContext = {
  requestId?: string;
  status?: number;
  url?: string;
  location?: string;
  metadata?: Record<string, unknown>;
};

const ANALYTICS_ENDPOINT =
  import.meta.env.VITE_ANALYTICS_ENDPOINT || "/api/telemetry/events";
const ERROR_ENDPOINT = import.meta.env.VITE_ERROR_LOG_ENDPOINT || "/api/telemetry/errors";

function sendTelemetry(url: string, payload: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Swallow errors to avoid breaking UX
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[Telemetry] Failed to send", { error, payload });
    }
  }
}

export function trackEvent(event: TelemetryEvent) {
  if (!event.name) return;

  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };

  sendTelemetry(ANALYTICS_ENDPOINT, payload);
}

export function trackPageView(pathname: string) {
  trackEvent({
    name: "page_view",
    properties: { pathname },
  });
}

export class ApiError extends Error {
  requestId?: string;
  status?: number;

  constructor(message: string, options?: { requestId?: string; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.requestId = options?.requestId;
    this.status = options?.status;
  }
}

export function extractRequestId(res: Response) {
  return (
    res.headers.get("x-request-id") ||
    res.headers.get("x-correlation-id") ||
    undefined
  );
}

export async function buildApiError(res: Response, fallbackMessage: string) {
  const text = (await res.text()) || fallbackMessage;
  const requestId = extractRequestId(res);
  return new ApiError(`${res.status}: ${text}`, {
    requestId,
    status: res.status,
  });
}

let handlersAttached = false;

export function logClientError(error: unknown, context?: ErrorContext) {
  const asError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  const payload = {
    message: asError.message,
    stack: asError.stack,
    requestId: (asError as ApiError).requestId || context?.requestId,
    status: (asError as ApiError).status || context?.status,
    url: context?.url,
    location: context?.location || window.location.pathname,
    metadata: context?.metadata,
    timestamp: new Date().toISOString(),
  };

  sendTelemetry(ERROR_ENDPOINT, payload);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("[ClientError]", payload);
  }
}

export function attachGlobalErrorHandlers() {
  if (handlersAttached || typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    logClientError(event.error || event.message, {
      metadata: { source: "window.error" },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logClientError(event.reason, {
      metadata: { source: "unhandledrejection" },
    });
  });

  handlersAttached = true;
}
