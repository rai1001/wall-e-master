const defaultBaseUrl = process.env.CLAWOS_MIDDLEWARE_URL ?? "http://127.0.0.1:4000";
const defaultToken = process.env.CLAWOS_API_TOKEN ?? process.env.API_BEARER_TOKEN ?? "dev-token";

function buildMiddlewareUrl(pathWithQuery: string): string {
  const base = defaultBaseUrl.endsWith("/") ? defaultBaseUrl.slice(0, -1) : defaultBaseUrl;
  return `${base}${pathWithQuery}`;
}

async function fetchMiddleware(pathWithQuery: string): Promise<Response> {
  return fetch(buildMiddlewareUrl(pathWithQuery), {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${defaultToken}`
    }
  });
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

export { fetchMiddleware, serviceUnavailableResponse };
