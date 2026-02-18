import { Router } from "express";

import { buildErrorResponse } from "../services/observability";

type IntegrationId = "whatsapp_gateway" | "email" | "make" | "chefos";
type IntegrationStatus = "connected" | "review" | "disconnected";

interface IntegrationConfig {
  id: IntegrationId;
  label: string;
  requiredEnvKeys: string[];
  setupHint: string;
}

interface IntegrationRow {
  id: IntegrationId;
  label: string;
  status: IntegrationStatus;
  mock_ready: boolean;
  last_checked_at: string;
  message: string;
}

const integrationsRouter = Router();

const integrationCatalog: IntegrationConfig[] = [
  {
    id: "whatsapp_gateway",
    label: "WhatsApp gateway",
    requiredEnvKeys: ["WHATSAPP_GATEWAY_URL", "WHATSAPP_GATEWAY_TOKEN"],
    setupHint: "Define WHATSAPP_GATEWAY_URL y WHATSAPP_GATEWAY_TOKEN."
  },
  {
    id: "email",
    label: "Email",
    requiredEnvKeys: ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
    setupHint: "Define SMTP_HOST, SMTP_USER y SMTP_PASSWORD."
  },
  {
    id: "make",
    label: "Make",
    requiredEnvKeys: ["MAKE_WEBHOOK_URL"],
    setupHint: "Define MAKE_WEBHOOK_URL para activar automatizaciones."
  },
  {
    id: "chefos",
    label: "ChefOs",
    requiredEnvKeys: ["CHEFOS_API_URL", "CHEFOS_API_KEY"],
    setupHint: "Define CHEFOS_API_URL y CHEFOS_API_KEY."
  }
];

function resolveIntegration(config: IntegrationConfig, checkedAt: string): IntegrationRow {
  const filledKeys = config.requiredEnvKeys.filter((key) => Boolean(process.env[key]?.trim()));
  const missing = config.requiredEnvKeys.filter((key) => !filledKeys.includes(key));

  if (missing.length === 0) {
    return {
      id: config.id,
      label: config.label,
      status: "connected",
      mock_ready: false,
      last_checked_at: checkedAt,
      message: "Conexion detectada y lista para operacion."
    };
  }

  if (filledKeys.length > 0) {
    return {
      id: config.id,
      label: config.label,
      status: "review",
      mock_ready: true,
      last_checked_at: checkedAt,
      message: `Falta completar configuracion. ${config.setupHint}`
    };
  }

  return {
    id: config.id,
    label: config.label,
    status: "disconnected",
    mock_ready: true,
    last_checked_at: checkedAt,
    message: `Modo mock-ready activo. ${config.setupHint}`
  };
}

function resolveAllIntegrations(): IntegrationRow[] {
  const checkedAt = new Date().toISOString();
  return integrationCatalog.map((integration) => resolveIntegration(integration, checkedAt));
}

function buildResultMessage(integration: IntegrationRow): string {
  if (integration.status === "connected") {
    return "Prueba correcta. Listo para operacion.";
  }

  if (integration.status === "review") {
    return "Revisar configuracion antes de operar. Modo mock-ready disponible.";
  }

  return "Sin credenciales reales. Modo mock-ready activo sin bloquear la interfaz.";
}

integrationsRouter.get("/status", (_req, res) => {
  const integrations = resolveAllIntegrations();
  return res.status(200).json({
    generated_at: new Date().toISOString(),
    integrations
  });
});

integrationsRouter.post("/test", (req, res) => {
  const integrationId = typeof req.body?.integration_id === "string" ? req.body.integration_id.trim() : "";
  if (!integrationId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "integration_id es obligatorio", {
        recovery_action: "Selecciona el servicio y vuelve a pulsar Probar."
      })
    );
  }

  const integrations = resolveAllIntegrations();
  const integration = integrations.find((item) => item.id === integrationId);
  if (!integration) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "integration_id no es valido", {
        recovery_action: "Usa uno de estos servicios: whatsapp_gateway, email, make o chefos."
      })
    );
  }

  return res.status(200).json({
    integration: {
      id: integration.id,
      status: integration.status,
      checked_at: new Date().toISOString(),
      result: buildResultMessage(integration)
    }
  });
});

export { integrationsRouter };
