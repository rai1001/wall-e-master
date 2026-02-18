import { Router } from "express";

type CheckStatus = "pass" | "warn";
type RemoteProvider = "none" | "tailscale" | "cloudflare";

interface SecurityCheck {
  id: string;
  status: CheckStatus;
  message: string;
  recovery_action: string;
}

const securityRouter = Router();

function parseProvider(raw: string | undefined): RemoteProvider {
  if (raw === "tailscale" || raw === "cloudflare") {
    return raw;
  }

  return "none";
}

function isLocalOpenClawUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost" || parsed.hostname === "::1";
  } catch {
    return false;
  }
}

function isSecureHttpsUrl(rawUrl: string): boolean {
  if (!rawUrl.trim()) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function createCheck(id: string, status: CheckStatus, message: string, recoveryAction: string): SecurityCheck {
  return {
    id,
    status,
    message,
    recovery_action: recoveryAction
  };
}

securityRouter.get("/checklist", (_req, res) => {
  const apiToken = process.env.API_BEARER_TOKEN ?? "dev-token";
  const openClawWsUrl = process.env.OPENCLAW_WS_URL ?? "ws://127.0.0.1:18789";
  const remoteProvider = parseProvider(process.env.REMOTE_ACCESS_PROVIDER);
  const tailscaleUrl = process.env.TAILSCALE_FUNNEL_URL ?? "";
  const cloudflareUrl = process.env.CLOUDFLARE_TUNNEL_URL ?? "";
  const sttProvider = process.env.STT_PROVIDER ?? "mock";
  const ttsProvider = process.env.TTS_PROVIDER ?? "mock";
  const rateLimitMax = Number(process.env.API_RATE_LIMIT_MAX ?? 60);
  const rateLimitWindowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 60000);

  const remoteUrl = remoteProvider === "tailscale" ? tailscaleUrl : remoteProvider === "cloudflare" ? cloudflareUrl : "";
  const checks: SecurityCheck[] = [];

  checks.push(
    apiToken !== "dev-token"
      ? createCheck(
          "auth_token_not_default",
          "pass",
          "Token API personalizado activo.",
          "Mantener rotacion periodica de API_BEARER_TOKEN."
        )
      : createCheck(
          "auth_token_not_default",
          "warn",
          "Se esta usando token por defecto (dev-token).",
          "Define API_BEARER_TOKEN con un valor fuerte y vuelve a iniciar middleware."
        )
  );

  checks.push(
    isLocalOpenClawUrl(openClawWsUrl)
      ? createCheck(
          "openclaw_local_only",
          "pass",
          "OpenClaw sigue en red local privada.",
          "Mantener OPENCLAW_WS_URL en localhost o 127.0.0.1."
        )
      : createCheck(
          "openclaw_local_only",
          "warn",
          "OpenClaw parece expuesto fuera de localhost.",
          "Configura OPENCLAW_WS_URL como ws://127.0.0.1:18789 y no expongas el daemon a internet."
        )
  );

  checks.push(
    remoteProvider !== "none"
      ? createCheck(
          "remote_provider_configured",
          "pass",
          `Proveedor remoto activo: ${remoteProvider}.`,
          "Mantener solo middleware expuesto por tunnel y no el puerto del daemon."
        )
      : createCheck(
          "remote_provider_configured",
          "warn",
          "No hay proveedor remoto configurado.",
          "Configura REMOTE_ACCESS_PROVIDER=tailscale o cloudflare para acceso fuera de casa."
        )
  );

  if (remoteProvider === "none") {
    checks.push(
      createCheck(
        "remote_url_secure",
        "warn",
        "No hay URL publica segura configurada.",
        "Define TAILSCALE_FUNNEL_URL o CLOUDFLARE_TUNNEL_URL segun el proveedor seleccionado."
      )
    );
  } else {
    checks.push(
      isSecureHttpsUrl(remoteUrl)
        ? createCheck(
            "remote_url_secure",
            "pass",
            "URL remota segura (HTTPS) detectada.",
            "Verificar periodicamente certificados y politica de acceso."
          )
        : createCheck(
            "remote_url_secure",
            "warn",
            "La URL remota no es HTTPS o no existe.",
            remoteProvider === "tailscale"
              ? "Define TAILSCALE_FUNNEL_URL con formato https://<tu-host>.ts.net."
              : "Define CLOUDFLARE_TUNNEL_URL con formato https://<tu-dominio>."
          )
    );
  }

  const voiceConfigurationReady =
    (sttProvider !== "openai" || Boolean(process.env.OPENAI_API_KEY?.trim())) &&
    (ttsProvider !== "elevenlabs" || Boolean(process.env.ELEVENLABS_API_KEY?.trim()));
  checks.push(
    voiceConfigurationReady
      ? createCheck(
          "voice_keys_ready",
          "pass",
          "Claves de voz disponibles para proveedores activos.",
          "Rotar claves OPENAI_API_KEY y ELEVENLABS_API_KEY segun politica."
        )
      : createCheck(
          "voice_keys_ready",
          "warn",
          "Faltan claves para los proveedores de voz configurados.",
          "Si STT_PROVIDER=openai define OPENAI_API_KEY y si TTS_PROVIDER=elevenlabs define ELEVENLABS_API_KEY."
        )
  );

  const rateLimitConfigured =
    Number.isFinite(rateLimitMax) && rateLimitMax > 0 && Number.isFinite(rateLimitWindowMs) && rateLimitWindowMs > 0;
  checks.push(
    rateLimitConfigured
      ? createCheck(
          "api_rate_limit_configured",
          "pass",
          "Rate limit activo para la API.",
          "Mantener API_RATE_LIMIT_MAX y API_RATE_LIMIT_WINDOW_MS acorde al uso real."
        )
      : createCheck(
          "api_rate_limit_configured",
          "warn",
          "Rate limit desactivado o mal configurado.",
          "Define API_RATE_LIMIT_MAX y API_RATE_LIMIT_WINDOW_MS con valores positivos."
        )
  );

  const hasWarnings = checks.some((check) => check.status === "warn");

  res.status(200).json({
    generated_at: new Date().toISOString(),
    remote_access: {
      provider: remoteProvider,
      public_url: remoteUrl || undefined
    },
    checks,
    helper_commands: {
      tailscale: [
        "tailscale up",
        "tailscale funnel 3000",
        "tailscale funnel status",
        "tailscale status"
      ],
      cloudflare: [
        "cloudflared tunnel --url http://127.0.0.1:3000",
        "cloudflared tunnel list",
        "cloudflared tunnel info <TUNNEL_NAME>"
      ]
    },
    overall_status: hasWarnings ? "review_required" : "ready_for_remote_access"
  });
});

export { securityRouter };
