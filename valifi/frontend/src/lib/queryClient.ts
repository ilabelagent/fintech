import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiError, buildApiError, logClientError } from "./telemetry";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = await buildApiError(res, res.statusText);

    if (import.meta.env.DEV) {
      console.error(`[API Error] ${res.status} ${res.url}`, {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        response: error.message,
        requestId: error.requestId,
      });
    }

    logClientError(error, {
      requestId: error.requestId,
      status: error.status,
      url: res.url,
      location: window.location.pathname,
    });

    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        const requestId = error instanceof ApiError ? error.requestId : undefined;
        logClientError(error, { requestId, metadata: { source: "mutation" } });
      },
    },
  },
});
