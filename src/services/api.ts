import type { ChatMessage } from "../types";

export const api = {
  feed: {
    list: () => fetch("/api/feed").then((r) => r.json()),
    generate: (characterId: string, triggerType: string, context: string) =>
      fetch("/api/feed/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, triggerType, context }),
      }).then((r) => r.json()),
  },

  chat: {
    send: (characterId: string, message: string, history: ChatMessage[]) =>
      fetch(`/api/chat/${characterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      }).then((r) => r.json()),
  },

  groups: {
    send: (groupId: string, message: string, history: ChatMessage[]) =>
      fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      }).then((r) => r.json()),
  },

  comments: {
    generate: (postCharacterId: string, postContent: string, commenterId: string) =>
      fetch("/api/comments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postCharacterId, postContent, commenterId, commenterRole: "character" }),
      }).then((r) => r.json()),
  },

  dramas: {
    list: () => fetch("/api/dramas").then((r) => r.json()),
    characters: (dramaId: string) => fetch(`/api/dramas/${dramaId}/characters`).then((r) => r.json()),
  },

  cards: {
    recommend: (toCharacterId: string, recommendedCharacterId: string) =>
      fetch("/api/cards/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toCharacterId, recommendedCharacterId }),
      }).then((r) => r.json()),
  },
};
