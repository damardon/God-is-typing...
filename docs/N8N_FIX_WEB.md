# Tu workflow v2.6 — flujo web y fix Parse Decomposition

Basado en `n8n/god_is_typing_v2.6_live.json` (export de n8n Cloud).

## god_is_typing v2.6 — arquitectura del sistema (ES / EN)

> Orquestación multi-canal en **n8n Cloud**: un único motor de diálogo, dos superficies de entrada (Telegram + Web), salida adaptada por canal. Export de referencia: `n8n/god_is_typing_v2.6_live.json`.

---

### Español

#### Visión

**god_is_typing** es un orquestador conversacional multi-tradición: el usuario elige un *camino* (Judaísmo, Cristianismo, Budismo, Panteón, Yo futuro) y recibe una respuesta breve, con tono contemplativo y cita cuando el pipeline lo permite. La web (Vite + React) y Telegram no duplican lógica de negocio: ambos hablan con el mismo webhook y el mismo grafo n8n.

#### Principios de diseño

| Principio | Qué implica en producción |
|-----------|---------------------------|
| **Contexto canónico** | Tras `Normalize Context`, todo el grafo comparte el mismo objeto de estado (`source`, `language`, `deity`, mensaje, ids de sesión). |
| **Fail-fast en cuota** | Rate limit **antes** de Groq, RAG o agentes. Rechazos baratos; cero tokens desperdiciados en abuso. |
| **Rutas condicionales** | Solo Judaísmo/Cristianismo pasan por *Query Decomposer* + recuperación (Sefaria / Bible API). Otras tradiciones van directo al agente. |
| **Egreso por canal** | `Final Source Switch`: web → JSON (`Build Web Response` → `Respond Success`); Telegram → `Send Response`. Nunca mezclar `chatId` web con la API de Telegram. |
| **Observabilidad** | Cada turno: `Log Conversation` (Supabase) + traza LangFuse asíncrona. |

#### Pipeline (happy path)

```text
[Telegram Trigger | Webhook Web]
        ↓
Normalize Context          ← contrato único entre canales
        ↓
Route Event (TG) / Source Switch
        ↓
Rate Limit (chat_id | ip_hash)   ← 3 preguntas / 24 h
        ↓
Route Decomposition Need
   ├─ jewish / christian → Query Decomposer → Parse Decomposition
   └─ buddhist / olympus / future_self → Bypass
        ↓
Route by Deity → AI Agent (+ RAG si aplica)
        ↓
Assemble * → Log Conversation → Restore Final Response
        ↓
Final Source Switch
   ├─ web      → Build Web Response → Respond Success
   └─ telegram → Send Response
```

#### Stack y responsabilidades

- **Frontend:** Vite, React, i18n ES/EN, fingerprint → `ipHash`, webhook `POST` con `message`, `language`, `deity`, `sessionId`, `ipHash`.
- **Orquestación:** n8n v2.6 — switches, code nodes, agentes Groq (decomposer 8B + agente 70B según rama).
- **Persistencia:** Supabase — estado de usuario (TG), conversaciones, rate limits segregados por canal.
- **RAG acotado:** APIs externas de texto sagrado en ramas judía/cristiana; el contexto recuperado se inyecta en el system prompt, no se inventan citas.

#### Integridad de datos (obligatorio)

Sin estas unicidades, el rate limit y el estado de usuario son inconsistentes bajo concurrencia:

```sql
-- user_state.chat_id      UNIQUE  (Telegram)
-- rate_limit.chat_id      UNIQUE  (Telegram, ventana 24 h)
-- web_rate_limit.ip_hash  UNIQUE  (Web, ventana 24 h)
```

---

### English

#### Vision

**god_is_typing** is a multi-tradition conversational orchestrator: the user picks a *path* (Jewish, Christian, Buddhist, Pantheon, Future Self) and receives a concise, contemplative answer—often with a citation when the pipeline supports it. The web app (Vite + React) and Telegram bot share **one business graph**: same webhook, same n8n workflow, channel-specific egress only at the edge.

#### Design principles

| Principle | Production implication |
|-----------|-------------------------|
| **Canonical context** | After `Normalize Context`, the graph shares one state object (`source`, `language`, `deity`, message, session ids). |
| **Fail-fast quotas** | Rate limiting runs **before** Groq, RAG, or agents. Cheap rejections; no tokens burned on abuse. |
| **Conditional paths** | Only Jewish/Christian hit *Query Decomposer* + retrieval (Sefaria / Bible API). Other traditions go straight to the agent. |
| **Channel-aware egress** | `Final Source Switch`: web → JSON (`Build Web Response` → `Respond Success`); Telegram → `Send Response`. Never route web `chatId` hashes to the Telegram API. |
| **Observability** | Every turn: `Log Conversation` (Supabase) + async LangFuse trace. |

#### Pipeline (happy path)

```text
[Telegram Trigger | Webhook Web]
        ↓
Normalize Context          ← single contract across channels
        ↓
Route Event (TG) / Source Switch
        ↓
Rate Limit (chat_id | ip_hash)   ← 3 questions / 24 h
        ↓
Route Decomposition Need
   ├─ jewish / christian → Query Decomposer → Parse Decomposition
   └─ buddhist / olympus / future_self → Bypass
        ↓
Route by Deity → AI Agent (+ RAG when applicable)
        ↓
Assemble * → Log Conversation → Restore Final Response
        ↓
Final Source Switch
   ├─ web      → Build Web Response → Respond Success
   └─ telegram → Send Response
```

