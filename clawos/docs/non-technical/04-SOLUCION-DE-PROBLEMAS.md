# Solución de problemas (rápido)

## 1) No carga la app

- Verifica URL: `http://localhost:3100/`
- Si no abre, reinicia app/backend.

## 2) WhatsApp desconectado

- Espera reconexión automática 10-30 s.
- Si persiste, reinicia gateway.
- Revalida estado connected.

## 3) Comando no responde

- Reintenta desde "Chat de Control".
- Prueba comando más corto.
- Revisa en Seguridad si hay alerta de backend.

## 4) Modo voz no funciona

- Revisa permisos de micrófono.
- Reinicia modo voz.
- Si falla, usa entrada por texto como fallback.

## 5) Make no recibe eventos

- Verifica webhook correcto.
- Lanza ping de prueba.
- Revisa historial de ejecuciones en Make.

## 6) ChefOs sin datos

- Verifica credenciales/fuente.
- Ejecuta lectura simple (turno de hoy).
- Si falla, usar backup manual del día.

## Escalada recomendada

Si una incidencia dura más de 15 min:
1. dejar constancia del fallo,
2. activar procedimiento manual,
3. notificar responsables por WA/email.
