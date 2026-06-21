# TOTA AAC

Plataforma web de Comunicación Aumentativa y Alternativa (AAC) con arquitectura modular, preparada para despliegue en Coolify.

**Dominio de producción:** https://tota.pit.com.ar

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | FastAPI + Python |
| Base de datos | PostgreSQL |
| Cache/eventos | Redis |
| Contenedores | Docker + docker-compose |
| Deploy | Coolify |

## Estructura del proyecto

```
/frontend          → SPA React (puerto 80 en contenedor)
/backend           → API FastAPI (puerto 8000)
/docker            → Configuraciones auxiliares
/docs              → Documentación adicional
/docker-compose.yml
/.env.example
```

## Arquitectura

```
┌─────────────┐     /api/*      ┌─────────────┐
│   Frontend  │ ──────────────► │   Backend   │
│  (Nginx:80) │                 │ (FastAPI)   │
└─────────────┘                 └──────┬──────┘
                                       │
                         ┌─────────────┼─────────────┐
                         ▼             ▼             ▼
                    PostgreSQL      Redis      Providers
                                                  ├── AI (mock/ollama/openai)
                                                  ├── TTS (browser/piper)
                                                  ├── STT (mock/whisper)
                                                  └── Automation (mock/HA/MQTT/...)
```

### Providers modulares

El backend usa un patrón factory para intercambiar proveedores vía variables de entorno:

- **AIProvider:** MockProvider, OllamaProvider, OpenAICompatibleProvider
- **TTSProvider:** Browser (frontend), PiperProvider, MockTTSProvider
- **STTProvider:** WhisperProvider, MockSTTProvider
- **AutomationProvider:** HomeAssistant, MQTT, Fibaro, Akubela, Shelly, HTTP Webhook, Mock

> La IA y las acciones críticas **nunca se ejecutan automáticamente** — siempre requieren confirmación humana.

## Inicio rápido (local con Docker)

```bash
cp .env.example .env
# Editar .env con contraseñas seguras

docker compose up -d --build
```

Acceder a:
- **App:** http://localhost
- **API docs:** http://localhost/api/docs (vía proxy nginx) — o directamente al backend si se expone

### Usuarios de prueba (seed automático)

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@tota.pit.com.ar | admin123 | admin |
| usuario@tota.pit.com.ar | usuario123 | usuario |
| tato@tota.pit.com.ar | tato | usuario |

## Desarrollo local sin Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configurar DATABASE_URL y REDIS_URL apuntando a servicios locales
export DATABASE_URL=postgresql://tota:change_me@localhost:5432/tota
export REDIS_URL=redis://localhost:6379/0
export JWT_SECRET=dev_secret
export FRONTEND_URL=http://localhost:5173

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El proxy de Vite redirige `/api` al backend en `localhost:8000`.

## Despliegue en Coolify

1. Crear un nuevo proyecto en Coolify apuntando a este repositorio.
2. Seleccionar **Docker Compose** como método de deploy.
3. Configurar el dominio: `tota.pit.com.ar`
4. Copiar variables de `.env.example` al panel de Coolify y cambiar:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `FRONTEND_URL=https://tota.pit.com.ar`
   - `API_URL=https://tota.pit.com.ar/api`
5. Coolify gestionará el proxy inverso (Traefik/Caddy) hacia el servicio `frontend` en puerto 80.
6. El frontend hace proxy de `/api/*` al backend interno.

### Healthchecks

- Frontend: `GET /health`
- Backend: `GET /health`
- PostgreSQL: `pg_isready`
- Redis: `PING`

## API REST

Documentación Swagger disponible en `/api/docs`.

Endpoints principales:

| Módulo | Prefijo |
|--------|---------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Profiles | `/api/profiles` |
| Boards | `/api/boards` |
| Categories | `/api/categories` |
| Buttons | `/api/buttons` |
| Phrases | `/api/phrases` |
| History | `/api/history` |
| Suggestions | `/api/suggestions` |
| Automation | `/api/automation` |
| Emergency | `/api/emergency` |
| Settings | `/api/settings` |
| TTS | `/api/tts` |

## MVP incluido

- Login JWT con roles (admin, terapeuta, familiar, usuario)
- Tablero AAC con categorías y botones grandes
- Barra de frases + Hablar/Borrar
- Sugerencias por reglas (base para IA)
- Editor de tableros
- Perfil con alto contraste y voz
- Historial y frases frecuentes
- Módulo Entorno (domótica mock con confirmación)
- Modo emergencia con doble confirmación
- Seed con vocabulario inicial en español

## Próximos pasos

- Conectar Ollama/OpenAI para sugerencias IA reales
- Integrar Piper TTS y Whisper STT
- Activar providers de domótica real (Home Assistant, MQTT, etc.)
- MinIO para imágenes personalizadas en botones

## Licencia

Proyecto privado — PIT / TOTA AAC.
