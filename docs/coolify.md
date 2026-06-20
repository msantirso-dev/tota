# Despliegue en Coolify

## Requisitos

- Servidor con Docker
- Coolify instalado
- Dominio `tota.pit.com.ar` apuntando al servidor

## Pasos

1. Importar repositorio en Coolify
2. Tipo de deploy: **Docker Compose**
3. Archivo: `docker-compose.yml` (raíz)
4. Variables de entorno desde `.env.example`
5. Dominio asignado al servicio `frontend` puerto `80`
6. SSL automático vía Coolify

## Variables críticas

```env
JWT_SECRET=<generar-secreto-largo>
POSTGRES_PASSWORD=<password-seguro>
FRONTEND_URL=https://tota.pit.com.ar
API_URL=https://tota.pit.com.ar/api
```

## Notas

- El backend no se expone directamente; el frontend hace proxy `/api` → `backend:8000`
- Para debug, se puede exponer temporalmente el puerto del backend
- Los servicios opcionales (ollama, piper, etc.) están comentados en docker-compose
