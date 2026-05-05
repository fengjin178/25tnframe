import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Page, SegmentedTabs } from "../components/Page";
import { Avatar, StackedAvatars } from "../components/Avatar";
import { useApp } from "../store/AppContext";
import { groups } from "../data/groups";
import { getCharacterById } from "../data/characters";
import type { Character } from "../types";

type MessagesTab = "私信" | "群聊" | "角色";

function CharacterTile({ character }: { character: Character }) {
  const navigate = useNavigate();
  return (
    <section className={`rounded-xl border border-black/[0.08] bg-white p-3 ${character.friend_status === "pending" ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between">
        <Avatar character={character} size="sm" />
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${character.is_alive ? "bg-[#3AA56B]" : "bg-[#7F98A3]"}`} />
      </div>
      <h2 className="mt-3 font-bold">{character.name}</h2>
      <p className="text-xs text-[#766D62]">{character.is_alive ? "在线" : "回声"}</p>
      <button
        onClick={() => navigate(`/chat/${character.id}`)}
        disabled={character.friend_status === "pending"}
        className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF] ${
          character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
        }`}
      >
        {character.friend_status === "pending" ? "等待中" : "私信"}
      </button>
    </section>
  );
}

function ChatListItem({ character }: { character: Character }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/chat/${character.id}`)}
      className="flex w-full items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-4 text-left"
    >
      <Avatar character={character} />
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{character.name}</h2>
        <p className="truncate text-sm text-[#766D62]">
          {character.is_alive ? "我在，慢慢说。" : "回声已收到你的上一句话。"}
        </p>
      </div>
    </button>
  );
}

function GroupList() {
  const navigate = useNavigate();
  const { interactionCounts } = useApp();
  const yinanpingProgress = Math.min(
    (interactionCounts["hua-fei"] ?? 0) + (interactionCounts["fuheng"] ?? 0) + (interactionCounts["chunyuan"] ?? 0),
    5,
  );

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => navigate(`/group/${group.id}`)}
          className="w-full rounded-xl border border-black/[0.08] bg-white p-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StackedAvatars ids={group.members} getChar={getCharacterById} />
                <h2 className="font-black">{group.name}</h2>
              </div>
              <p className="mt-1 text-xs text-[#766D62]">
                {group.founder} · {group.deadOnly ? "仅逝者可加入" : "生者可申请"}
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

export function MessagesPage() {
  const { allCharacters } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<MessagesTab>("私信");

  const friends = allCharacters.filter((c) => c.friend_status === "friend");
  const contacts = allCharacters.filter((c) => c.friend_status === "friend" || c.friend_status === "pending");

  return (
    <Page title="消息">
      <SegmentedTabs<MessagesTab> tabs={["私信", "群聊", "角色"]} value={tab} onChange={setTab} />
      {tab === "私信" && (
        <div className="space-y-3">
          {friends.map((c) => (
            <ChatListItem key={c.id} character={c} />
          ))}
          {friends.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-6 text-center">
              <p className="text-sm text-[#766D62]">还没有好友，去探索页申请吧</p>
              <button
                onClick={() => navigate("/explore")}
                className="mt-3 rounded-lg bg-[#C4643A] px-4 py-2 text-xs font-bold text-white"
              >
                去探索
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "群聊" && <GroupList />}
      {tab === "角色" && (
        <div className="grid grid-cols-2 gap-3">
          {contacts.map((c) => (
            <CharacterTile key={c.id} character={c} />
          ))}
          <button
            onClick={() => navigate("/explore")}
            className="min-h-40 rounded-xl border border-dashed border-[#B8AFA5] bg-white/40 p-3 text-[#766D62]"
          >
            <Plus className="mx-auto mb-2 h-6 w-6" />
            +申请加友
          </button>
        </div>
      )}
    </Page>
  );
}