#### Stack & boundaries

- **Frontend:** Vite, React, ES/EN i18n, browser fingerprint → `ipHash`, webhook `POST` with `message`, `language`, `deity`, `sessionId`, `ipHash`.
- **Orchestration:** n8n v2.6 — switches, code nodes, Groq agents (8B decomposer + 70B deity agent per branch).
- **Persistence:** Supabase — TG user state, conversation log, channel-isolated rate limits.
- **Scoped RAG:** External sacred-text APIs on Jewish/Christian branches; retrieved context is injected into the system prompt—citations are grounded, not hallucinated.

#### Data integrity (required)

Without these uniqueness constraints, rate limits and user state break under concurrency:

```sql
-- user_state.chat_id      UNIQUE  (Telegram)
-- rate_limit.chat_id      UNIQUE  (Telegram, 24 h window)
-- web_rate_limit.ip_hash  UNIQUE  (Web, 24 h window)
```

## Nombres de nodos (los del canvas)

| Paso | Nombre exacto en tu workflow |
|------|------------------------------|
| 1 | **Webhook Web** |
| 2 | **Web Normalize State** |
| 3 | **Normalize Context** |
| 4 | **Route Event** → rama `process_message` |
| 5 | **Source Switch** → rama web |
| 6 | **Get Web Rate Limit** → **Evaluate Web Rate Limit** → **Web Rate Limit Gate** |
| 7 | **Update Web rate limit** → **Restore Web Message State** |
| 8 | **Route Decomposition Need** (Switch: judaísmo/cristianismo → LLM; otras → bypass) |
| 9a | **Query Decomposer** → **Parse Decomposition** (solo jewish / christian) |
| 9b | **Bypass Decomposition** (buddhist, olympus, future_self) |
| 10 | **Route by Deity** → AI Agents… |

**No uses** `Route Decomposition Need` en la línea 3 de Parse Decomposition: es un **Switch**, no el nodo que guarda el mensaje.

## Código para Parse Decomposition (pegar completo o solo el bloque `state`)

```javascript
// Parse the JSON output from Query Decomposer and merge with canonical state.
const decompOutput = $input.first().json.output || '{}';

function stateFrom(nodeName) {
  try {
    const item = $(nodeName).first();
    return item ? item.json : null;
  } catch {
    return null;
  }
}

const state =
  stateFrom('Restore Web Message State') ||
  stateFrom('Restore Telegram Message State') ||
  stateFrom('Normalize Context');

if (!state) {
  throw new Error('No hay estado. Web: Restore Web Message State. Telegram: Restore Telegram Message State.');
}

let decomposition = {
  intent: state.usermessage,
  subQueries: [state.usermessage],
  topics: [],
  isExistential: true,
};

try {
  let jsonText = decompOutput;
  const jsonMatch = decompOutput.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  } else {
    const firstBrace = decompOutput.indexOf('{');
    const lastBrace = decompOutput.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonText = decompOutput.substring(firstBrace, lastBrace + 1);
    }
  }
  const parsed = JSON.parse(jsonText);
  decomposition = {
    intent: parsed.intent || state.usermessage,
    subQueries:
      Array.isArray(parsed.subQueries) && parsed.subQueries.length > 0
        ? parsed.subQueries.slice(0, 3)
        : [state.usermessage],
    topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [],
    isExistential: parsed.isExistential !== undefined ? parsed.isExistential : true,
  };
} catch (e) {
  decomposition.parseError = e.message;
}

return {
  ...state,
  decomposition,
  bestQuery: decomposition.subQueries[0],
  enrichedContext: `Intent: ${decomposition.intent}\nKey topics: ${decomposition.topics.join(', ') || 'none'}\nSub-queries explored: ${decomposition.subQueries.join('; ')}`,
};
```

## Webhook URL (Vercel / .env)

```
https://damardon.app.n8n.cloud/webhook/godistyping-web
```

No uses `webhook-test` en producción.

## Error Telegram: `chat not found` en Send Response (web)

**Causa:** Los nodos **Assemble *** estaban conectados **directo** a **Send Response**. En web el `chatId` es un hash, no un chat de Telegram.

**Arreglo en el canvas:**

1. **Desconectá** `Send Response` de todos los Assemble:
   - Assemble Response  
   - Assemble Christian Response  
   - Assemble Buddhist Response  
   - Assemble Olympus Response  
   - Assemble Future Self Response  

2. Cada Assemble debe ir **solo** a **Log Conversation**.

3. La cadena de salida debe ser:

```
Assemble * → Log Conversation → Restore Final Response → Final Source Switch
   ├─ (source = web)     → Build Web Response → Respond Success
   └─ (resto / telegram) → Send Response
```

4. En **Final Source Switch**:
   - Regla: `source` equals `web` → **Build Web Response**
   - **Fallback / Extra output** → **Send Response** (no dejar fallback en "none")

O re-importá `n8n/god_is_typing_v2.6_live.json` (ya incluye estas conexiones).

## Probar en Executions

Tras una pregunta web, en verde antes de Parse Decomposition:

- **Restore Web Message State** ✓
- **Route Decomposition Need** ✓
- **Query Decomposer** ✓ (solo jewish/christian)
