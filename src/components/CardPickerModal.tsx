import { X } from "lucide-react";
import type { Character } from "../types";
import { characters } from "../data/characters";
import { Avatar, LifeBadge } from "./Avatar";

interface Props {
  targetCharacter: Character;
  onSelect: (recommended: Character) => void;
  onClose: () => void;
}

export function CardPickerModal({ targetCharacter, onSelect, onClose }: Props) {
  const candidates = characters.filter(
    (c) => c.id !== targetCharacter.id && c.is_alive === targetCharacter.is_alive,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[390px] rounded-t-2xl bg-[#FAF7F2] pb-8">
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div>
            <h2 className="font-black text-[#1A1611]">推荐名片</h2>
            <p className="text-xs text-[#766D62]">
              向{targetCharacter.name}推荐一位{targetCharacter.is_alive ? "生者" : "逝者"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#766D62] hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {candidates.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#9B9087]">
            暂无可推荐的{targetCharacter.is_alive ? "生者" : "逝者"}角色
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto px-4">
            <div className="space-y-2 pb-2">
              {candidates.map((character) => (
                <button
                  key={character.id}
                  onClick={() => onSelect(character)}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-3 text-left transition-colors active:bg-[#F5F0E8]"
                >
                  <Avatar character={character} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{character.name}</span>
                      <LifeBadge character={character} />
                    </div>
                    <p className="truncate text-xs text-[#766D62]">
                      《{character.drama}》· {character.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
