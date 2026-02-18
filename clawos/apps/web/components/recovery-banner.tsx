interface RecoveryBannerProps {
  message?: string;
}

export function RecoveryBanner({ message }: RecoveryBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <aside
      className="card"
      style={{ borderColor: "#f59e0b", background: "#fffbeb" }}
      aria-live="polite"
    >
      <h2>Necesitas ayuda</h2>
      <p className="muted">{message}</p>
      <button type="button">Reintentar paso</button>
    </aside>
  );
}
