"use client";

import { useMemo, useState } from "react";

const steps = [
  { id: 1, button: "Conectar cerebro local", done: "Conexion local verificada" },
  { id: 2, button: "Crear mi primer agente", done: "Agente inicial preparado" },
  { id: 3, button: "Enviar primer comando", done: "Primer comando enviado" }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState<string[]>([]);

  const active = useMemo(() => steps.find((item) => item.id === currentStep), [currentStep]);

  const onAdvance = () => {
    if (!active) {
      return;
    }

    setCompleted((prev) => [...prev, active.done]);
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(4);
    }
  };

  const isDone = currentStep > steps.length;

  return (
    <section className="grid">
      <article className="card">
        <h2>Bienvenido a ClawOS</h2>
        <p className="muted">Configuracion guiada para empezar sin tecnicismos.</p>

        {!isDone && active ? (
          <>
            <p style={{ marginTop: "12px", fontWeight: 600 }}>
              Paso {active.id} de {steps.length}
            </p>
            <button type="button" onClick={onAdvance}>
              {active.button}
            </button>
          </>
        ) : (
          <p style={{ marginTop: "12px", fontWeight: 700 }}>Onboarding completado</p>
        )}
      </article>

      <article className="card">
        <h2>Progreso</h2>
        <ul>
          {completed.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
