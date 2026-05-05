import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import { Avatar, StackedAvatars } from "../components/Avatar";
import { getCharacterById } from "../data/characters";
import { getGroupById } from "../data/groups";
import { api } from "../services/api";
import type { ChatMessage } from "../types";

export function GroupPage() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const group = getGroupById(groupId ?? "") ?? getGroupById("yinanping")!;

  const firstMember = getCharacterById(group.members[0]);
  const secondMember = group.members[1] ? getCharacterById(group.members[1]) : null;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      from: "character",
      characterId: group.members[0],
      text:
        group.id === "yinanping"
          ? "本会成立宗旨：不讨论爱情值不值得，只讨论我们输在哪里。"
          : `${firstMember.name}在此。`,
    },
    ...(secondMember
      ? [
          {
            from: "character" as const,
            characterId: group.members[1],
            text:
              group.id === "yinanping"
                ? "有些结局，不是想接受，只是已经无法更改。"
                : `${secondMember.name}也在。`,
          },
        ]
      : []),
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await api.groups.send(group.id, text, messages);
      const incoming: ChatMessage[] = Array.isArray(data.messages)
        ? data.messages.map((item: { speakerId: string; text: string }) => ({
            from: "character" as const,
            characterId: item.speakerId,
            text: item.text,
          }))
        : [];
      setMessages((prev) => [
        ...prev,
        ...(incoming.length
          ? incoming
          : [{ from: "character" as const, characterId: group.members[0], text: "……" }]),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "character" as const, characterId: group.members[0], text: "……" },
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1A1611]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col">
        <header
          className="border-b border-black/[0.06] px-4 py-3"
          style={{ backgroundColor: `${group.bgColor}cc` }}
        >
          <button
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-1 text-sm font-bold"
            style={{ color: group.textColor }}
          >
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <div className="flex items-center gap-3">
            <StackedAvatars ids={group.members} getChar={getCharacterById} />
            <div>
              <h1 className="text-xl font-black" style={{ color: group.textColor }}>
                {group.name}
              </h1>
              <p className="text-xs text-[#766D62]">
                发起人：{group.founder} · 成员：{group.members.map((id) => getCharacterById(id).name).join("、")}
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((message, index) => {
            const character = message.characterId ? getCharacterById(message.characterId) : null;
            return (
              <div
                key={index}
                className={`flex gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}
              >
                {character && <Avatar character={character} size="sm" />}
                <div className={`max-w-[76%] ${message.from === "user" ? "text-right" : ""}`}>
                  {character && (
                    <p className="mb-1 text-xs font-bold text-[#766D62]">
                      {character.name} · 《{character.drama}》
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                      message.from === "user"
                        ? "bg-[#1A1611] text-white"
                        : "border border-[#B8C8D8] bg-[#E8EDF2] text-[#253743]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <p className="text-xs text-[#766D62]">角色正在回应...</p>
          )}
          <div ref={bottomRef} />
        </section>

        <footer className="border-t border-black/[0.06] bg-[#FAF7F2] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={loading ? "角色正在回应..." : "以观众身份发言"}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: group.color }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
