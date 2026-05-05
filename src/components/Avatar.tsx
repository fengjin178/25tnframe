import type { Character } from "../types";

export function Avatar({ character, size = "md" }: { character: Character; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-lg", lg: "h-20 w-20 text-3xl" };
  return (
    <div
      className={`${sizes[size]} grid shrink-0 place-items-center rounded-full border border-black/10 font-serif font-semibold shadow-sm ${
        character.is_alive ? "bg-[#F8DFCC] text-[#8A3E22]" : "bg-[#DDE8EE] text-[#315D69]"
      }`}
    >
      {character.initial}
    </div>
  );
}

export function LifeBadge({ character }: { character: Character }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        character.is_alive ? "bg-[#F6E0D3] text-[#C4643A]" : "bg-[#DDECEF] text-[#4A7A8A]"
      }`}
    >
      {character.is_alive ? "生者" : `逝者 E${character.offline_episode ?? 0}`}
    </span>
  );
}

export function StackedAvatars({ ids, getChar }: { ids: string[]; getChar: (id: string) => Character }) {
  return (
    <div className="flex w-16">
      {ids.slice(0, 3).map((id, index) => (
        <div key={id} className="-mr-5" style={{ zIndex: 5 - index }}>
          <Avatar character={getChar(id)} size="sm" />
        </div>
      ))}
    </div>
  );
}
