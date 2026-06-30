# Providers

Configurar vía variables de entorno en `.env`.

## AI

| Variable | Valores | Default |
|----------|---------|---------|
| AI_PROVIDER | mock, ollama, openai_compatible | mock |
| OLLAMA_BASE_URL | URL Ollama | http://192.168.2.252:11434 |
| OLLAMA_MODEL | Modelo | llama3 |

## TTS

| Variable | Valores | Default |
|----------|---------|---------|
| TTS_PROVIDER | mock, browser, piper | browser |
| PIPER_BASE_URL | URL Piper | http://piper-tts:10200 |

El frontend usa Web Speech API cuando el modo es **navegador**, o cuando Piper no responde.

### Acceso a Piper en Coolify

| Origen | ¿Funciona? | URL a usar |
|--------|------------|------------|
| Backend TOTA (mismo stack/red Docker) | ✅ | `http://piper-tts:10200` |
| App externa / otro servidor | ✅ | URL pública del proxy |
| IP:puerto directo desde fuera | ❌ | No hay port mapping al host |

**Recomendación TOTA en Coolify:** dejá `PIPER_BASE_URL=http://piper-tts:10200` en el servicio **backend**. En Config → Voz, elegí Piper y dejá el campo URL **vacío** (el backend usa la red interna).

**Tablet/navegador:** si querés que el dispositivo hable directo con Piper (sin pasar por backend), cargá la **URL pública del proxy** en Config → URL de Piper.

## STT

| Variable | Valores | Default |
|----------|---------|---------|
| STT_PROVIDER | mock, whisper | mock |

## Automation

| Variable | Valores | Default |
|----------|---------|---------|
| AUTOMATION_PROVIDER | mock, home_assistant, mqtt, fibaro, akubela, shelly, http_webhook | mock |

Cada acción en la base de datos puede tener su propio `provider` override.

## Activar servicios opcionales

Descomentar bloques en `docker-compose.yml` y configurar URLs correspondientes.
