# Providers

Configurar vía variables de entorno en `.env`.

## AI

| Variable | Valores | Default |
|----------|---------|---------|
| AI_PROVIDER | mock, ollama, openai_compatible | mock |

## TTS

| Variable | Valores | Default |
|----------|---------|---------|
| TTS_PROVIDER | mock, browser, piper | browser |

El frontend usa Web Speech API cuando `use_browser: true`.

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
