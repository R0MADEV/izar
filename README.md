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
- 📧 **Correo** — leer emails (macOS) y **enviar emails vía SMTP** (cualquier plataforma).
- 🗣️ **Voz** (opcional) — Whisper local para hablarle y TTS nativo para que responda.
- 💾 **Memoria persistente** — recuerda conversaciones con embeddings locales (ChromaDB-style).
- 🧩 **Arquitectura hexagonal** — añadir un nuevo LLM o herramienta es crear un archivo, sin tocar el núcleo.

---

## Requisitos previos

### 1. Ollama

IZAR necesita Ollama corriendo con dos modelos:

```bash
# Instalar Ollama (macOS / Linux / Windows): https://ollama.com
ollama serve                      # arranca el servidor

# En otra terminal, descarga los modelos:
ollama pull llama3.1:8b           # modelo de chat (~4.7 GB) — buen tool calling
ollama pull nomic-embed-text      # embeddings para la memoria (~274 MB)
```

> **Nota:** se recomienda `llama3.1:8b` o superior. Modelos más pequeños (3B) fallan al llamar herramientas de forma fiable.

### 2. (Opcional) sox — solo para el modo voz

```bash
# macOS
brew install sox
# Linux
sudo apt install sox
```

---

## Instalación

```bash
npm install -g izar
# o
pnpm add -g izar
```

O desde el código:

```bash
git clone https://github.com/R0MADEV/izar.git
cd izar
bun install        # o npm install
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

# --- Envío de correo (SMTP) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=
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
izar-voice
# o en desarrollo:
bun run dev:voice
```

Habla después del prompt — la grabación se detiene sola al detectar silencio. IZAR transcribe con Whisper local y responde por voz.

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
| `get_calendar_events` | Lee eventos y festivos | macOS |
| `create_calendar_event` | Crea eventos | macOS |
| `get_emails` | Lee correos del buzón | macOS |

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
