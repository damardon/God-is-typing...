# Tu workflow v2.6 — flujo web y fix Parse Decomposition

Basado en `n8n/god_is_typing_v2.6_live.json` (export de n8n Cloud).

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
