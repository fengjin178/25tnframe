import { Lock } from "lucide-react";
import type { Character } from "../types";
import { useApp } from "../store/AppContext";

const UNLOCK_THRESHOLD = 3;

const unlockHints: Record<string, string> = {
  "zhen-huan": '她后来再提起那一炉香时，只说"人心比香灰冷得更快"。',
  "hua-fei": "那年杏花微雨，她独坐廊下，将一封信烧成灰，却始终没有哭。",
  "fuheng": "他在边关的最后一夜，梦见的不是战场，而是一条宫廊。",
  "chunyuan": "她说，若有来生，不入这深宫，只做寻常人家的女儿。",
  "wei-yingluo": "她后来才明白，那些锋芒，不过是另一种形式的软弱。",
  "fucha": "皇后的最后一道懿旨，没有人知道写的是什么。",
  "mi-yue": "她登上那个位置的那一刻，想起了很多人，却没有一个是她想感谢的。",
};

export function UnlockCard({ character }: { character: Character }) {
  const { interactionCounts } = useApp();
  const count = Math.min(interactionCounts[character.id] ?? 0, UNLOCK_THRESHOLD);
  const unlocked = count >= UNLOCK_THRESHOLD;
  const hint = unlockHints[character.id] ?? "与角色深入互动后，隐藏番外将逐渐浮现。";

  return (
    <section className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#554B42]">
        <Lock className="h-4 w-4" />
        隐藏番外
      </div>
      <p className="font-serif text-sm leading-6 text-[#766D62]">{hint}</p>
      {!unlocked && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#E5DFD9]">
            <div
              className="h-1.5 rounded-full bg-[#C4643A] transition-all duration-500"
              style={{ width: `${(count / UNLOCK_THRESHOLD) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-[#A06B4F]">
            与{character.name}互动{UNLOCK_THRESHOLD}次后解锁 · 已互动 {count}/{UNLOCK_THRESHOLD}
          </p>
        </div>
      )}
      {unlocked && (
        <div className="mt-3 rounded-lg bg-[#FDF8F0] px-3 py-2 text-xs font-semibold text-[#C4643A]">
          番外已解锁 — 完整内容即将上线
        </div>
      )}
    </section>
  );
}
