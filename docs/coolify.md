# Despliegue en Coolify — guía paso a paso

## 1. Configuración General

| Campo | Valor |
|-------|-------|
| Build Pack | Docker Compose |
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose.yaml` |

## 2. Variables de entorno obligatorias

En **Environment Variables** del recurso:

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
```

## 3. Dominio en el servicio frontend

El `docker-compose.yaml` ya incluye **labels Traefik** para `tota.pit.com.ar`.

Opcionalmente, en Coolify también podés configurar el dominio en el servicio `frontend`:

- URL: `https://tota.pit.com.ar:80` ← **incluir `:80` es crítico**
- Sin el `:80`, Coolify puede no generar el label `loadbalancer.server.port` y verás **503**

## 4. Deploy

1. **Save**
2. **Redeploy**
3. Esperar que los 4 contenedores estén **healthy**
4. Si persiste 503: **Servers → Restart Proxy**

## 5. Verificación

```bash
# DNS debe apuntar al servidor Coolify
dig tota.pit.com.ar +short

# Desde el servidor, probar el contenedor directamente
docker ps | grep frontend
docker exec <container-frontend> wget -qO- http://localhost/health
# Debe responder: ok
```

## Errores comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| **503 No available server** | Traefik sin ruta o sin puerto | Labels en compose + dominio con `:80` + Restart Proxy |
| Contenedor Exited | Error en backend | Revisar Logs del backend |
| 502 Bad Gateway | Frontend caído o puerto incorrecto | Verificar healthcheck frontend |
| SSL error | DNS o Let's Encrypt | Verificar DNS y puertos 80/443 abiertos |

## Notas técnicas

- No uses redes Docker custom en `docker-compose.yaml`
- El backend no necesita dominio propio; nginx en frontend hace proxy `/api` → `backend:8000`
- Para desarrollo local usar `docker-compose.yml` (con puerto 80 publicado)
