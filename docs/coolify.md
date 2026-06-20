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

## Dominio (IMPORTANTE — sin esto verás 503)

El deploy puede estar **Running** pero el sitio no abre si falta el dominio en el servicio correcto.

1. En Coolify, abrí el recurso **tota** (Docker Compose)
2. En la lista de servicios, entrá al servicio **`frontend`** (no al stack general)
3. En **Domains / FQDN**, agregá: `https://tota.pit.com.ar`
4. **Port:** `80`
5. Clic en **Generate Domain** o **Save**
6. **Redeploy**
7. Si sigue en 503: **Servers → tu servidor → Restart Proxy**

> Coolify usa Traefik. Sin dominio asignado al servicio `frontend`, Traefik responde **503 No available server**.

## Redes Docker

**No uses redes custom** en `docker-compose.yaml`. Coolify gestiona la red del proxy automáticamente. Una red `tota-network` aislada impide que Traefik alcance el frontend ([issue #6215](https://github.com/coollabsio/coolify/issues/6215)).

## DNS

Verificá que `tota.pit.com.ar` apunte por **A record** a la IP pública del servidor Coolify:

```bash
dig tota.pit.com.ar +short
```

## Configuración en Coolify (General)

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
| **503 No available server** | Asignar dominio al servicio `frontend` puerto 80 + Restart Proxy |
| Puerto 80 en uso | No publicar puertos en Coolify; usar solo `expose` (docker-compose.yaml) |
| API no responde | Verificar que el dominio esté en el servicio `frontend`, no en `backend` |

## Desarrollo local

Usar `docker-compose.yml` (incluye `ports: 80:80`):

```bash
cp .env.example .env
docker compose -f docker-compose.yml up -d --build
```
