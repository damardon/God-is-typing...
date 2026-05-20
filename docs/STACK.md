# Technology stack — god_is_typing v2.6

## English

| Layer | Technology | Role in this project |
|-------|------------|----------------------|
| **Web UI** | React 19, TypeScript 6, Vite 8 | SPA: `/`, `/ask`, `/reveal` |
| **Routing** | React Router 7 | Client-side routes; `vercel.json` rewrites to `index.html` |
| **Styling** | CSS (design tokens in `src/index.css`) | Monochrome celestial UI, responsive `clamp()` typography |
| **i18n** | Custom `src/i18n.ts` | Spanish / English copy without i18next |
| **HTTP** | `fetch` (`src/api.ts`) | POST to n8n webhook; typed success/blocked responses |
| **Client identity** | Web Crypto SHA-256 (`src/fingerprint.ts`) | `ipHash` for web rate limiting |
| **Client state** | `localStorage`, `sessionStorage` | Preferences, quota UX, pending question |
| **Orchestration** | n8n Cloud | Single workflow: Telegram + Web |
| **LLM** | Groq (via n8n) | ~8B decomposer (Jewish/Christian); ~70B deity agents |
| **RAG** | Sefaria API, Bible API (n8n HTTP nodes) | Jewish / Christian branches only |
| **Database** | Supabase (PostgreSQL) | `user_state`, `conversations`, `rate_limit`, `web_rate_limit` |
| **Observability** | LangFuse (n8n → Cloud) | Traces per deity turn |
| **Bot** | Telegram Bot API | Legacy channel; shared workflow |
| **Hosting (web)** | Vercel | Static `dist/` + env `VITE_N8N_WEBHOOK_URL` |
| **Dev environment** | GitHub Codespaces (optional) | `.devcontainer/` Node 20 |
| **Lint** | ESLint 10 + typescript-eslint | `npm run lint` |

### API contract (web → n8n)

**Request** `POST` `application/json`:

```json
{
  "message": "string",
  "language": "es | en",
  "deity": "jewish | christian | buddhist | olympus | future_self",
  "sessionId": "sess_…",
  "ipHash": "16-char hex"
}
```

**Success response:**

```json
{
  "ok": true,
  "blocked": false,
  "response": "…",
  "citation": "…",
  "deity": "jewish",
  "language": "es",
  "source": "web"
}
```

**Blocked (rate limit):**

```json
{ "blocked": true, "message": "…" }
```

---

## Español

| Capa | Tecnología | Rol en el proyecto |
|------|------------|-------------------|
| **UI web** | React 19, TypeScript 6, Vite 8 | SPA: `/`, `/ask`, `/reveal` |
| **Rutas** | React Router 7 | Rutas en cliente; `vercel.json` reescribe a `index.html` |
| **Estilos** | CSS (`src/index.css`) | UI monocroma, tipografía responsive con `clamp()` |
| **i18n** | `src/i18n.ts` propio | Textos ES / EN sin i18next |
| **HTTP** | `fetch` (`src/api.ts`) | POST al webhook n8n; respuestas tipadas ok/blocked |
| **Identidad cliente** | SHA-256 Web Crypto (`src/fingerprint.ts`) | `ipHash` para rate limit web |
| **Estado cliente** | `localStorage`, `sessionStorage` | Preferencias, cuota UX, pregunta pendiente |
| **Orquestación** | n8n Cloud | Un workflow: Telegram + Web |
| **LLM** | Groq (vía n8n) | ~8B decomposer (judío/cristiano); ~70B agentes por deidad |
| **RAG** | API Sefaria, Bible API (nodos HTTP n8n) | Solo ramas judía / cristiana |
| **Base de datos** | Supabase (PostgreSQL) | `user_state`, `conversations`, `rate_limit`, `web_rate_limit` |
| **Observabilidad** | LangFuse (n8n → Cloud) | Trazas por turno |
| **Bot** | Telegram Bot API | Canal original; mismo workflow |
| **Hosting (web)** | Vercel | `dist/` estático + `VITE_N8N_WEBHOOK_URL` |
| **Entorno dev** | GitHub Codespaces (opcional) | `.devcontainer/` Node 20 |
| **Lint** | ESLint 10 + typescript-eslint | `npm run lint` |

### Contrato API (web → n8n)

Misma forma que en la tabla en inglés arriba.
