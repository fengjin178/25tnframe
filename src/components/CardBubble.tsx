import type { RecommendedCard } from "../types";
import { getCharacterById } from "../data/characters";
import { Avatar, LifeBadge } from "./Avatar";

const decisionLabel: Record<RecommendedCard["decision"], string> = {
  pending: "等待回应…",
  accepted: "已接受名片",
  interested: "表示感兴趣",
  rejected: "婉拒了名片",
};

const decisionColor: Record<RecommendedCard["decision"], string> = {
  pending: "text-[#9B9087]",
  accepted: "text-[#C4643A]",
  interested: "text-[#7B5EA7]",
  rejected: "text-[#4A7A8A]",
};

export function CardBubble({ card }: { card: RecommendedCard }) {
  const recommended = getCharacterById(card.recommendedCharacterId);

  return (
    <div className="max-w-[220px] rounded-xl border border-black/[0.08] bg-white p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9B9087]">推荐名片</p>
      <div className="flex items-center gap-2">
        <Avatar character={recommended} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm">{recommended.name}</span>
            <LifeBadge character={recommended} />
          </div>
          <p className="text-[11px] text-[#766D62] truncate">《{recommended.drama}》</p>
        </div>
      </div>
      {card.dramaCrossed && (
        <p className="mt-2 text-[10px] text-[#7B5EA7] font-medium">跨剧推荐</p>
      )}
      <div className={`mt-2 text-[11px] font-semibold ${decisionColor[card.decision]}`}>
        {decisionLabel[card.decision]}
      </div>
    </div>
  );
}
