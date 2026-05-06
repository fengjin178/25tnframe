import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, Mail } from "lucide-react";
import { Avatar, LifeBadge } from "../components/Avatar";
import { PostCard } from "../components/PostCard";
import { UnlockCard } from "../components/UnlockCard";
import { SegmentedTabs } from "../components/Page";
import { useApp } from "../store/AppContext";
import { relatedTo, otherId, getCharacterById } from "../data/characters";
import type { Character, Letter, Post } from "../types";

function allPosts(character: Character, emotionPosts: Record<string, Post[]>): Post[] {
  return [...(character.sample_posts ?? []), ...(emotionPosts[character.id] ?? [])];
}

function RelationGraph({ character }: { character: Character }) {
  const navigate = useNavigate();
  const rels = relatedTo(character.id);

  return (
    <section className="rounded-xl border border-black/[0.08] bg-white p-4">
      <h2 className="mb-1 text-lg font-black">{character.name} 的关系网络</h2>
      <p className="mb-4 text-sm text-[#766D62]">{character.is_alive ? "生者空间" : "逝者空间"}</p>
      {rels.length === 0 ? (
        <p className="text-sm text-[#9B9087]">暂无跨剧关系记录</p>
      ) : (
        <div className="space-y-3">
          {rels.map((rel) => {
            const other = getCharacterById(otherId(rel, character.id));
            const crossSpace = other.is_alive !== character.is_alive;
            return (
              <button
                key={rel.id}
                onClick={() => navigate(`/character/${other.id}`)}
                className="relative flex w-full items-center gap-3 rounded-xl bg-[#FAF7F2] p-3 text-left"
              >
                <Avatar character={other} size="sm" />
                <div className={`h-px flex-1 ${crossSpace ? "border-t border-dashed border-[#B0AA9F]" : "bg-[#C4643A]"}`} />
                <div className="min-w-0 flex-[2]">
                  <h3 className="font-bold">{other.name}</h3>
                  <p className="text-xs text-[#766D62]">
                    {rel.relation_type} · 《{other.drama}》
                  </p>
                  {crossSpace && (
                    <p className="text-[10px] text-[#9B9087]">跨空间 · 无法直接联系</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LetterCard({
  character,
  letter,
  carried,
  onCarry,
}: {
  character: Character;
  letter: Letter;
  carried: boolean;
  onCarry: () => void;
}) {
  const [folding, setFolding] = useState(false);

  const handleCarry = () => {
    if (!letter.to_character_alive || carried || folding) return;
    setFolding(true);
    window.setTimeout(onCarry, 520);
  };

  return (
    <article
      className={`rounded-xl border border-[#B8C8D8] bg-[#EDF0F5] p-4 transition duration-500 ${
        folding ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-[#4A7A8A]">未寄出的信</span>
        <Mail className="h-4 w-4 text-[#4A7A8A]" />
      </div>
      <p className="text-sm font-bold">收信人：{letter.to_character}</p>
      <p className="mt-1 text-xs text-[#667A88]">此信无法送达</p>
      <div className="my-4 border-l-2 border-[#8BA7B7] pl-4">
        <p className="whitespace-pre-line font-serif text-[15px] italic leading-8 text-[#253743]">{letter.content}</p>
      </div>
      <p className="text-right text-xs font-semibold text-[#667A88]">
        {character.name} · {letter.written_on}
      </p>
      <button
        onClick={handleCarry}
        disabled={!letter.to_character_alive || carried}
        className="mt-4 w-full rounded-lg bg-[#4A7A8A] py-2.5 text-sm font-bold text-white disabled:bg-[#AAB7BE]"
      >
        {!letter.to_character_alive ? "此信只能留在逝者空间" : carried ? "已带回生者空间" : "带回生者空间"}
      </button>
    </article>
  );
}

export function CharacterPage() {
  const { allCharacters, emotionPosts, requestFriend, carryLetter, carriedLetterIds } = useApp();
  const { characterId } = useParams();
  const navigate = useNavigate();
  const character = allCharacters.find((c) => c.id === characterId);
  const [tab, setTab] = useState<"动态" | "番外" | "关系" | "未寄出的信">("动态");

  if (!character) return <Navigate to="/feed" replace />;

  const tabs = character.is_alive
    ? (["动态", "番外", "关系"] as const)
    : (["动态", "番外", "关系", "未寄出的信"] as const);

  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-8 text-[#1A1611]">
      <div className="mx-auto w-full max-w-[390px] px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-sm font-bold text-[#766D62]"
        >
          <ChevronLeft className="h-4 w-4" /> 返回
        </button>

        <section className="rounded-xl border border-black/[0.08] bg-white p-5">
          <div className="flex gap-4">
            <Avatar character={character} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{character.name}</h1>
                <LifeBadge character={character} />
              </div>
              <p className="mt-1 text-sm text-[#766D62]">{character.drama}</p>
              <p className="mt-2 text-sm leading-6">{character.role}</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-[#FAF7F2] p-3 text-xs leading-5 text-[#766D62]">
            {character.personality_type} · {character.social_style}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/chat/${character.id}`)}
              className={`rounded-lg py-2.5 text-sm font-bold text-white ${
                character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
              }`}
            >
              私信
            </button>
            <button
              onClick={() => requestFriend(character)}
              disabled={character.friend_status !== "none"}
              className="rounded-lg border border-black/10 py-2.5 text-sm font-bold text-[#554B42] disabled:bg-[#F0ECE6] disabled:text-[#9B9087]"
            >
              {character.friend_status === "friend" ? "已是好友" : character.friend_status === "pending" ? "申请中" : "申请好友"}
            </button>
          </div>
          {!character.is_alive && (
            <div className="mt-3 rounded-xl bg-[#EDF0F5] px-3 py-3 text-xs leading-5 text-[#4A7A8A]">
              想激活逝者的信：切到下方“未寄出的信”标签。只有写给生者的信，才能由观众带回生者空间，触发一条“共鸣动态”。
            </div>
          )}
        </section>

        <SegmentedTabs tabs={tabs} value={tab} onChange={(t) => setTab(t as typeof tab)} />

        {tab === "动态" && (
          <div className="space-y-3">
            {allPosts(character, emotionPosts).map((post) => (
              <PostCard key={post.id} post={post} character={character} />
            ))}
          </div>
        )}
        {tab === "番外" && <UnlockCard character={character} />}
        {tab === "关系" && <RelationGraph character={character} />}
        {tab === "未寄出的信" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#B8C8D8] bg-[#F7FAFC] px-4 py-3 text-xs leading-5 text-[#4A7A8A]">
              这里是逝者留在第25帧里的未寄出回声。观众不能替他们改写结局，只能把“写给生者”的信带回去，让生者感知到一丝迟来的回响。
            </div>
            {(character.unsent_letters ?? []).map((letter) => (
              <LetterCard
                key={letter.id}
                character={character}
                letter={letter}
                carried={carriedLetterIds.includes(letter.id)}
                onCarry={() => carryLetter(character, letter)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
