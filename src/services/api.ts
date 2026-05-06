import type { ApiFeedPost, Character, ChatMessage, Drama, RecommendedCard } from "../types";

const API_BASE = "https://two5tnframe.onrender.com";

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const url = typeof input === "string" ? `${API_BASE}${input}` : input;

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  characters: {
    list: () => apiFetch<{ characters: Character[] }>("/api/characters"),
  },

  feed: {
    list: () => apiFetch<{ feed: ApiFeedPost[] }>("/api/feed"),
    generate: (characterId: string, triggerType: string, context: string) =>
      apiFetch<{ post: ApiFeedPost }>("/api/feed/generate", json({ characterId, triggerType, context })),
  },

  chat: {
    send: (characterId: string, message: string, history: ChatMessage[]) =>
      apiFetch<{ reply: string; emotion?: string }>(`/api/chat/${characterId}`, json({ message, history })),
  },

  groups: {
    send: (groupId: string, message: string, history: ChatMessage[]) =>
      apiFetch<{ messages: Array<{ speakerId: string; speakerName: string; text: string; emotion?: string }> }>(
        `/api/groups/${groupId}/messages`,
        json({ message, history }),
      ),
  },

  comments: {
    generate: (postCharacterId: string, postContent: string, commenterId: string) =>
      apiFetch<{ text?: string; commenterId?: string; blocked?: boolean; reason?: string }>(
        "/api/comments/generate",
        json({ postCharacterId, postContent, commenterId, commenterRole: "character" }),
      ),
  },

  dramas: {
    list: () => apiFetch<{ dramas: Drama[] }>("/api/dramas"),
    characters: (dramaId: string) => apiFetch<{ characters: unknown[] }>(`/api/dramas/${dramaId}/characters`),
  },

  cards: {
    recommend: (toCharacterId: string, recommendedCharacterId: string) =>
      apiFetch<{
        card: {
          targetCharacterId: string;
          recommendedCharacterId: string;
          space: string;
          dramaCrossed: boolean;
          decision: RecommendedCard["decision"];
          responseText: string;
        };
      }>("/api/cards/recommend", json({ toCharacterId, recommendedCharacterId })),
  },
};
