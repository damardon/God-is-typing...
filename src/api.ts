import type { Deity } from './i18n';
import type { Lang } from './i18n';

export type AskPayload = {
  message: string;
  language: Lang;
  deity: Deity;
  sessionId: string;
  ipHash: string;
};

export type AskResponse =
  | { blocked: true; message: string }
  | { blocked?: false; response: string; citation?: string };

function parseAskResponse(data: Record<string, unknown>): AskResponse | null {
  if (data.blocked === true && typeof data.message === 'string') {
    return { blocked: true, message: data.message };
  }
  if (typeof data.response === 'string') {
    const citation = typeof data.citation === 'string' ? data.citation : undefined;
    return { response: data.response, citation };
  }
  return null;
}

export async function postAsk(webhookUrl: string, body: AskPayload): Promise<AskResponse> {
  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('network');
  }

  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error('invalid_json');
  }

  if (!res.ok) {
    throw new Error(`http_${res.status}`);
  }

  const parsed = parseAskResponse(data);
  if (!parsed) {
    throw new Error('unexpected_shape');
  }
  return parsed;
}
