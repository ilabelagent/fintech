import { useQuery } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { buildApiError, logClientError } from "@/lib/telemetry";

async function getAuthUser() {
  const token = storage.getToken();
  if (!token) return null;

  const res = await fetch("/api/auth/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    storage.clearToken();
    const error = await buildApiError(res, "Failed to fetch user");
    logClientError(error, { requestId: error.requestId, url: res.url });
    throw error;
  }

  return await res.json();
}

export function useAuth() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getAuthUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
  };
}