/**
 * NEXORA API Client Layer - Core HTTP Client
 * Connects frontend to the FastAPI Building Intelligence backend.
 * Uses NEXT_PUBLIC_API_URL environment variable with fallback to http://localhost:8000.
 * Strictly adheres to NEXORA Evidence Discipline.
 */

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  components: Record<string, string>;
  active_scenario: string;
  evidence: "SIMULATED" | "MEASURED" | "ASSUMED";
}

/**
 * Universal JSON fetch helper for FastAPI backend endpoints.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (options?.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      let data: any;
      try {
        data = await res.json();
        if (data?.detail) {
          errorDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
      } catch {
        // Fallback to status text
      }
      throw new ApiError(errorDetail, res.status, data);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network / connection refused error
    throw new ApiError(
      err?.message?.includes("fetch") || err?.name === "TypeError"
        ? "Backend unavailable. Ensure the FastAPI service is running."
        : err?.message || "Unknown API communication failure.",
      0
    );
  }
}

/**
 * Health check: GET /health
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
