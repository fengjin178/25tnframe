import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, Heart, Mail, MessageCircle, Plus, Sparkles, UserCheck } from "lucide-react";
import { Page, SegmentedTabs } from "../components/Page";
import { Avatar, StackedAvatars } from "../components/Avatar";
import { useApp } from "../store/AppContext";
import { groups } from "../data/groups";
import { getCharacterById } from "../data/characters";
import type { Character, Group, Notification } from "../types";

type MessagesTab = "私信" | "群聊" | "角色" | "通知";

function canEnterGroup(status: Group["status"]) {
  return status === "已加入";
}

function groupLockHint(group: Group) {
  if (group.status === "审核中") return "该群仍在审核中，暂时不能进入";
  if (group.spaceType === "mixed") return "该群属于观众空间议题组，需先申请后才可查看观点摘录";
  return "请先申请加入该群，当前不能直接进入";
}

function CharacterTile({ character }: { character: Character }) {
  const navigate = useNavigate();
  const { acceptFriend } = useApp();
  const isPending = character.friend_status === "pending";
  return (
    <section className={`rounded-xl border border-black/[0.08] bg-white p-3 ${isPending ? "border-dashed" : ""}`}>
      <div className="flex items-start justify-between">
        <Avatar character={character} size="sm" />
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${character.is_alive ? "bg-[#3AA56B]" : "bg-[#7F98A3]"}`} />
      </div>
      <h2 className="mt-3 font-bold">{character.name}</h2>
      <p className="text-xs text-[#766D62]">{isPending ? "待通过好友申请" : character.is_alive ? "在线" : "回声"}</p>
      {isPending ? (
        <button
          onClick={() => acceptFriend(character.id)}
          className="mt-3 w-full rounded-lg bg-[#1A1611] py-2 text-xs font-bold text-white"
        >
          通过申请
        </button>
      ) : (
        <button
          onClick={() => navigate(`/chat/${character.id}`)}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white ${
            character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"
          }`}
        >
          私信
        </button>
      )}
    </section>
  );
}

