# Desarrollo de TOTA AAC

## Ramas

| Rama | Uso |
|------|-----|
| `main` | Producción en Coolify (`tota.pit.com.ar`). Solo merge cuando esté probado. |
| `develop` | Nuevas funciones: editor de tableros, chat IA, audio al tocar, etc. |

## Flujo de trabajo

```bash
git checkout develop
# ... desarrollar ...
git add .
git commit -m "descripción"
git push origin develop
```

Cuando una versión esté lista para producción:

```bash
git checkout main
git merge develop
git push origin main
```

En Coolify podés apuntar un **entorno de staging** a la rama `develop` y dejar producción en `main`.

## Audio en celular

La voz usa **Web Speech API** del navegador (`speechSynthesis`).

### Por qué a veces no se escucha

1. **iPhone/iPad (Safari/Chrome):** el audio de voz requiere un **toque del usuario** antes de funcionar. TOTA llama `unlockSpeech()` en el primer toque de botón.
2. **Modo silencio:** en iOS la síntesis de voz puede no sonar si el interruptor de silencio está activado.
3. **Volumen:** subí el volumen multimedia del dispositivo.
4. **HTTPS:** la app debe servirse por HTTPS (Coolify con certificado válido).
5. **Navegador:** probá Safari o Chrome actualizados; algunos navegadores in-app (Instagram, Facebook) bloquean TTS.

### Prueba rápida

1. Abrí `https://tota.pit.com.ar` en el celular.
2. Iniciá sesión y tocá un botón del tablero.
3. Si no suena al primer toque, tocá otro botón o el botón **Hablar** de la barra inferior.

Si sigue sin audio, en iOS andá a **Ajustes → Accesibilidad → Contenido hablado** y verificá que haya voces en español descargadas.
