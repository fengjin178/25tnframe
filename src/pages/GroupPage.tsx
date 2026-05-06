import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import { Avatar, StackedAvatars } from "../components/Avatar";
import { getCharacterById } from "../data/characters";
import { getGroupById } from "../data/groups";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import type { ChatMessage, Character } from "../types";

function splitMixedMessages(messages: ChatMessage[]) {
  const living: ChatMessage[] = [];
  const deceased: ChatMessage[] = [];

  messages.forEach((message) => {
    if (message.from !== "character" || !message.characterId) return;
    const character = getCharacterById(message.characterId);
    if (character.is_alive) {
      living.push(message);
    } else {
      deceased.push(message);
    }
  });

  return { living, deceased };
}

function PerspectiveCard({ title, tone, messages }: { title: string; tone: string; messages: ChatMessage[] }) {
  return (
    <section className="rounded-xl border border-black/[0.08] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-black">{title}</h2>
          <p className="text-[11px] text-[#766D62]">{tone}</p>
        </div>
        <span className="rounded-full bg-[#FAF7F2] px-2 py-1 text-[10px] font-bold text-[#766D62]">{messages.length} 条观点</span>
      </div>
      <div className="space-y-3">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const character = message.characterId ? getCharacterById(message.characterId) : null;
            if (!character) return null;
            return (
              <div key={`${message.characterId}-${index}`} className="rounded-xl bg-[#FAF7F2] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar character={character} size="sm" />
                  <div>
                    <p className="text-sm font-bold">{character.name}</p>
                    <p className="text-[10px] text-[#9B9087]">《{character.drama}》· {character.is_alive ? "生者侧" : "逝者侧"}</p>
                  </div>
                </div>
                <p className="whitespace-pre-line font-serif text-sm leading-7 text-[#292018]">{message.text}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[#D8D0C6] bg-[#FCFBF9] p-4 text-xs leading-6 text-[#9B9087]">
            本轮议题下，这一侧暂时没有新的回应。
          </div>
        )}
      </div>
    </section>
  );
}

function MixedGroupWall({
  groupId,
  groupColor,
  prompt,
  loading,
  onPromptChange,
  onSubmit,
  messages,
}: {
  groupId: string;
  groupColor: string;
  prompt: string;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  messages: ChatMessage[];
}) {
  const mixed = useMemo(() => splitMixedMessages(messages), [messages]);
  const latestTopic = [...messages].reverse().find((message) => message.from === "user")?.text;

  return (
    <>
      <section className="space-y-4 overflow-y-auto px-4 py-4">
        <div className="rounded-xl border border-[#7B5EA7]/20 bg-[#F0EAF8] px-4 py-3 text-xs leading-5 text-[#7B5EA7]">
          <span className="font-bold">观众空间议题墙</span> · 这里不是生者与逝者的现实同群，也不是她们彼此直接收发消息的地方。你看到的是观众抛出同一议题后，两侧分别留下的观点摘录：生者留在生者侧，逝者留在逝者侧，只在你这里形成交锋。
        </div>

        <section className="rounded-xl border border-black/[0.08] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9B9087]">当前议题</p>
          <p className="mt-2 font-serif text-[15px] leading-7 text-[#292018]">
            {latestTopic ?? "请抛出一个关于权力、情感、规则或生存策略的议题。"}
          </p>
        </section>

        <PerspectiveCard title="生者侧观点" tone="仍在原有生命轨道上的判断与克制" messages={mixed.living} />
        <PerspectiveCard title="逝者侧回声" tone="已离开正片之后留下的复盘与锋利回响" messages={mixed.deceased} />
      </section>

      <footer className="border-t border-black/[0.06] bg-[#FAF7F2] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2">
          <input
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder={loading ? "两侧观点正在整理..." : "以观众身份抛出议题，观看两侧观点交锋"}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          />
          <button
            onClick={onSubmit}
            disabled={loading || !prompt.trim()}
            className="grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: groupColor }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] leading-5 text-[#9B9087]">观众空间仅并置展示，不代表生者与逝者建立了现实通信。</p>
      </footer>
    </>
  );
}

function StandardGroupChat({
  group,
  input,
  loading,
  setInput,
  send,
  messages,
  bottomRef,
}: {
  group: NonNullable<ReturnType<typeof getGroupById>>;
  input: string;
  loading: boolean;
  setInput: (value: string) => void;
  send: () => void;
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <section className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => {
          const character = message.characterId ? getCharacterById(message.characterId) : null;
          return (
            <div key={index} className={`flex gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}>
              {character && <Avatar character={character} size="sm" />}
              <div className={`max-w-[76%] ${message.from === "user" ? "text-right" : ""}`}>
                {character && (
                  <p className="mb-1 text-xs font-bold text-[#766D62]">
                    {character.name} · 《{character.drama}》
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.from === "user" ? "bg-[#1A1611] text-white" : "border border-[#B8C8D8] bg-[#E8EDF2] text-[#253743]"}`}>
                  {message.text}
                </div>
              </div>
            </div>
          );
        })}
        {loading && <p className="text-xs text-[#766D62]">角色正在回应...</p>}
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
    </>
  );
}

export function GroupPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { groupId } = useParams<{ groupId: string }>();
  const group = getGroupById(groupId ?? "") ?? getGroupById("yinanping")!;

  if (group.status !== "已加入") {
    showToast(group.status === "审核中" ? "该群仍在审核中，暂时不能进入" : "请先申请加入该群，当前不能直接进入");
    return <Navigate to="/messages" replace />;
  }

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
          : group.spaceType === "mixed"
            ? `${firstMember.name}留下了自己的第一则观察。`
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
                : group.spaceType === "mixed"
                  ? `${secondMember.name}也留下了她的第一则判断。`
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
        ...(incoming.length ? incoming : [{ from: "character" as const, characterId: group.members[0], text: "……" }]),
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
        <header className="border-b border-black/[0.06] px-4 py-3" style={{ backgroundColor: `${group.bgColor}cc` }}>
          <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm font-bold" style={{ color: group.textColor }}>
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <div className="flex items-center gap-3">
            <StackedAvatars ids={group.members} getChar={getCharacterById} />
            <div>
              <h1 className="text-xl font-black" style={{ color: group.textColor }}>{group.name}</h1>
              <p className="text-xs text-[#766D62]">
                发起人：{group.founder} · 成员：{group.members.map((id) => getCharacterById(id).name).join("、")}
              </p>
            </div>
          </div>
        </header>

        {group.spaceType === "mixed" ? (
          <MixedGroupWall
            groupId={group.id}
            groupColor={group.color}
            prompt={input}
            loading={loading}
            onPromptChange={setInput}
            onSubmit={send}
            messages={messages}
          />
        ) : (
          <StandardGroupChat
            group={group}
            input={input}
            loading={loading}
            setInput={setInput}
            send={send}
            messages={messages}
            bottomRef={bottomRef}
          />
        )}
      </div>
    </main>
  );
}
