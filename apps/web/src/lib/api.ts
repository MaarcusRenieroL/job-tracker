export type ApiIssue = {
  path: (string | number)[];
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly issues?: ApiIssue[];

  constructor(
    message: string,
    status: number,
    options?: { code?: string; issues?: ApiIssue[] },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.issues = options?.issues;
  }
}

export async function api<T>(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 65_000;
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError("Request timed out. Please try again.", 408, {
        code: "TIMEOUT",
      });
    }
    throw new ApiError(
      "Could not reach the local server. Check that services are running.",
      0,
      { code: "NETWORK_ERROR" },
    );
  }

  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    code?: string;
    issues?: ApiIssue[];
  } | null;

  if (!response.ok) {
    const issue = data?.issues?.[0];
    throw new ApiError(
      issue
        ? `${issue.path.join(".")}: ${issue.message}`
        : (data?.error ?? "Request failed."),
      response.status,
      { code: data?.code, issues: data?.issues },
    );
  }
  return data as T;
}
