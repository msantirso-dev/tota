# Arquitectura TOTA AAC

## Capas

1. **Presentación (Frontend):** React SPA servida por Nginx. TTS principal vía Web Speech API del navegador.
2. **API (Backend):** FastAPI con routers modulares, autenticación JWT, y providers intercambiables.
3. **Datos:** PostgreSQL para persistencia, Redis para cache/eventos futuros.
4. **Servicios opcionales:** MinIO, MQTT, Ollama, Piper, Whisper.

## Flujo AAC

```
Usuario toca botones → tokens en barra superior → buildPhrase()
    → sugerencias (reglas/IA) → Hablar (browser TTS) → historial
```

## Seguridad

- JWT en header Authorization
- Roles con middleware `require_roles`
- Acciones domóticas y emergencia requieren `confirmed: true`
- IA solo sugiere, no ejecuta

## Modelo de datos

Ver seed en `backend/app/seed.py` para categorías y vocabulario inicial.

Tablas: users, profiles, boards, categories, buttons, button_actions, phrases, usage_history, ai_suggestions, automation_actions, emergency_contacts, settings.
