# god_is_typing — Web (Vite + React)

Cliente web **ligero** para **god_is_typing v2.6**: experiencia contemplativa de preguntas y respuestas en cinco caminos (Judaísmo, Cristianismo, Budismo, Panteón, Yo futuro). El usuario elige tradición, escribe una pregunta breve y recibe una respuesta tipo carta — a veces con cita de textos sagrados.

Telegram (`@god_is_typing_bot`) y esta web comparten **un solo workflow n8n**; solo cambian la entrada y la salida por canal.

| Documento | Descripción |
|-----------|-------------|
| [**Arquitectura**](./docs/ARCHITECTURE.md) | Diseño, decisiones técnicas, diagramas (ES / EN) |
| [**Stack tecnológico**](./docs/STACK.md) | Capas, herramientas, contrato API (ES / EN) |
| [**Fixes web n8n**](./docs/N8N_FIX_WEB.md) | Parse Decomposition, `Final Source Switch`, nodos |
| [**Guía de despliegue**](./docs/DEPLOY.md) | n8n + Vercel + Codespaces |
| [**Checklist v2.6**](./docs/README_v2_6.md) | Pruebas y configuración multi-canal |

## Arquitectura (resumen)

```text
[SPA navegador]  --POST JSON-->  [n8n v2.6]  -->  Groq LLM (+ RAG opcional)
                                       |
                                       +--> Supabase (estado, logs, rate limits)
                                       +--> LangFuse (trazas)
```

**Decisiones clave:**

- **Contexto canónico** tras `Normalize Context` — un mismo objeto de estado para Telegram y Web.
- **Rate limit antes del LLM** — 3 preguntas / 24 h en servidor (`chat_id` vs `ip_hash`).
- **RAG condicional** — solo Judaísmo/Cristianismo; el resto omite decomposer y APIs.
- **Egreso por canal** — Web: `Build Web Response` → `Respond Success`; Telegram: `Send Response`.
- **Privacidad** — la web envía **huella** (`ipHash`), no IP real.

Detalle y diagramas: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Stack tecnológico

| Capa | Stack |
|------|--------|
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| Orquestación | n8n Cloud (importar [`n8n/god_is_typing_v2.6_live.json`](./n8n/god_is_typing_v2.6_live.json)) |
| LLM | Groq vía n8n (decomposer 8B, agentes 70B) |
| RAG | Sefaria + Bible API (ramas judía / cristiana) |
| Datos | Supabase |
| Hosting | Vercel (SPA) |

Detalle: [`docs/STACK.md`](./docs/STACK.md).

## Rutas

| Ruta | Uso |
|------|-----|
| `/` | Inicio |
| `/ask` | Camino + pregunta |
| `/reveal` | Escritura + carta de respuesta |

## Desarrollo local

```bash
npm install
cp .env.example .env
# VITE_N8N_WEBHOOK_URL=https://TU.app.n8n.cloud/webhook/godistyping-web
npm run dev
```

Usa la URL de webhook de **producción** con el workflow **activo** en n8n. `webhook-test` solo sirve mientras escuchas en el editor.

```bash
npm run build
npm run preview
npm run lint
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_N8N_WEBHOOK_URL` | Sí | Webhook de producción n8n para `godistyping-web` |

## Despliegue

1. Importar / activar workflow: `n8n/god_is_typing_v2.6_live.json`.
2. Ejecutar `supabase/web_rate_limit.sql` (y esquema completo en `deploy/db/schema.sql` si aplica).
3. Push a GitHub → Vercel → configurar `VITE_N8N_WEBHOOK_URL` → desplegar.

Guía paso a paso: [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Estructura del repositorio

```text
src/           SPA React
n8n/           Exports del workflow
supabase/      SQL (rate limit web)
docs/          Arquitectura, stack, deploy, fixes
vercel.json    Rewrites SPA
```

## Aviso

Texto contemplativo generado por IA — invitación a reflexionar, no verdad absoluta. Ver textos en la app y [`docs/README_v2_6.md`](./docs/README_v2_6.md).

---

**English:** [`README.md`](./README.md)