function FriendRequestList() {
  const { allCharacters, acceptFriend } = useApp();
  const navigate = useNavigate();
  const pending = allCharacters.filter((c) => c.friend_status === "pending");

  if (pending.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-6 text-center">
        <UserCheck className="mx-auto mb-3 h-8 w-8 text-[#B8AFA5]" />
        <p className="text-sm font-semibold text-[#554B42]">暂无待通过申请</p>
        <p className="mt-1 text-xs leading-5 text-[#9B9087]">去探索页申请角色，或直接和已有好友私聊体验角色回复</p>
        <button onClick={() => navigate("/explore")} className="mt-3 rounded-lg bg-[#C4643A] px-4 py-2 text-xs font-bold text-white">
          去探索角色
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-black/[0.08] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-black">好友申请</h2>
          <p className="mt-0.5 text-xs text-[#766D62]">通过后会进入私信列表，可直接对话</p>
        </div>
        <span className="rounded-full bg-[#F7E3D6] px-2 py-1 text-xs font-bold text-[#C4643A]">{pending.length} 条</span>
      </div>
      <div className="space-y-2">
        {pending.map((character) => (
          <div key={character.id} className="flex items-center gap-3 rounded-xl bg-[#FAF7F2] p-3">
            <Avatar character={character} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{character.name}</p>
              <p className="truncate text-xs text-[#766D62]">{character.drama} · {character.is_alive ? "生者空间" : "逝者空间回声"}</p>
            </div>
            <button onClick={() => acceptFriend(character.id)} className="rounded-lg bg-[#1A1611] px-3 py-2 text-xs font-bold text-white">
              通过
            </button>
          </div>
        ))}
      </div>
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
        <div className="flex items-center gap-2">
          <h2 className="font-bold">{character.name}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${character.is_alive ? "bg-[#F7E3D6] text-[#C4643A]" : "bg-[#DDECEF] text-[#4A7A8A]"}`}>
            {character.is_alive ? "生者" : "逝者"}
          </span>
        </div>
        <p className="truncate text-sm text-[#766D62]">
          {character.is_alive ? "我在，慢慢说。" : "回声已收到你的上一句话。"}
        </p>
      </div>
      <MessageCircle className="h-4 w-4 shrink-0 text-[#9B9087]" />
    </button>
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
            if (group.status === "已加入") {
              navigate(`/group/${group.id}`);
              return;
            }
            showToast(groupLockHint(group));
          }}
          className={`w-full rounded-xl border border-black/[0.08] bg-white p-4 text-left ${group.status === "已加入" ? "" : "opacity-75"}`}
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

const notifIcon: Record<Notification["type"], React.ReactNode> = {
  friend_accepted: <CheckCircle2 className="h-4 w-4 text-[#C4643A]" />,
  echo_carried: <Mail className="h-4 w-4 text-[#4A7A8A]" />,
  echo_resonance: <Sparkles className="h-4 w-4 text-[#7B5EA7]" />,
  card_accepted: <Heart className="h-4 w-4 text-[#C4643A]" />,
  card_interested: <Heart className="h-4 w-4 text-[#7B5EA7]" />,
  unlock_extra: <Bell className="h-4 w-4 text-[#C4643A]" />,
};

const notifBg: Record<Notification["type"], string> = {
  friend_accepted: "bg-[#F7E3D6]",
  echo_carried: "bg-[#DDECEF]",
  echo_resonance: "bg-[#F0EAF8]",
  card_accepted: "bg-[#F7E3D6]",
  card_interested: "bg-[#F0EAF8]",
  unlock_extra: "bg-[#F7E3D6]",
};

function NotificationsList() {
  const { notifications, markNotificationsRead, allCharacters } = useApp();

  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-6 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-[#B8AFA5]" />
        <p className="text-sm text-[#766D62]">暂无通知</p>
        <p className="mt-1 text-xs text-[#9B9087]">带回信件、推荐名片、好友申请通过后会在这里显示</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const character = n.characterId ? allCharacters.find((c) => c.id === n.characterId) : null;
        const timeAgo = (() => {
          const diff = Date.now() - n.createdAt;
          if (diff < 60_000) return "刚刚";
          if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
          if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
          return `${Math.floor(diff / 86_400_000)}天前`;
        })();

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border border-black/[0.06] p-4 ${
              n.read ? "bg-white" : "bg-[#FDFAF6]"
            }`}
          >
            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${notifBg[n.type]}`}>
              {notifIcon[n.type]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold leading-5">{n.title}</p>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C4643A]" />}
              </div>
              <p className="mt-0.5 text-xs leading-5 text-[#766D62]">{n.body}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {character && (
                  <Avatar character={character} size="sm" />
                )}
                <span className="text-[10px] text-[#9B9087]">{timeAgo}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MessagesPage() {
  const { allCharacters, unreadNotificationCount } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<MessagesTab>("私信");

  const friends = allCharacters.filter((c) => c.friend_status === "friend");
  const contacts = allCharacters.filter((c) => c.friend_status === "friend" || c.friend_status === "pending");

  const tabs: MessagesTab[] = ["私信", "群聊", "角色", "通知"];

  return (
    <Page title="消息">
      <div className="relative mb-4">
        <SegmentedTabs<MessagesTab> tabs={tabs} value={tab} onChange={setTab} />
        {unreadNotificationCount > 0 && tab !== "通知" && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C4643A] text-[9px] font-bold text-white">
            {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
          </span>
        )}
      </div>
      {tab === "私信" && (
        <div className="space-y-3">
          <FriendRequestList />
          {friends.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-[#554B42]">可交互好友</h2>
                <span className="text-xs text-[#9B9087]">{friends.length} 位</span>
              </div>
              <div className="space-y-3">
                {friends.map((c) => (
                  <ChatListItem key={c.id} character={c} />
                ))}
              </div>
            </section>
          )}
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
        <div className="space-y-3">
          {contacts.some((c) => c.friend_status === "pending") && (
            <div className="rounded-xl bg-[#FFF7ED] px-3 py-2 text-xs leading-5 text-[#8A5A2B]">
              有待通过申请的角色可以在这里直接通过；通过后会自动进入“私信”。
            </div>
          )}
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
        </div>
      )}
      {tab === "通知" && <NotificationsList />}
    </Page>
  );
}
