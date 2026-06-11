# IZAR

> Asistente de IA personal que corre **100% local** en tu máquina. Sin coste, sin enviar tus datos a la nube.

IZAR es un agente de terminal conectado a un LLM local (vía [Ollama](https://ollama.com)) que ejecuta acciones reales: busca en internet, lee y escribe archivos, gestiona tu calendario, lee y envía correos, ejecuta comandos y recuerda tus conversaciones pasadas con memoria vectorial persistente.

```
  ██╗███████╗ █████╗ ██████╗
  ██║╚══███╔╝██╔══██╗██╔══██╗
  ██║  ███╔╝ ███████║██████╔╝
  ██║ ███╔╝  ██╔══██║██╔══██╗
  ██║███████╗██║  ██║██║  ██║
  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

---

## Características

- 🧠 **LLM local** — usa Ollama (Llama 3.1, etc.). 0 € y tus datos no salen de tu máquina.
- 🔎 **Búsqueda web** — DuckDuckGo + Google News RSS, sin API keys.
- 📁 **Archivos** — leer, escribir y listar directorios.
- 💻 **Shell** — ejecuta comandos del sistema (cross-platform).
- 📅 **Calendario** (macOS) — leer eventos, rangos de fechas, festivos suscritos y crear eventos.
- 📧 **Correo** — leer (IMAP) y enviar (SMTP) emails en **cualquier plataforma**.
- 🗣️ **Voz** (opcional) — Whisper local para hablarle y TTS nativo para que responda.
- 💾 **Memoria persistente** — recuerda conversaciones con embeddings locales (ChromaDB-style).
- 🧩 **Arquitectura hexagonal** — añadir un nuevo LLM o herramienta es crear un archivo, sin tocar el núcleo.

---

## Requisitos previos

## Instalación

```bash
npm install -g izar
# o
pnpm add -g izar
```

Eso es todo. **No necesitas instalar nada más a mano.**

La primera vez que ejecutes `izar`, el asistente se encarga solo de:

1. ✅ Crear el archivo `.env` con valores por defecto.
2. ✅ Instalar **Ollama** si no lo tienes (automático en macOS/Linux; en Windows abre el instalador).
3. ✅ Arrancar el servidor de Ollama en segundo plano.
4. ✅ Descargar los modelos necesarios (`llama3.1:8b` + `nomic-embed-text`) con barra de progreso.

```bash
izar     # primer arranque: configura todo y abre el chat
```

> **Nota:** la primera descarga de modelos baja ~5 GB y solo ocurre una vez. Para el modo voz necesitas `sox` (`brew install sox` / `apt install sox`).

O desde el código:

```bash
git clone https://github.com/R0MADEV/izar.git
cd izar
bun install
bun run dev
```

---

## Configuración

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

```ini
# --- LLM ---
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_URL=http://localhost:11434

# --- Correo: enviar (SMTP) y leer (IMAP) ---
# El mismo SMTP_USER / SMTP_PASS se reutiliza para leer por IMAP.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

| Variable | Qué es |
|----------|--------|
| `OLLAMA_MODEL` | El modelo que usará el cerebro. Debe estar descargado en Ollama. |
| `OLLAMA_URL` | Dónde escucha Ollama (por defecto `localhost:11434`). |
| `SMTP_HOST` | Servidor de salida. Para Gmail: `smtp.gmail.com`. |
| `SMTP_PORT` | `465` para conexión SSL/TLS segura. |
| `SMTP_USER` | Tu dirección — quién aparece como remitente. |
| `SMTP_PASS` | El **app-password** (ver abajo). **No** es tu contraseña normal. |

---

## 📧 Configurar el envío de correo (app-password de Gmail)

Para que IZAR pueda enviar correos necesitas un **app-password** (contraseña de aplicación). **No es tu contraseña de Gmail** — es una llave de 16 caracteres que solo sirve para enviar/leer correo, y que puedes revocar cuando quieras.

### Paso a paso

1. Activa la **verificación en dos pasos** en tu cuenta de Google (requisito de Google):
   👉 https://myaccount.google.com/security

2. Entra al generador de contraseñas de aplicación:
   👉 https://myaccount.google.com/apppasswords

3. Escribe un nombre (p. ej. `IZAR`) y pulsa **Crear**.

4. Google te muestra una contraseña de 16 caracteres con espacios, por ejemplo:
   ```
   czbv erdo hsgd iydl
   ```

5. Cópiala en tu `.env` **sin los espacios**:
   ```ini
   SMTP_USER=tu-correo@gmail.com
   SMTP_PASS=czbverdohsgdiydl
   ```

¡Listo! Ya puedes pedirle a IZAR que envíe correos a cualquier dirección.

### ⚠️ Seguridad

- El `.env` **nunca** se sube a git (está en `.gitignore`). Tu app-password se queda solo en tu máquina.
- Si la contraseña se filtra, **revócala** en https://myaccount.google.com/apppasswords y genera otra.
- El app-password **solo** da acceso a enviar/leer correo, **no** a tu cuenta de Google completa.
- El remitente siempre será tu cuenta (`SMTP_USER`). No se puede falsificar.
- Gmail gratuito permite **~500 correos/día**.

> ¿Usas otro proveedor? Cambia `SMTP_HOST` y `SMTP_PORT`:
> - **Outlook:** `smtp-mail.outlook.com` / `587`
> - **Yahoo:** `smtp.mail.yahoo.com` / `465`

---

## Uso

IZAR es un único comando con subcomandos:

```bash
izar            # modo texto (chat)
izar voice      # modo voz
izar --help     # ayuda
```

### Modo texto

```bash
izar
# o en desarrollo:
bun run dev
```

Escribe lo que quieras:

```
› ¿qué eventos tengo mañana?
› busca las últimas noticias de Apple
› envía un correo a juan@empresa.com con asunto "reunión" y cuerpo "nos vemos a las 10"
› crea un evento "Dentista" el 2026-07-15 a las 17:00
› lista los archivos de mi escritorio
```

Para salir: `exit`, `quit` o `Ctrl+C`.

### Modo voz (opcional)

```bash
izar voice
# o en desarrollo:
bun run dev:voice
```

Habla después del prompt — la grabación se detiene sola al detectar silencio. IZAR transcribe con Whisper local y responde por voz.

**Requisito:** `sox` (`brew install sox` en macOS, `apt install sox` en Linux).

El modelo de transcripción se configura en `.env`:

```ini
WHISPER_MODEL=Xenova/whisper-small   # tiny < base < small < medium (más grande = más preciso)
WHISPER_LANGUAGE=spanish
```

> `whisper-small` es el recomendado para español (buen balance precisión/velocidad). `whisper-tiny`/`base` son más rápidos pero cometen más errores.

---

## Herramientas disponibles

| Herramienta | Descripción | Plataforma |
|-------------|-------------|------------|
| `web_search` | Busca en internet (DDG + Google News) | Todas |
| `read_file` / `write_file` / `list_dir` | Gestión de archivos | Todas |
| `run_shell` | Ejecuta comandos | Todas |
| `send_email` | Envía correo vía SMTP | Todas |
| `open_app` | Abre apps o archivos | Todas |
| `send_notification` | Notificación del sistema | Todas |
| `get_emails` | Lee correos vía IMAP | Todas |
| `get_calendar_events` | Lee eventos y festivos | macOS |
| `create_calendar_event` | Crea eventos | macOS |

### Compatibilidad por plataforma

La mayoría de funciones corren en **macOS, Linux y Windows**. Las herramientas de **calendario** usan integración nativa de macOS (AppleScript) y por ahora son solo-macOS — en Linux/Windows IZAR simplemente no las registra (no falla, solo no están disponibles). El correo (leer/enviar) sí funciona en los tres sistemas vía IMAP/SMTP.

---

## Arquitectura

Hexagonal (puertos y adaptadores). El núcleo (`domain/`) nunca conoce las implementaciones concretas:

```
src/
├── cli.ts              # entry point — compone todo
├── config.ts           # lee .env
├── domain/
│   └── agent.ts        # lógica pura del agente
├── ports/              # contratos (interfaces)
│   ├── llm.ts
│   ├── memory.ts
│   ├── mailer.ts
│   └── tool.ts
└── adapters/           # implementaciones
    ├── ollama.ts       # LLM
    ├── vectra.ts       # memoria vectorial
    ├── smtp.ts         # envío de correo
    ├── whisper.ts      # voz a texto
    └── tools/          # herramientas
```

**Añadir otro LLM** (p. ej. Claude): crea `adapters/claude.ts` que implemente `LLMPort` y cámbialo en `cli.ts`. El núcleo no cambia.

---

## Desarrollo

```bash
bun test          # tests
bun run lint      # linter (ESLint + @stylistic)
bun run lint:fix  # auto-fix
bun run build     # compila a dist/
```

---

## Stack

Bun · TypeScript · Ollama · Vercel AI SDK · Vectra · Nodemailer · Whisper (transformers.js)

---

## Licencia

MIT
