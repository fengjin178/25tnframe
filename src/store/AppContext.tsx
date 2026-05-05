import React, { createContext, useContext, useMemo, useState } from "react";
import type { AppState, Character, FriendStatus, Letter, Post, RecommendedCard } from "../types";
import { characters } from "../data/characters";

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [friendOverrides, setFriendOverrides] = useState<Record<string, FriendStatus>>({});
  const [emotionPosts, setEmotionPosts] = useState<Record<string, Post[]>>({});
  const [carriedLetterIds, setCarriedLetterIds] = useState<string[]>([]);
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({});
  const [pendingCards, setPendingCards] = useState<RecommendedCard[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const allCharacters = useMemo(
    () => characters.map((item) => ({ ...item, friend_status: friendOverrides[item.id] ?? item.friend_status })),
    [friendOverrides],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const incrementInteraction = (characterId: string) => {
    setInteractionCounts((prev) => ({ ...prev, [characterId]: (prev[characterId] ?? 0) + 1 }));
  };

  // 修正：用户可以同时关注生者和逝者，移除原有的 hasMismatch 限制
  const requestFriend = (character: Character) => {
    const current = friendOverrides[character.id] ?? character.friend_status;
    if (current !== "none") {
      showToast(current === "pending" ? `已向${character.name}发送过申请，等待回应中` : `${character.name}已是你的好友`);
      return;
    }
    setFriendOverrides((prev) => ({ ...prev, [character.id]: "pending" }));
    showToast(`已向${character.name}发送好友申请`);
  };

  const carryLetter = (from: Character, letter: Letter) => {
    if (!letter.to_character_alive || carriedLetterIds.includes(letter.id)) return;
    const target = allCharacters.find((item) => item.name === letter.to_character);
    setCarriedLetterIds((prev) => [...prev, letter.id]);
    showToast(`你将这封信带回了生者空间，${letter.to_character}也许会有所感知`);
    if (!target) return;
    fetch("/api/feed/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: target.id, triggerType: "unsent_letter", context: letter.content }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.post?.content) {
          setEmotionPosts((prev) => ({
            ...prev,
            [target.id]: [
              ...(prev[target.id] ?? []),
              {
                id: `emotion-${letter.id}`,
                characterId: target.id,
                type: "共鸣回声" as const,
                time: "刚刚",
                note: "因为有观众从逝者空间带回了一丝回声",
                text: data.post.content,
              },
            ],
          }));
        }
      })
      .catch(() => {});
  };

  return (
    <AppContext.Provider
      value={{
        allCharacters,
        emotionPosts,
        carriedLetterIds,
        carriedCount: carriedLetterIds.length,
        interactionCounts,
        incrementInteraction,
        requestFriend,
        carryLetter,
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
