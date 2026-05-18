export const STORAGE_KEY = 'godistyping_state_v2';
export const CLIENT_ID_KEY = 'godistyping_client_id';
export const PENDING_KEY = 'godistyping_pending';
export const MAX_QUESTIONS = 3;
export const MAX_MESSAGE_LENGTH = 280;
export const WINDOW_HOURS = 24;
export const TELEGRAM_BOT_URL = 'https://t.me/god_is_typing_bot';
export const MIN_TYPING_MS = 1400;

export function getWebhookUrl(): string {
  const u = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return typeof u === 'string' ? u.trim() : '';
}
