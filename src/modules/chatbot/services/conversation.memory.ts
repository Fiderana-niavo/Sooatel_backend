// ─── Conversation Memory (RAM, no DB) ────────────────────────────────────────
// Stores the last N exchanges per sessionId with a 30-minute TTL.
// Automatically purged by a background job every 30 minutes.

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_TURNS = 6; // Keep last 6 exchanges (user + assistant)
const PURGE_INTERVAL_MS = 30 * 60 * 1000;

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

interface SessionEntry {
  history: ConversationTurn[];
  lastActivity: number;
}

const sessions = new Map<string, SessionEntry>();

// ─── Auto-purge job ────────────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  let purged = 0;
  for (const [id, entry] of sessions.entries()) {
    if (now - entry.lastActivity > SESSION_TTL_MS) {
      sessions.delete(id);
      purged++;
    }
  }
}, PURGE_INTERVAL_MS);

// ─── Public API ───────────────────────────────────────────────────────────────

export function getHistory(sessionId: string): ConversationTurn[] {
  return sessions.get(sessionId)?.history ?? [];
}

export function appendTurn(sessionId: string, turn: ConversationTurn): void {
  const entry = sessions.get(sessionId) ?? { history: [], lastActivity: 0 };
  entry.history.push(turn);

  // Keep only last MAX_HISTORY_TURNS turns
  if (entry.history.length > MAX_HISTORY_TURNS) {
    entry.history = entry.history.slice(-MAX_HISTORY_TURNS);
  }

  entry.lastActivity = Date.now();
  sessions.set(sessionId, entry);
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}
