# Despliegue: n8n + Vercel + GitHub Codespaces

Guía paso a paso para conectar la web Vite/React con el workflow n8n v2.6 y publicar en Vercel.

---

## Parte A — Supabase (una sola vez)

1. Entrá a [Supabase](https://supabase.com) → tu proyecto del bot.
2. **SQL Editor** → New query.
3. Pegá y ejecutá el archivo `supabase/web_rate_limit.sql`.
4. Verificá en **Table Editor** que exista la tabla `web_rate_limit`.

---

## Parte B — n8n: conectar la web al flujo existente

### Si ya tenés v2.5 (Telegram) funcionando

**Opción recomendada:** importar v2.6 completo (incluye Telegram + web).

1. En n8n, abrí el workflow activo de Telegram → menú **⋯** → **Download** (backup).
2. **+ Add workflow** → **Import from File** → `n8n/god_is_typing_v2_6.json`.
3. Reasigná **credenciales** en cada nodo con triángulo amarillo (Supabase, Groq, Telegram, LangFuse).
4. No borres el workflow viejo hasta probar el nuevo.

**Si ya creaste los nodos web a mano**, verificá que el grafo coincida con esto:

```
Webhook Web → Web Normalize State → Query Decomposer → … (flujo compartido)
```

Y al final:

```
… → Log Conversation → Final Source Switch (rama web)
  → Build Web Response → Respond Success
```

Rate limit web (rama `source = web` en **Source Switch**):

```
Get Web Rate Limit → Evaluate Web Rate Limit → Web Rate Limit Gate
  → (blocked) Respond Blocked
  → (allowed) Update Web Rate Limit → Route by Deity
```

### Configuración de nodos clave

| Nodo | Qué revisar |
|------|-------------|
| **Webhook Web** | POST, path `godistyping-web`, Response Mode: *Respond to Webhook* |
| **Web Normalize State** | Code node; lee `message`, `language`, `deity`, `sessionId`, `ipHash` del body |
| **Get Web Rate Limit** | Tabla `web_rate_limit`, filtro `ip_hash` = `{{ $json.ipHash }}`, *Always Output Data* ON |
| **Update Web Rate Limit** | Upsert en `web_rate_limit`, conflicto en `ip_hash` |
| **Source Switch** | Rama 0: `source` equals `web` |
| **Final Source Switch** | Rama 0: `source` equals `web` → Build Web Response |
| **Build Web Response** | Devuelve JSON con `response` y `citation` |
| **Respond Success / Blocked** | Headers CORS: `Access-Control-Allow-Origin: *` |

Valores de `deity` que envía la web (deben coincidir con **Route by Deity**):

`jewish` · `christian` · `buddhist` · `olympus` · `future_self`

### Activar y copiar la URL

1. Arriba a la derecha: **Inactive** → clic hasta que diga **Active** (verde).
2. Abrí el nodo **Webhook Web** → pestaña **Production URL**.
3. Debe verse así: `https://TU-N8N.onrender.com/webhook/godistyping-web`

### Probar sin la web

```bash
curl -X POST "https://TU-N8N.onrender.com/webhook/godistyping-web" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Qué es la compasión?","language":"es","deity":"buddhist","sessionId":"test1","ipHash":"hash1"}'
```

Respuesta esperada (éxito):

```json
{"ok":true,"blocked":false,"response":"...","citation":"..."}
```

Si ves **404** → el workflow no está activo o el path no es `godistyping-web`.

---

## Parte C — Variables en la web

### Local (`.env`)

```env
VITE_N8N_WEBHOOK_URL=https://TU-N8N.onrender.com/webhook/godistyping-web
```

```bash
npm install
npm run dev
```

### Vercel (producción)

En el proyecto de Vercel → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_N8N_WEBHOOK_URL` | URL de producción del webhook (igual que arriba) |

Marcá **Production**, **Preview** y **Development**. Redeploy después de guardar.

---

## Parte D — GitHub + Vercel

### 1. Subir el repo a GitHub

```bash
cd godistyping
git init
git add .
git commit -m "Web v2.6: Vite + React landing"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/godistyping.git
git push -u origin main
```

(No subas `.env`; está en `.gitignore`.)

### 2. Conectar Vercel

1. [vercel.com](https://vercel.com) → **Add New Project**.
2. **Import** el repo de GitHub.
3. Framework: **Vite** (detectado automático).
4. Build: `npm run build` · Output: `dist` (ya en `vercel.json`).
5. Añadí `VITE_N8N_WEBHOOK_URL` antes del primer deploy.
6. **Deploy**.

### 3. Dominio y CORS

- URL típica: `https://godistyping.vercel.app`
- En n8n, si restringís CORS, permití ese origen en **Respond Success** y **Respond Blocked** (o dejá `*` al inicio).

### 4. Smoke test en producción

1. Abrí la URL de Vercel.
2. Elegí idioma y camino → pregunta corta → **Enviar**.
3. En n8n → **Executions**: debe aparecer una ejecución del webhook web.

---

## Parte E — GitHub Codespaces

El repo incluye `.devcontainer/devcontainer.json`.

1. En GitHub → repo → **Code** → **Codespaces** → **Create codespace on main**.
2. Al abrir, corre `npm install` y copia `.env.example` → `.env`.
3. Editá `.env` con tu `VITE_N8N_WEBHOOK_URL`.
4. Terminal: `npm run dev` → puerto **5173** se abre automáticamente.

---

## Checklist rápido

- [ ] Tabla `web_rate_limit` en Supabase
- [ ] Workflow n8n **Active**
- [ ] Webhook probado con curl (no 404)
- [ ] `VITE_N8N_WEBHOOK_URL` en `.env` local
- [ ] `VITE_N8N_WEBHOOK_URL` en Vercel
- [ ] Repo en GitHub
- [ ] Deploy Vercel OK
- [ ] Pregunta de prueba desde la URL pública

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|--------|----------|
| 404 en curl | Workflow inactivo | Activar workflow en n8n |
| “Webhook no activo” en la web | Misma causa | Activar + URL correcta en `.env` / Vercel |
| 500 en n8n | Supabase / credenciales | Executions → nodo en rojo |
| CORS en el navegador | Headers faltantes | `Access-Control-Allow-Origin` en Respond nodes |
| Primera petición muy lenta | Render free duerme | Esperar ~30–60 s o plan pago |

Más detalle: `docs/README_v2_6.md`.
