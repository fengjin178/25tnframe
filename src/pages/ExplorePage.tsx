import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Page, SegmentedTabs } from "../components/Page";
import { Avatar, LifeBadge, StackedAvatars } from "../components/Avatar";
import { useApp } from "../store/AppContext";
import { dramas } from "../data/dramas";
import { groups } from "../data/groups";
import { getCharacterById } from "../data/characters";
import type { Character, Group } from "../types";

type ExploreTab = "剧集" | "角色" | "群聊";

function canEnterGroup(status: Group["status"]) {
  return status === "已加入";
}

function groupLockHint(group: Group) {
  if (group.status === "审核中") return "该群仍在审核中，暂时不能进入";
  if (group.spaceType === "mixed") return "该群属于观众空间议题组，需先申请后才可查看观点摘录";
  return "请先申请加入该群，当前不能直接进入";
}

function DramaAccordion() {
  const navigate = useNavigate();
  const { allCharacters, requestFriend, showToast } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {dramas.map((drama) => {
        const isOpen = expanded === drama.id;
        const dramaChars = allCharacters.filter((c) => c.dramaId === drama.id);
        const living = dramaChars.filter((c) => c.is_alive);
        const deceased = dramaChars.filter((c) => !c.is_alive);
        const dramaGroups = groups.filter((g) =>
          g.members.some((id) => dramaChars.some((c) => c.id === id)),
        );

        return (
          <div key={drama.id} className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
            <button
              onClick={() => setExpanded(isOpen ? null : drama.id)}
              className="flex w-full items-center justify-between p-4 text-left"
              style={{ backgroundColor: isOpen ? drama.bgColor : undefined }}
            >
              <div>
                <h2 className="font-black" style={{ color: isOpen ? drama.coverColor : undefined }}>
                  {drama.title}
                </h2>
                <p className="mt-0.5 text-xs text-[#766D62]">{drama.description}</p>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-[#766D62]" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-[#766D62]" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-black/[0.06] p-4 space-y-4">
                {living.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold text-[#C4643A]">生者空间</p>
                    <div className="grid grid-cols-2 gap-2">
                      {living.map((c) => (
                        <CharacterCard key={c.id} character={c} onNavigate={() => navigate(`/character/${c.id}`)} onRequest={() => requestFriend(c)} />
                      ))}
                    </div>
                  </div>
                )}
                {deceased.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold text-[#4A7A8A]">逝者空间</p>
                    <div className="grid grid-cols-2 gap-2">
                      {deceased.map((c) => (
                        <CharacterCard key={c.id} character={c} onNavigate={() => navigate(`/character/${c.id}`)} onRequest={() => requestFriend(c)} />
                      ))}
                    </div>
                  </div>
                )}
                {dramaGroups.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold text-[#7B5EA7]">相关群聊</p>
                    <div className="space-y-2">
                      {dramaGroups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            if (canEnterGroup(g.status)) {
                              navigate(`/group/${g.id}`);
                              return;
                            }
                            showToast(groupLockHint(g));
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg border border-black/[0.06] bg-[#FAF7F2] p-2 text-left ${canEnterGroup(g.status) ? "" : "opacity-75"}`}
                        >
                          <StackedAvatars ids={g.members} getChar={getCharacterById} />
                          <div>
                            <p className="text-xs font-bold">{g.name}</p>
                            <p className="text-[10px] text-[#766D62]">{g.founder} · {g.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CharacterCard({ character, onNavigate, onRequest }: { character: Character; onNavigate: () => void; onRequest: () => void }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#FAF7F2] p-3">
      <button onClick={onNavigate} className="w-full text-left">
        <Avatar character={character} size="sm" />
        <h3 className="mt-2 text-sm font-bold">{character.name}</h3>
        <p className="text-[11px] text-[#766D62] leading-4">{character.role}</p>
      </button>
      <button
        onClick={onRequest}
        disabled={character.friend_status !== "none"}
        className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-bold text-white disabled:bg-[#CFC8BF] ${
          character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
        }`}
      >
        {character.friend_status === "friend" ? "已是好友" : character.friend_status === "pending" ? "申请中" : "申请好友"}
      </button>
    </div>
  );
}

function GroupList() {
  const navigate = useNavigate();
  const { interactionCounts, showToast } = useApp();
  const yinanpingProgress = Math.min(
    (interactionCounts["hua-fei"] ?? 0) + (interactionCounts["fuheng"] ?? 0) + (interactionCounts["chunyuan"] ?? 0),
    5,
  );

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => {
            if (canEnterGroup(group.status)) {
              navigate(`/group/${group.id}`);
              return;
            }
            showToast(groupLockHint(group));
          }}
          className={`w-full rounded-xl border border-black/[0.08] bg-white p-4 text-left ${canEnterGroup(group.status) ? "" : "opacity-75"}`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StackedAvatars ids={group.members} getChar={getCharacterById} />
                <h2 className="font-black">{group.name}</h2>
              </div>
              <p className="mt-1 text-xs text-[#766D62]">
                {group.founder} · {group.spaceType === "mixed" ? "观众空间议题组" : group.deadOnly ? "仅逝者可加入" : "生者可申请"}
              </p>
            </div>
            <span
              className="ml-3 shrink-0 rounded-full px-2 py-1 text-xs font-bold"
              style={{ backgroundColor: group.bgColor, color: group.textColor }}
            >
              {group.status}
            </span>
          </div>
          {group.id === "yinanping" && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-[#E5DFE9]">
                <div
                  className="h-2 rounded-full bg-[#7B5EA7] transition-all duration-500"
                  style={{ width: `${(yinanpingProgress / 5) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#766D62]">
                与华妃、傅恒、纯元皇后任意一人互动超过5次 · 当前 {yinanpingProgress}/5
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function AllCharacters() {
  const navigate = useNavigate();
  const { allCharacters, requestFriend } = useApp();
  const [filter, setFilter] = useState<"全部" | "生者" | "逝者">("全部");

  const filtered = allCharacters.filter((c) => {
    if (filter === "生者") return c.is_alive;
    if (filter === "逝者") return !c.is_alive;
    return true;
  });

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["全部", "生者", "逝者"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filter === f ? "bg-[#1A1611] text-white" : "bg-white text-[#766D62] border border-black/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((character) => (
          <section key={character.id} className="rounded-xl border border-black/[0.08] bg-white p-3">
            <button onClick={() => navigate(`/character/${character.id}`)} className="w-full text-left">
              <Avatar character={character} />
              <div className="mt-2 flex items-center gap-1.5">
                <h2 className="font-bold">{character.name}</h2>
                <LifeBadge character={character} />
              </div>
              <p className="min-h-8 text-xs leading-5 text-[#766D62]">{character.drama} · {character.role}</p>
            </button>
            <button
              onClick={() => requestFriend(character)}
              disabled={character.friend_status !== "none"}
              className={`mt-2 w-full rounded-lg py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF] ${
                character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
              }`}
            >
              {character.friend_status === "friend" ? "已是好友" : character.friend_status === "pending" ? "待通过" : "申请加好友"}
            </button>
          </section>
        ))}
        <button
          onClick={() => {}}
          className="min-h-40 rounded-xl border border-dashed border-[#B8AFA5] bg-white/40 p-3 text-[#766D62]"
        >
          <Plus className="mx-auto mb-2 h-6 w-6" />
          更多角色即将上线
        </button>
      </div>
    </div>
  );
}

export function ExplorePage() {
  const [tab, setTab] = useState<ExploreTab>("剧集");

  return (
    <Page title="探索">
      <SegmentedTabs<ExploreTab> tabs={["剧集", "角色", "群聊"]} value={tab} onChange={setTab} />
      {tab === "剧集" && <DramaAccordion />}
      {tab === "角色" && <AllCharacters />}
      {tab === "群聊" && <GroupList />}
    </Page>
  );
}
