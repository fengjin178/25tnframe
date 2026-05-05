import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { Character, Comment, Post } from "../types";
import { characters } from "../data/characters";
import { initialComments, stableLikeCount } from "../data/feedSeeds";
import { useApp } from "../store/AppContext";
import { api } from "../services/api";
import { Avatar, StackedAvatars } from "./Avatar";
import { LifeBadge } from "./Avatar";

function getCharacterById(id: string): Character {
  return characters.find((c) => c.id === id) ?? characters[0];
}

function TypePill({ type, alive }: { type: Post["type"]; alive: boolean }) {
  const cls =
    type === "跨剧互动"
      ? "bg-[#F0EAF8] text-[#7B5EA7]"
      : type === "情绪波动" || type === "共鸣回声"
        ? "bg-[#ECE4D5] text-[#7E5D2E]"
        : alive
          ? "bg-[#F7E3D6] text-[#C4643A]"
          : "bg-[#DDECEF] text-[#4A7A8A]";
  return <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{type}</div>;
}

function CommentItem({ comment }: { comment: Comment }) {
  const character = comment.characterId ? getCharacterById(comment.characterId) : null;
  return (
    <div className={`py-2 ${comment.replyTo ? "ml-7 border-l border-black/10 pl-3" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-[#766D62]">
        {character && <Avatar character={character} size="sm" />}
        <span className="font-bold">
          {character
            ? `${character.name}《${character.drama}》· ${character.is_alive ? "生者" : "逝者"}`
            : `我 ${comment.authorName ?? ""}`}
        </span>
      </div>
      {comment.replyTo && <p className="mt-1 text-xs text-[#8A7461]">回复 {comment.replyTo}：</p>}
      <p className="mt-1 font-serif text-sm leading-6">"{comment.text}"</p>
      <p className="mt-1 text-right text-xs text-[#766D62]">♡ {comment.likes}</p>
    </div>
  );
}

function CommentBlock({ post, character }: { post: Post; character: Character }) {
  const [draft, setDraft] = useState("");
  const [asRole, setAsRole] = useState("viewer");
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments[post.id] ?? []);
  const [submitting, setSubmitting] = useState(false);

  const selected = asRole === "viewer" ? null : getCharacterById(asRole);
  const canRoleComment = !selected || selected.is_alive === character.is_alive;

  const submitComment = async () => {
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);

    if (asRole === "viewer") {
      setLocalComments((prev) => [...prev, { id: `user-${Date.now()}`, authorName: "我", text, likes: 0 }]);
      setDraft("");
      setSubmitting(false);
      return;
    }

    if (!canRoleComment) {
      setSubmitting(false);
      return;
    }

    try {
      const data = await api.comments.generate(character.id, post.text, asRole);
      if (data.blocked) {
        setLocalComments((prev) => [
          ...prev,
          { id: `blocked-${Date.now()}`, authorName: "系统", text: data.reason, likes: 0 },
        ]);
      } else if (data.text) {
        setLocalComments((prev) => [
          ...prev,
          { id: `ai-${Date.now()}`, characterId: data.commenterId, text: data.text, likes: 0 },
        ]);
      }
    } catch {
      const commenter = getCharacterById(asRole);
      setLocalComments((prev) => [
        ...prev,
        { id: `fb-${Date.now()}`, characterId: asRole, text: `${commenter.name}沉默片刻，没有说话。`, likes: 0 },
      ]);
    }
    setDraft("");
    setSubmitting(false);
  };

  return (
    <section className="mt-4 space-y-3 border-t border-black/[0.06] pt-3">
      {localComments.length > 0 && (
        <div className={`rounded-xl p-3 ${character.is_alive ? "bg-[#FDF8F0]" : "bg-[#F0F4F8]"}`}>
          <p className="mb-2 text-[11px] font-bold text-[#766D62]">评论</p>
          {localComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
      <div className="rounded-xl bg-[#FAF7F2] p-3">
        <div className="mb-2 flex gap-2">
          <select
            value={asRole}
            onChange={(e) => setAsRole(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-xs"
          >
            <option value="viewer">我（观众）</option>
            {characters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        {!canRoleComment && (
          <p className="mb-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#4A7A8A]">
            生者与逝者之间无法直接交流
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder={asRole === "viewer" ? "写下你的评论" : `以${getCharacterById(asRole).name}的身份评论`}
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={submitComment}
            disabled={!draft.trim() || submitting || (!canRoleComment && asRole !== "viewer")}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF] ${
              character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
            }`}
          >
            {submitting ? "…" : "发送"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function PostCard({ character, post }: { character: Character; post: Post }) {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isGroup = post.type === "群组动态";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => stableLikeCount(post.id));
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  };

  return (
    <article
      className={`rounded-xl border border-black/[0.08] p-4 shadow-[0_10px_28px_rgba(70,45,20,0.06)] ${
        isGroup ? "bg-[#F5F0F8]" : "bg-white"
      }`}
    >
      {post.source && (
        <div className="mb-3 border-l-4 border-[#7B5EA7] bg-[#F0EAF8] px-3 py-2 text-[10px] font-medium text-[#7B5EA7]">
          因与《<b>{post.source.drama}</b>》{post.source.character}的一次对话
        </div>
      )}
      {isGroup && post.group ? (
        <button onClick={() => navigate("/group/yinanping")} className="mb-3 w-full text-left">
          <div className="mb-2 inline-flex rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-[#7B5EA7]">
            群组动态
          </div>
          <div className="flex items-center gap-3">
            <StackedAvatars ids={post.group.members} getChar={getCharacterById} />
            <div>
              <h2 className="font-black text-[#4B365E]">{post.group.name}</h2>
              <p className="text-xs text-[#766D62]">{post.group.founder} · 成员参与</p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => navigate(`/character/${character.id}`)}
          className="mb-3 flex w-full items-center gap-3 text-left"
        >
          <Avatar character={character} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{character.name}</h2>
              <LifeBadge character={character} />
            </div>
            <p className="text-xs text-[#766D62]">
              {character.is_alive ? "生者空间" : "逝者空间"} · {post.time ?? "刚刚"}
            </p>
          </div>
        </button>
      )}
      <TypePill type={post.type} alive={character.is_alive} />
      {post.note && (
        <p className="mb-2 rounded-lg bg-[#FAF7F2] px-3 py-2 text-xs leading-5 text-[#8A7461]">{post.note}</p>
      )}
      <p className="whitespace-pre-line font-serif text-[15px] leading-7 text-[#292018]">{post.text}</p>
      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3 text-sm font-semibold text-[#766D62]">
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-[#C4643A]" : ""}`}
        >
          <MessageCircle className="h-4 w-4" />
          评论
        </button>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${liked ? "text-[#C4643A]" : ""}`}
        >
          <Heart
            className={`h-4 w-4 transition-all ${liked ? "scale-110 fill-[#C4643A] text-[#C4643A]" : ""}`}
          />
          {likeCount.toLocaleString()}
        </button>
        <button onClick={() => showToast("已转发到你的动态")} className="flex items-center gap-1.5 active:text-[#C4643A]">
          <Share2 className="h-4 w-4" />
          转发
        </button>
      </div>
      {showComments && <CommentBlock post={post} character={character} />}
    </article>
  );
}
