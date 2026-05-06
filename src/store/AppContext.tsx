import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Character, FriendStatus, Letter, Notification, Post, RecommendedCard } from "../types";
import { characters } from "../data/characters";
import { api } from "../services/api";

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// ─── localStorage persistence ────────────────────────────────────────────────

const STORAGE_KEY = "di25zhen_v1";

type PersistedState = {
  friendOverrides: Record<string, FriendStatus>;
  interactionCounts: Record<string, number>;
  carriedLetterIds: string[];
  emotionPosts: Record<string, Post[]>;
  notifications: Notification[];
  pendingCards: RecommendedCard[];
};

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
  } catch {
    return {};
  }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ─── Toast component ─────────────────────────────────────────────────────────

function Toast() {
  const { toast, clearToast } = useApp();
  if (!toast) return null;
  return (
    <button
      onClick={clearToast}
      className="fixed left-1/2 top-5 z-50 w-[calc(100%-32px)] max-w-[358px] -translate-x-1/2 rounded-xl bg-[#1A1611] px-4 py-3 text-left text-sm leading-6 text-white shadow-2xl"
    >
      {toast}
    </button>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = useMemo(() => loadState(), []);

  const [friendOverrides, setFriendOverrides] = useState<Record<string, FriendStatus>>(
    saved.friendOverrides ?? {},
  );
  const [emotionPosts, setEmotionPosts] = useState<Record<string, Post[]>>(
    saved.emotionPosts ?? {},
  );
  const [carriedLetterIds, setCarriedLetterIds] = useState<string[]>(
    saved.carriedLetterIds ?? [],
  );
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>(
    saved.interactionCounts ?? {},
  );
  const [pendingCards, setPendingCards] = useState<RecommendedCard[]>(
    saved.pendingCards ?? [],
  );
  const [notifications, setNotifications] = useState<Notification[]>(
    saved.notifications ?? [],
  );
  const [toast, setToast] = useState<string | null>(null);
  const [remoteCharacters, setRemoteCharacters] = useState<Character[]>([]);

  // Fetch characters from backend on mount; merge with local UI-only fields
  useEffect(() => {
    api.characters.list().then(({ characters: remote }) => {
      const merged = remote.map((remoteChar) => {
        const local = characters.find((c) => c.id === remoteChar.id);
        return {
          ...remoteChar,
          // preserve UI-only fields that only exist in local data
          initial: local?.initial ?? remoteChar.initial,
          dramaId: local?.dramaId ?? remoteChar.dramaId,
          role: local?.role ?? remoteChar.role,
          friend_status: local?.friend_status ?? remoteChar.friend_status,
          sample_posts: local?.sample_posts,
          unsent_letters: local?.unsent_letters,
          offline_episode: local?.offline_episode,
          forbidden_relations: local?.forbidden_relations,
        };
      });
      setRemoteCharacters(merged);
    }).catch(() => {});
  }, []);

  // Persist all state slices on change
  useEffect(() => {
    saveState({ friendOverrides, interactionCounts, carriedLetterIds, emotionPosts, notifications, pendingCards });
  }, [friendOverrides, interactionCounts, carriedLetterIds, emotionPosts, notifications, pendingCards]);

  const baseCharacters = remoteCharacters.length > 0 ? remoteCharacters : characters;

  const allCharacters = useMemo(
    () => baseCharacters.map((item) => ({ ...item, friend_status: friendOverrides[item.id] ?? item.friend_status })),
    [baseCharacters, friendOverrides],
  );

  // ── Stable callbacks ──────────────────────────────────────────────────────

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifications((prev) => [
      {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const incrementInteraction = useCallback((characterId: string) => {
    setInteractionCounts((prev) => ({ ...prev, [characterId]: (prev[characterId] ?? 0) + 1 }));
  }, []);

  const acceptFriend = useCallback((characterId: string) => {
    const character = allCharacters.find((c) => c.id === characterId) ?? characters.find((c) => c.id === characterId);
    setFriendOverrides((prev) => ({ ...prev, [characterId]: "friend" }));
    if (character) {
      addNotification({
        type: "friend_accepted",
        title: `你已通过${character.name}的好友申请`,
        body: `${character.name}现在会出现在私信列表，可以直接进行角色对话`,
        characterId,
      });
      showToast(`已通过${character.name}的好友申请`);
    }
  }, [allCharacters, addNotification, showToast]);

  // ── Auto-accept pending friends after 3 interactions ─────────────────────
  // Use a ref to track which characters have already been auto-accepted this session
  // to avoid re-triggering the notification on every render.
  const autoAcceptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pending = Object.entries(friendOverrides).filter(([, status]) => status === "pending");
    for (const [charId] of pending) {
      if (autoAcceptedRef.current.has(charId)) continue;
      const count = interactionCounts[charId] ?? 0;
      if (count >= 3) {
        autoAcceptedRef.current.add(charId);
        setFriendOverrides((prev) => ({ ...prev, [charId]: "friend" }));
        const char = characters.find((c) => c.id === charId);
        if (char) {
          addNotification({
            type: "friend_accepted",
            title: `${char.name}接受了你的好友申请`,
            body: `你们现在可以在私信中直接对话了`,
            characterId: char.id,
          });
          showToast(`${char.name}接受了你的好友申请`);
        }
      }
    }
  }, [interactionCounts, friendOverrides, addNotification, showToast]);

  // ── requestFriend ─────────────────────────────────────────────────────────

  const requestFriend = useCallback(
    (character: Character) => {
      const current = friendOverrides[character.id] ?? character.friend_status;
      if (current !== "none") {
        showToast(
          current === "pending"
            ? `已向${character.name}发送过申请，等待回应中`
            : `${character.name}已是你的好友`,
        );
        return;
      }
      setFriendOverrides((prev) => ({ ...prev, [character.id]: "pending" }));
      showToast(`已向${character.name}发送好友申请`);
    },
    [friendOverrides, showToast],
  );

  // ── addPendingCard ────────────────────────────────────────────────────────

  const addPendingCard = useCallback(
    (card: RecommendedCard) => {
      setPendingCards((prev) => {
        if (prev.some((c) => c.id === card.id)) return prev;
        return [card, ...prev];
      });
      if (card.decision === "accepted" || card.decision === "interested") {
        const targetChar = characters.find((c) => c.id === card.targetCharacterId);
        const recChar = characters.find((c) => c.id === card.recommendedCharacterId);
        if (targetChar && recChar) {
          addNotification({
            type: card.decision === "accepted" ? "card_accepted" : "card_interested",
            title: `${targetChar.name}对名片有了回应`,
            body:
              card.decision === "accepted"
                ? `${targetChar.name}接受了${recChar.name}的名片，潜在连接已建立`
                : `${targetChar.name}对${recChar.name}的名片表示感兴趣`,
            characterId: targetChar.id,
            relatedId: card.id,
          });
        }
      }
    },
    [addNotification],
  );

  // ── carryLetter ───────────────────────────────────────────────────────────

  const carryLetter = useCallback(
    (from: Character, letter: Letter) => {
      if (!letter.to_character_alive || carriedLetterIds.includes(letter.id)) return;

      const target = allCharacters.find((item) => item.name === letter.to_character);
      setCarriedLetterIds((prev) => [...prev, letter.id]);
      showToast(`你将这封信带回了生者空间，${letter.to_character}也许会有所感知`);

      addNotification({
        type: "echo_carried",
        title: "你带出了一封信",
        body: `${from.name}写给${letter.to_character}的信已被你带回生者空间`,
        characterId: from.id,
        relatedId: letter.id,
      });

      if (!target) return;

      const createEchoPost = (content: string): Post => ({
        id: `emotion-${letter.id}`,
        characterId: target.id,
        type: "共鸣回声",
        time: "刚刚",
        note: "因为有观众从逝者空间带回了一丝回声",
        text: content,
        linkedEchoId: letter.id,
      });

      api.feed
        .generate(target.id, "unsent_letter", letter.content)
        .then((data) => {
          const content = data?.post?.content ?? data?.content;
          const post = createEchoPost(
            content ?? `${target.name}忽然停下手中的事，像是感知到了什么，却说不清楚。`,
          );
          setEmotionPosts((prev) => ({
            ...prev,
            [target.id]: [...(prev[target.id] ?? []), post],
          }));
          addNotification({
            type: "echo_resonance",
            title: "回声已在生者空间留下痕迹",
            body: `你带回的那封信，已在生者空间形成一条新的共鸣动态`,
            characterId: target.id,
            relatedId: post.id,
          });
        })
        .catch(() => {
          // Fallback: always create a resonance post so the feature never silently fails
          const post = createEchoPost(
            `${target.name}忽然停下手中的事，像是感知到了什么，却说不清楚。`,
          );
          setEmotionPosts((prev) => ({
            ...prev,
            [target.id]: [...(prev[target.id] ?? []), post],
          }));
          addNotification({
            type: "echo_resonance",
            title: "回声已在生者空间留下痕迹",
            body: `你带回的那封信，已在生者空间形成一条新的共鸣动态`,
            characterId: target.id,
            relatedId: post.id,
          });
        });
    },
    [carriedLetterIds, allCharacters, showToast, addNotification],
  );

  // ── Context value ─────────────────────────────────────────────────────────

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <AppContext.Provider
      value={{
        allCharacters,
        emotionPosts,
        carriedLetterIds,
        carriedCount: carriedLetterIds.length,
        interactionCounts,
        pendingCards,
        notifications,
        unreadNotificationCount,
        incrementInteraction,
        requestFriend,
        acceptFriend,
        carryLetter,
        addPendingCard,
        addNotification,
        markNotificationsRead,
        showToast,
        toast,
        clearToast: () => setToast(null),
      }}
    >
      {children}
      <Toast />
    </AppContext.Provider>
  );
}
