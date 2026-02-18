"use client";

import { useMemo, useState } from "react";

type PresetKey = "investigador" | "programador" | "creativo";

interface Preset {
  label: string;
  role: string;
  voiceId: string;
  defaultSkills: string[];
}

interface SpawnResponse {
  agent: {
    id: string;
    name: string;
    status: string;
  };
}

const presets: Record<PresetKey, Preset> = {
  investigador: {
    label: "Investigador",
    role: "Investigador Ciberseguridad",
    voiceId: "voice_researcher",
    defaultSkills: ["browser"]
  },
  programador: {
    label: "Programador",
    role: "Programador Full Stack",
    voiceId: "voice_coder",
    defaultSkills: ["terminal", "python"]
  },
  creativo: {
    label: "Creativo",
    role: "Estratega Creativo",
    voiceId: "voice_creative",
    defaultSkills: ["browser"]
  }
};

function buildSkillSet(currentPreset: Preset, enabled: { browser: boolean; terminal: boolean; python: boolean }): string[] {
  const list = new Set<string>();

  for (const skill of currentPreset.defaultSkills) {
    list.add(skill);
  }

  if (enabled.browser) {
    list.add("browser");
  }
  if (enabled.terminal) {
    list.add("terminal");
  }
  if (enabled.python) {
    list.add("python");
  }

  return Array.from(list);
}

export default function AgentWizardPage() {
  const [name, setName] = useState("");
  const [presetKey, setPresetKey] = useState<PresetKey>("investigador");
  const [allowGlobalMemory, setAllowGlobalMemory] = useState(false);
  const [skills, setSkills] = useState({
    browser: true,
    terminal: false,
    python: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const preset = useMemo(() => presets[presetKey], [presetKey]);

  const toggleSkill = (key: "browser" | "terminal" | "python", checked: boolean) => {
    setSkills((prev) => ({ ...prev, [key]: checked }));
  };

  const onCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Necesitamos un nombre para crear el agente.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      name: trimmedName,
      role: preset.role,
      personality_template: presetKey,
      voice_id: preset.voiceId,
      skills: buildSkillSet(preset, skills),
      memory_access: allowGlobalMemory ? "global" : "private"
    };

    try {
      const response = await fetch("/api/agents/spawn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as Partial<SpawnResponse> & { error?: { message?: string } };
      if (!response.ok) {
        setError(body.error?.message ?? "No se pudo crear el agente.");
        setLoading(false);
        return;
      }

      setSuccess(`Agente creado: ${body.agent?.name ?? trimmedName}`);
    } catch {
      setError("No se pudo conectar con el middleware para crear el agente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid">
      <article className="card">
        <h2>Crear Agente</h2>
        <p className="muted">Asistente guiado para crear un sub-agente en menos de un minuto.</p>

        <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
          <label htmlFor="agent-name">Nombre del agente</label>
          <input
            id="agent-name"
            aria-label="Nombre del agente"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ejemplo: Lince"
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #d1d5db" }}
          />

          <label htmlFor="agent-preset">Plantilla</label>
          <select
            id="agent-preset"
            aria-label="Plantilla"
            value={presetKey}
            onChange={(event) => setPresetKey(event.target.value as PresetKey)}
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #d1d5db" }}
          >
            <option value="investigador">{presets.investigador.label}</option>
            <option value="programador">{presets.programador.label}</option>
            <option value="creativo">{presets.creativo.label}</option>
          </select>

          <p className="muted">
            Rol sugerido: <strong>{preset.role}</strong>
          </p>
        </div>
      </article>

      <article className="card">
        <h2>Permisos</h2>
        <p className="muted">Activa solo lo necesario para mantener control y seguridad.</p>

        <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
          <label>
            <input
              type="checkbox"
              aria-label="Habilitar Browser"
              checked={skills.browser}
              onChange={(event) => toggleSkill("browser", event.target.checked)}
            />{" "}
            Habilitar Browser
          </label>
          <label>
            <input
              type="checkbox"
              aria-label="Habilitar Terminal"
              checked={skills.terminal}
              onChange={(event) => toggleSkill("terminal", event.target.checked)}
            />{" "}
            Habilitar Terminal
          </label>
          <label>
            <input
              type="checkbox"
              aria-label="Habilitar Python"
              checked={skills.python}
              onChange={(event) => toggleSkill("python", event.target.checked)}
            />{" "}
            Habilitar Python
          </label>
          <label>
            <input
              type="checkbox"
              aria-label="Permitir memoria global"
              checked={allowGlobalMemory}
              onChange={(event) => setAllowGlobalMemory(event.target.checked)}
            />{" "}
            Permitir memoria global (avanzado)
          </label>
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="button" onClick={onCreate} disabled={loading}>
            {loading ? "Creando..." : "Crear agente"}
          </button>
          <span className="muted">Modo seguro activo por defecto.</span>
        </div>

        {error ? (
          <p className="muted" style={{ marginTop: "8px" }}>
            {error}
          </p>
        ) : null}
        {success ? (
          <>
            <p style={{ marginTop: "8px", fontWeight: 700 }}>{success}</p>
            <p className="muted">Listo para usar en tus proyectos.</p>
          </>
        ) : null}
      </article>
    </section>
  );
}
