# Conectar WhatsApp, Email, Make y ChefOs (guía simple)

## Objetivo
Dejar los 4 canales en verde para operación diaria del hotel.

## Orden recomendado
1. WhatsApp
2. Email
3. Make
4. ChefOs

## 1) WhatsApp

- Ve a **Seguridad** (o módulo de estado si está visible ahí).
- Comprueba que aparezca **connected**.
- Si aparece disconnected, espera reconexión automática o reinicia el gateway.

✅ Hecho cuando: el estado queda estable en connected.

## 2) Email

- Ejecuta prueba de envío (correo interno de prueba).
- Ejecuta prueba de lectura (si aplica IMAP).
- Verifica que aparezca confirmación en logs/actividad.

✅ Hecho cuando: enviar y recibir de prueba funcionan.

## 3) Make

- Usa endpoint/webhook de test.
- Lanza ping de validación.
- Revisa en Make que entra el evento.

✅ Hecho cuando: evento de prueba recibido correctamente en Make.

## 4) ChefOs

- Define la fuente de datos (API, export o DB).
- Haz una lectura mínima (ej. turnos del día).
- Confirma que los datos son los esperados.

✅ Hecho cuando: ClawOS lee datos de ChefOs sin intervención manual.

## Criterio final de conexión

Todo está listo si puedes responder **sí** a estas 4 preguntas:
- ¿WhatsApp conectado?
- ¿Email test OK?
- ¿Make recibe webhook de prueba?
- ¿ChefOs entrega datos reales?

Si cualquiera es "no", no pasar a producción.
