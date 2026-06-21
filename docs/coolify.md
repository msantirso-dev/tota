# Coolify — configuración de dominio y SSL

El deploy puede estar **Running** y aun así ver:
- `no available server` (503)
- `NET::ERR_CERT_AUTHORITY_INVALID` (certificado inválido)

Eso significa que **Traefik responde pero no enruta bien** al contenedor `frontend`, o **Let's Encrypt no pudo emitir el certificado**.

> **No agregues labels Traefik manuales en el repo.** Coolify los genera al configurar el dominio en la UI. Labels duplicados causan 503 + SSL roto.

---

## Paso a paso en Coolify (obligatorio)

### 1. Abrir el servicio correcto

1. Proyecto **Tota** → recurso **tota** (Docker Compose)
2. En la vista del stack, buscá la lista de servicios: `frontend`, `backend`, `postgres`, `redis`
3. Hacé clic en **`frontend`** (no en la config general del stack)

### 2. Generar dominio CON puerto :80

1. En la sección **Domains** / **FQDNs**
2. Clic en **Generate Domain** (genera labels Traefik automáticamente)
3. Editá el dominio y dejalo exactamente así:

```
https://tota.pit.com.ar:80
```

El `:80` **no es opcional**. Sin él, Coolify omite `loadbalancer.server.port` y Traefik responde **503** ([issue #7525](https://github.com/coollabsio/coolify/issues/7525)).

4. **Save** (no borres el `:80` al guardar)
5. **Redeploy**

### 3. Verificar labels generados

1. En Configuration → **Show Deployable Compose**
2. En el servicio `frontend` debe aparecer algo como:

```yaml
labels:
  - traefik.enable=true
  - traefik.http.services.https-0-....loadbalancer.server.port=80
```

Si **no hay labels traefik** en `frontend`, el dominio no quedó configurado.

### 4. Restart Proxy

**Servers → localhost → Restart Proxy**

---

## SSL / certificado inválido

Let's Encrypt necesita validar el dominio. Verificá:

### DNS

```bash
dig tota.pit.com.ar +short
```

Debe apuntar a la **IP pública del servidor Coolify**.

### Cloudflare (si lo usás)

| Modo | Qué hacer |
|------|-----------|
| Proxy naranja activo | Cambiá temporalmente a **DNS only** (nube gris) hasta que Coolify emita el certificado |
| Full (Strict) | Necesitás certificado Origin de Cloudflare en Coolify, no Let's Encrypt directo |

### Puertos del servidor

- **80** y **443** abiertos en firewall
- No otro servicio usando esos puertos

### Probar HTTP primero

Abrí `http://tota.pit.com.ar` (sin https). Si HTTP funciona pero HTTPS no, el problema es solo SSL.

---

## Variables de entorno

```env
DOMAIN=tota.pit.com.ar
FRONTEND_URL=https://tota.pit.com.ar
API_URL=https://tota.pit.com.ar/api
VITE_API_URL=/api
JWT_SECRET=<secreto-largo>
POSTGRES_PASSWORD=<password>
DATABASE_URL=postgresql://tota:<password>@postgres:5432/tota
```

---

## Diagnóstico rápido

En Coolify → Terminal del contenedor **frontend**:

```bash
wget -qO- http://localhost/health
```

- Responde `ok` → la app funciona; el problema es Traefik/dominio/SSL
- No responde → revisar logs del frontend

En el servidor (SSH):

```bash
docker logs coolify-proxy --tail 50
```

Buscá errores de ACME o "no available server" para `tota.pit.com.ar`.

---

## Configuración General

| Campo | Valor |
|-------|-------|
| Build Pack | Docker Compose |
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose.yaml` |
