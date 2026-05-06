import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Send } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { CardBubble } from "../components/CardBubble";
import { CardPickerModal } from "../components/CardPickerModal";
import { useApp } from "../store/AppContext";
import { api } from "../services/api";
import type { Character, ChatMessage, RecommendedCard } from "../types";

const chatProfiles: Record<
  string,
  { delay: [number, number]; bubble: string; system?: string; typing?: string; proactive?: string; replies: string[] }
> = {
  "hua-fei": {
    delay: [2000, 4000],
    bubble: "bg-[#E8EDF2] border border-[#B8C8D8] text-[#253743]",
    system: "华妃不轻易与人深交，你需要先展示诚意",
    replies: ["本宫不爱听虚话。你若真懂，就说重点。", "输不可怕，可怕的是输得不明不白。"],
  },
  "wei-yingluo": {
    delay: [300, 800],
    bubble: "bg-[#F5EFE6] border border-black/[0.05] text-[#2A211A]",
    proactive: "有话直说，本姑娘没工夫猜。",
    replies: ["这话倒还算痛快。", "能动手解决的事，少绕弯子。"],
  },
  miyue: {
    delay: [1000, 2500],
    bubble: "bg-[#F5EFE6] border border-black/[0.05] text-[#2A211A]",
    system: "芈月只与值得交谈的人深聊",
    replies: ["人心不可托，权力可借。", "看清代价，再谈选择。"],
  },
  chunyuan: {
    delay: [3000, 6000],
    bubble: "bg-[#E8EDF2] border border-[#B8C8D8] text-[#253743]",
    typing: "声音从很远的地方传来……",
    replies: ["……", "有些话，迟到许多年，也仍然会伤人。"],
  },
};

function Bubble({
  message,
  character,
  bubbleClass,
}: {
  message: ChatMessage;
  character: Character;
  bubbleClass: string;
}) {
  const isUser = message.from === "user";

  if (message.type === "system") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-[#F0EAF8] px-3 py-1 text-[11px] font-semibold text-[#7B5EA7]">
          {message.text}
        </span>
      </div>
    );
  }

  if (message.type === "card" && message.cardPayload) {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <CardBubble card={message.cardPayload} />
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
          isUser ? "border border-[#1A1611] bg-[#1A1611] text-white" : bubbleClass
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

export function ChatPage() {
  const { allCharacters, incrementInteraction, addPendingCard } = useApp();
  const { characterId } = useParams();
  const navigate = useNavigate();
  const character = allCharacters.find((c) => c.id === characterId) ?? allCharacters[0];
  const profile = chatProfiles[character.id] ?? {
    delay: character.is_alive ? [700, 1400] : [1800, 3200],
    bubble: character.is_alive ? "bg-[#F5EFE6] border border-black/[0.05]" : "bg-[#E8EDF2] border border-[#B8C8D8]",
    replies: ["我在听。"],
  };

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "character",
      text: character.is_alive
        ? "我在。你若有话，就慢慢说。"
        : "这里是回声空间。话会晚一点抵达，但不会丢。",
      type: "text",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!profile.proactive) return;
    const timer = window.setTimeout(
      () => setMessages((prev) => [...prev, { from: "character", text: profile.proactive ?? "", type: "text" }]),
      4500,
    );
    return () => window.clearTimeout(timer);
  }, [profile.proactive]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { from: "user", text, type: "text" }];
    setMessages(nextMessages);
    setTyping(true);

    try {
      const data = await api.chat.send(character.id, text, messages);
      setMessages((prev) => [
        ...prev,
        { from: "character", text: data.reply || profile.replies[0] || "我在听。", type: "text" },
      ]);
      incrementInteraction(character.id);
    } catch {
      const [min, max] = profile.delay;
      window.setTimeout(() => {
        const reply = profile.replies[Math.floor(Math.random() * profile.replies.length)] || "我在听。";
        setMessages((prev) => [...prev, { from: "character", text: reply, type: "text" }]);
        incrementInteraction(character.id);
      }, Math.min(900, min + Math.random() * (max - min)));
    } finally {
      setTyping(false);
    }
  };

  const sendCard = async (recommended: Character) => {
    setShowCardPicker(false);

    const cardPayload: RecommendedCard = {
      id: `card-${Date.now()}`,
      targetCharacterId: character.id,
      recommendedCharacterId: recommended.id,
      space: character.is_alive ? "living" : "deceased",
      dramaCrossed: recommended.dramaId !== character.dramaId,
      decision: "pending",
      responseText: "",
    };

    setMessages((prev) => [
      ...prev,
      { from: "user", text: `推荐了${recommended.name}的名片`, type: "card", cardPayload },
    ]);

    try {
      const data = await api.cards.recommend(character.id, recommended.id);
      const decision: RecommendedCard["decision"] = data.card?.decision ?? "interested";
      const responseText: string = data.card?.responseText ?? `${character.name}看了看名片，没有说话。`;

      setMessages((prev) =>
        prev.map((m) =>
          m.cardPayload?.id === cardPayload.id
            ? { ...m, cardPayload: { ...cardPayload, decision, responseText } }
            : m,
        ),
      );

      setMessages((prev) => [
        ...prev,
        { from: "character", text: responseText, type: "text" },
      ]);

      if (decision === "accepted" || decision === "interested") {
        addPendingCard({ ...cardPayload, decision, responseText });
        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { from: "character", text: "潜在连接已建立", type: "system" },
          ]);
        }, 800);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.cardPayload?.id === cardPayload.id
            ? { ...m, cardPayload: { ...cardPayload, decision: "interested", responseText: "" } }
            : m,
        ),
      );
      setMessages((prev) => [
        ...prev,
        { from: "character", text: `${character.name}沉默片刻，将名片收了起来。`, type: "text" },
      ]);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1A1611]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col">
        <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-[#FAF7F2]/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Avatar character={character} size="sm" />
            <div>
              <h1 className="font-black">{character.name}</h1>
              <p className="text-xs text-[#766D62]">{character.is_alive ? "在线" : "回声"} · 《{character.drama}》</p>
            </div>
          </div>
          {!character.is_alive && (
            <p className="mt-3 rounded-lg bg-[#E8EDF2] px-3 py-2 text-xs font-semibold text-[#4A7A8A]">
              你正在与逝者空间的{character.name}交流
            </p>
          )}
          {profile.system && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#766D62]">{profile.system}</p>
          )}
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message, index) => (
            <Bubble key={index} message={message} character={character} bubbleClass={profile.bubble} />
          ))}
          {typing && (
            <div className="text-xs text-[#766D62]">{profile.typing ?? "对方正在输入..."}</div>
          )}
          {messages.length >= 10 && !character.is_alive && (
            <p className="rounded-xl border border-dashed border-[#B8C8D8] bg-[#EDF0F5] p-3 text-xs text-[#4A7A8A]">
              对话已达10条，「未寄出的信」入口已在角色主页解锁
            </p>
          )}
          <div ref={bottomRef} />
        </section>

        <footer className="border-t border-black/[0.06] bg-[#FAF7F2] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2">
            <button
              onClick={() => setShowCardPicker(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#766D62] hover:bg-[#F0ECE6]"
              title="推荐名片"
            >
              <CreditCard className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`给${character.name}发消息`}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className={`grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-40 ${
                character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>

      {showCardPicker && (
        <CardPickerModal
          targetCharacter={character}
          onSelect={sendCard}
          onClose={() => setShowCardPicker(false)}
        />
      )}
    </main>
  );
}
