# Despliegue en Coolify

## Requisitos

- Servidor con Docker
- Coolify v4 instalado
- Dominio `tota.pit.com.ar` apuntando al servidor

## Configuración en Coolify (General)

| Campo | Valor |
|-------|-------|
| Build Pack | Docker Compose |
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose.yaml` |

> Coolify busca por defecto `docker-compose.yaml`. El repo incluye ese archivo (versión sin puertos publicados, optimizada para Coolify).

## Dominio

1. Ir a la pestaña del servicio **frontend**
2. Asignar dominio: `https://tota.pit.com.ar`
3. Puerto del contenedor: **80**
4. Activar SSL (Let's Encrypt)

El backend **no** necesita dominio propio: nginx en frontend hace proxy de `/api` → `backend:8000`.

## Variables de entorno (obligatorias)

Configurar en **Environment Variables** de Coolify:

```env
DOMAIN=tota.pit.com.ar
FRONTEND_URL=https://tota.pit.com.ar
API_URL=https://tota.pit.com.ar/api
VITE_API_URL=/api

POSTGRES_DB=tota
POSTGRES_USER=tota
POSTGRES_PASSWORD=<password-seguro>
DATABASE_URL=postgresql://tota:<password-seguro>@postgres:5432/tota

REDIS_URL=redis://redis:6379/0
JWT_SECRET=<secreto-largo-aleatorio>
JWT_ALGORITHM=HS256

AI_PROVIDER=mock
TTS_PROVIDER=browser
STT_PROVIDER=mock
AUTOMATION_PROVIDER=mock
```

**Importante:** `POSTGRES_PASSWORD` y la contraseña en `DATABASE_URL` deben coincidir.

## Deploy

1. Guardar configuración
2. Clic en **Deploy**
3. Revisar **Logs** si el estado queda en "Exited"

## Errores comunes

| Error | Solución |
|-------|----------|
| `Docker Compose file not found at /docker-compose.yaml` | Usar `/docker-compose.yaml` (ya incluido en el repo) |
| Contenedor Exited | Revisar Logs → suele ser falta de `JWT_SECRET` o `DATABASE_URL` |
| Puerto 80 en uso | No publicar puertos en Coolify; usar solo `expose` (docker-compose.yaml) |
| API no responde | Verificar que el dominio esté en el servicio `frontend`, no en `backend` |

## Desarrollo local

Usar `docker-compose.yml` (incluye `ports: 80:80`):

```bash
cp .env.example .env
docker compose -f docker-compose.yml up -d --build
```
