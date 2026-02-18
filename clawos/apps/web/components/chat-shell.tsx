export function ChatShell() {
  return (
    <section className="card">
      <h2>Chat de Control</h2>
      <p className="muted">Escribe una orden simple. Ejemplo: "Lince, revisa el estado del proyecto".</p>
      <div
        style={{
          marginTop: "12px",
          padding: "12px",
          borderRadius: "10px",
          border: "1px dashed #9ca3af",
          background: "#f9fafb"
        }}
      >
        <strong>Estado:</strong> Esperando comando.
      </div>
    </section>
  );
}
