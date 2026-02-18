const defaultBaseUrl = process.env.CLAWOS_MIDDLEWARE_URL ?? "http://127.0.0.1:4000";
const defaultToken = process.env.CLAWOS_API_TOKEN ?? process.env.API_BEARER_TOKEN ?? "dev-token";

function buildMiddlewareUrl(pathWithQuery: string): string {
  const base = defaultBaseUrl.endsWith("/") ? defaultBaseUrl.slice(0, -1) : defaultBaseUrl;
  return `${base}${pathWithQuery}`;
}

function buildHeaders(input?: HeadersInit): Headers {
  const headers = new Headers(input ?? {});
  headers.set("Authorization", `Bearer ${defaultToken}`);
  return headers;
}

async function requestMiddleware(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  return fetch(buildMiddlewareUrl(pathWithQuery), {
    cache: "no-store",
    ...init,
    headers: buildHeaders(init?.headers)
  });
}

async function fetchMiddleware(pathWithQuery: string): Promise<Response> {
  return requestMiddleware(pathWithQuery, { method: "GET" });
}

function serviceUnavailableResponse() {
  return {
    error: {
      code: "middleware_unavailable",
      message: "No se pudo conectar con el middleware local",
      details: {
        recovery_action: "Verifica que el middleware este ejecutandose en tu PC y vuelve a intentar."
      }
    }
  };
}

export { fetchMiddleware, requestMiddleware, serviceUnavailableResponse };
