# Checklist MVP -> Producción (enfocado a usuario no técnico)

## A. Debe funcionar sí o sí

- [ ] App abre y navega (Inicio/Proyectos/Agentes/Crear Agente/Seguridad)
- [ ] Chat de Control ejecuta comandos con respuesta
- [ ] Modo voz funcional (o fallback claro)
- [ ] Buscar memoria global (Ctrl+K) usable

## B. Integraciones críticas

- [ ] WhatsApp conectado y estable
- [ ] Email test envío/lectura OK
- [ ] Make webhook test OK
- [ ] ChefOs lectura de datos reales OK

## C. Operación

- [ ] Flujo diario (tarde previa + mañana) ejecutable
- [ ] Flujo semanal ejecutable
- [ ] Flujo mensual ejecutable
- [ ] Logs de actividad visibles y comprensibles

## D. Seguridad mínima

- [ ] Acceso protegido (no abierto sin control)
- [ ] Tokens/secretos no expuestos en pantalla
- [ ] Acciones sensibles con confirmación

## E. Salida a producción

Lanzar solo si:
- todos los bloques A, B, C y D están completos,
- existe procedimiento manual de respaldo,
- hay responsable asignado por turno.
