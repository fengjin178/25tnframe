import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ChevronLeft,
  Compass,
  Home,
  Lock,
  Mail,
  MessageCircle,
  MessagesSquare,
  Plus,
  Send,
  Share2,
  Heart,
  UserRound,
  UsersRound,
} from "lucide-react";

type FriendStatus = "friend" | "pending" | "none";
type Status = "online" | "echo";
type PostType = "剧后生活" | "吐槽解构" | "逝者互助" | "情绪波动" | "跨剧互动" | "群组动态";

type Character = {
  id: string;
  name: string;
  initial: string;
  drama: string;
  role: string;
  is_alive: boolean;
  status: Status;
  friend_status: FriendStatus;
  offline_episode?: number;
  personality_type: string;
  social_style: string;
  forbidden_relations?: string[];
  sample_posts?: Post[];
  unsent_letters?: Letter[];
};

type Letter = {
  id: string;
  to_character: string;
  to_character_alive: boolean;
  content: string;
  written_on: string;
};

type CrossRelation = {
  id: string;
  character_a: string;
  character_b: string;
  space: "生者空间" | "逝者空间";
  both_alive: boolean;
  relation_type: string;
  relation_note: string;
  interaction_frequency: string;
  tension_type: string;
  group?: string;
};

type Post = {
  id: string;
  characterId: string;
  type: PostType;
  text: string;
  time?: string;
  note?: string;
  source?: { drama: string; character: string };
  group?: { name: string; founder: string; members: string[]; intro: string };
};

type ApiFeedPost = {
  id: string;
  characterId: string;
  characterName: string;
  source: string;
  spaceType: "living" | "deceased" | "mixed";
  postType: string;
  content: string;
  emotionTag?: string;
  visibility?: string;
  comments?: Array<{ id: string; characterId?: string; characterName?: string; text: string }>;
};

type Comment = {
  id: string;
  characterId?: string;
  authorName?: string;
  text: string;
  likes: number;
  replyTo?: string;
};

type ChatMessage = { from: "user" | "character"; text: string; characterId?: string };

const characters: Character[] = [
  {
    id: "hua-fei",
    name: "华妃",
    initial: "华",
    drama: "甄嬛传",
    role: "年世兰 · 华妃",
    is_alive: false,
    offline_episode: 31,
    status: "echo",
    friend_status: "friend",
    personality_type: "高自尊_强控制欲_情绪外放",
    social_style: "低频高质量，只与强者建立关系",
    forbidden_relations: ["白莲花型角色", "恋爱脑角色", "无意义寒暄"],
    sample_posts: [
      {
        id: "post-hua-001",
        characterId: "hua-fei",
        type: "吐槽解构",
        text: "本宫这辈子，输给了一个不值得的人。",
        time: "4小时前",
      },
      {
        id: "post-hua-cross",
        characterId: "hua-fei",
        type: "跨剧互动",
        time: "3小时前",
        source: { drama: "延禧攻略", character: "魏璎珞" },
        text: "魏璎珞说，她从不靠忍。\n本宫活了一辈子靠的也不是忍。\n只是我们赌错了人而已。",
      },
    ],
    unsent_letters: [
      {
        id: "letter-huafei-001",
        to_character: "年羹尧",
        to_character_alive: false,
        content: "哥哥，若你当初少贪一些权，我也许不必死得这样难看。\n\n但我知道，你也是身不由己的。",
        written_on: "下线后第七天",
      },
      {
        id: "letter-huafei-002",
        to_character: "甄嬛",
        to_character_alive: true,
        content: "我到最后才明白，皇上从未真的宠过任何人。\n\n你比我聪明，所以你活下来了。",
        written_on: "下线后第十二天",
      },
    ],
  },
  {
    id: "zhenhuan",
    name: "甄嬛",
    initial: "嬛",
    drama: "甄嬛传",
    role: "熹贵妃 · 圣母皇太后",
    is_alive: true,
    status: "online",
    friend_status: "friend",
    personality_type: "完结后最终人格_权力幸存者_清醒克制",
    social_style: "高度克制，能看穿他人情绪，但不轻易外露",
    sample_posts: [
      {
        id: "post-zhen-001",
        characterId: "zhenhuan",
        type: "剧后生活",
        text: "今日抄完《心经》，想起从前在甘露寺。棋局已终，再执子又如何。",
        time: "2小时前",
      },
    ],
  },
  {
    id: "chunyuan",
    name: "纯元皇后",
    initial: "纯",
    drama: "甄嬛传",
    role: "皇上朱砂痣",
    is_alive: false,
    offline_episode: 0,
    status: "echo",
    friend_status: "pending",
    personality_type: "隐忍_温柔表象_内心复杂",
    social_style: "话少，但每句话都有分量",
    unsent_letters: [
      {
        id: "letter-chunyuan-001",
        to_character: "甄嬛",
        to_character_alive: true,
        content: "我从未想过，有人会因为像我而受苦。\n\n若有来生，我希望你只是你自己。",
        written_on: "不知第几天",
      },
    ],
  },
  {
    id: "wei-yingluo",
    name: "魏璎珞",
    initial: "璎",
    drama: "延禧攻略",
    role: "令贵妃",
    is_alive: true,
    status: "online",
    friend_status: "none",
    personality_type: "反套路行动型_强自尊_不屑隐忍",
    social_style: "互怼但带欣赏，对强者直接认可",
    sample_posts: [
      {
        id: "post-wei-001",
        characterId: "wei-yingluo",
        type: "吐槽解构",
        text: "忍不是本事，忍完还能把账讨回来，才算。",
        time: "1小时前",
      },
    ],
  },
  {
    id: "fuheng",
    name: "傅恒",
    initial: "傅",
    drama: "延禧攻略",
    role: "傅恒 · 意难平代表",
    is_alive: false,
    offline_episode: 70,
    status: "echo",
    friend_status: "friend",
    personality_type: "深情_悲剧型_克制",
    social_style: "话不多，情绪深藏",
  },
  {
    id: "miyue",
    name: "芈月",
    initial: "芈",
    drama: "芈月传",
    role: "芈月 · 宣太后",
    is_alive: true,
    status: "online",
    friend_status: "none",
    personality_type: "权谋成熟型_经历情感背叛_知道爱不可靠",
    social_style: "低频高质量，尊重强者，不屑弱者",
    sample_posts: [
      {
        id: "post-miyue-001",
        characterId: "miyue",
        type: "剧后生活",
        text: "爱若能托付天下，天下早就太平了。",
        time: "昨天",
      },
    ],
  },
  {
    id: "mei-zhuang",
    name: "眉庄",
    initial: "眉",
    drama: "甄嬛传",
    role: "沈眉庄 · 惠贵人",
    is_alive: true,
    status: "online",
    friend_status: "friend",
    personality_type: "温柔刚烈型_外柔内刚",
    social_style: "慢热但真诚，讨厌虚与委蛇",
  },
];

const crossDramaFriendships: CrossRelation[] = [
  {
    id: "rel-001",
    character_a: "hua-fei",
    character_b: "fuheng",
    space: "逝者空间",
    both_alive: false,
    relation_type: "意难平互助",
    relation_note: "同为输给爱情的人，在逝者空间形成默契",
    interaction_frequency: "中频",
    tension_type: "共鸣型",
    group: "意难平互助会",
  },
  {
    id: "rel-002",
    character_a: "zhenhuan",
    character_b: "wei-yingluo",
    space: "生者空间",
    both_alive: true,
    relation_type: "宿敌转理解",
    relation_note: "都经历了从天真到权谋的蜕变，互相看穿",
    interaction_frequency: "低频",
    tension_type: "对抗式欣赏",
  },
  {
    id: "rel-003",
    character_a: "zhenhuan",
    character_b: "miyue",
    space: "生者空间",
    both_alive: true,
    relation_type: "权谋同盟",
    relation_note: "都是熬过情感背叛后掌握权力的女人，惺惺相惜",
    interaction_frequency: "低频高质量",
    tension_type: "深度尊重型",
  },
  {
    id: "rel-004",
    character_a: "hua-fei",
    character_b: "chunyuan",
    space: "逝者空间",
    both_alive: false,
    relation_type: "复杂理解",
    relation_note: "生前彼此是影子，逝后才能平视",
    interaction_frequency: "低频",
    tension_type: "宿敌转平视",
  },
];

const groupPost: Post = {
  id: "post-yinanping",
  characterId: "hua-fei",
  type: "群组动态",
  time: "刚刚",
  group: {
    name: "意难平互助会",
    founder: "华妃 发起",
    members: ["hua-fei", "fuheng", "chunyuan"],
    intro: "本会成立宗旨：不讨论爱情值不值得，只讨论我们输在哪里，以及凭什么接受这个结局。",
  },
  text: "本会成立宗旨：不讨论爱情值不值得，\n只讨论我们输在哪里，以及凭什么接受这个结局。",
};

const groups = [
  { id: "yinanping", name: "意难平互助会", founder: "华妃发起", status: "锁定", deadOnly: true, members: ["hua-fei", "fuheng", "chunyuan"], color: "#7B5EA7", bgColor: "#F0EAF8", textColor: "#7B5EA7" },
  { id: "power-women", name: "权谋女性观察室", founder: "华妃发起", status: "未申请", deadOnly: false, members: ["hua-fei", "wei-yingluo", "zhenhuan", "miyue"], color: "#C4643A", bgColor: "#F7E3D6", textColor: "#C4643A" },
  { id: "garden", name: "御花园茶话局", founder: "甄嬛发起", status: "未申请", deadOnly: false, members: ["zhenhuan", "wei-yingluo", "miyue"], color: "#3AA56B", bgColor: "#E3F5EC", textColor: "#3AA56B" },
  { id: "strategy", name: "太后权谋夜谈", founder: "芈月发起", status: "审核中", deadOnly: false, members: ["zhenhuan", "miyue"], color: "#4A7A8A", bgColor: "#DDECEF", textColor: "#4A7A8A" },
];

const comments: Record<string, Comment[]> = {
  "post-hua-001": [
    { id: "c1", characterId: "wei-yingluo", text: "输给不值得的人，才最难下咽。", likes: 2341 },
    {
      id: "c2",
      characterId: "zhenhuan",
      replyTo: "魏璎珞",
      text: "我们都曾经是那个不值得的人的例外。后来才知道，没有例外。",
      likes: 5672,
    },
    { id: "c3", authorName: "我的昵称", text: "华妃娘娘说得对...", likes: 12 },
  ],
};

type AppState = {
  allCharacters: Character[];
  emotionPosts: Record<string, Post[]>;
  carriedLetterIds: string[];
  carriedCount: number;
  interactionCounts: Record<string, number>;
  incrementInteraction: (characterId: string) => void;
  requestFriend: (character: Character) => void;
  carryLetter: (from: Character, letter: Letter) => void;
  showToast: (message: string) => void;
  toast: string | null;
  clearToast: () => void;
};

const AppContext = createContext<AppState | null>(null);

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [friendOverrides, setFriendOverrides] = useState<Record<string, FriendStatus>>({});
  const [emotionPosts, setEmotionPosts] = useState<Record<string, Post[]>>({});
  const [carriedLetterIds, setCarriedLetterIds] = useState<string[]>([]);
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const allCharacters = useMemo(
    () => characters.map((item) => ({ ...item, friend_status: friendOverrides[item.id] ?? item.friend_status })),
    [friendOverrides],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const incrementInteraction = (characterId: string) => {
    setInteractionCounts((prev) => ({ ...prev, [characterId]: (prev[characterId] ?? 0) + 1 }));
  };

  const requestFriend = (character: Character) => {
    const hasMismatch = allCharacters.some((item) => item.friend_status === "friend" && item.is_alive !== character.is_alive);
    if (hasMismatch) {
      showToast("生者与逝者之间无法直接建立连接，但你可以成为他们之间的信使");
      return;
    }
    setFriendOverrides((prev) => ({ ...prev, [character.id]: "pending" }));
    showToast(`已向${character.name}发送好友申请`);
  };

  const carryLetter = (from: Character, letter: Letter) => {
    if (!letter.to_character_alive || carriedLetterIds.includes(letter.id)) return;
    const target = allCharacters.find((item) => item.name === letter.to_character);
    setCarriedLetterIds((prev) => [...prev, letter.id]);
    showToast(`你将这封信带回了生者空间，${letter.to_character}也许会有所感知`);
    if (!target) return;
    // 调用 AI 生成情绪波动帖
    fetch("/api/feed/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: target.id, triggerType: "unsent_letter", context: letter.content }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.post?.content) {
          setEmotionPosts((prev) => ({
            ...prev,
            [target.id]: [
              ...(prev[target.id] ?? []),
              {
                id: `emotion-${letter.id}`,
                characterId: target.id,
                type: "情绪波动",
                time: "刚刚",
                note: "因为有观众从逝者空间带回了一丝回声",
                text: data.post.content,
              },
            ],
          }));
        }
      })
      .catch(() => {
        // 静默失败，不影响主流程
      });
  };

  return (
    <AppContext.Provider
      value={{ allCharacters, emotionPosts, carriedLetterIds, carriedCount: carriedLetterIds.length, interactionCounts, incrementInteraction, requestFriend, carryLetter, showToast, toast, clearToast: () => setToast(null) }}
    >
      {children}
      <Toast />
    </AppContext.Provider>
  );
}

function Toast() {
  const { toast, clearToast } = useApp();
  if (!toast) return null;
  return (
    <button onClick={clearToast} className="fixed left-1/2 top-5 z-50 w-[calc(100%-32px)] max-w-[358px] -translate-x-1/2 rounded-xl bg-[#1A1611] px-4 py-3 text-left text-sm leading-6 text-white shadow-2xl">
      {toast}
    </button>
  );
}

function byId(id: string) {
  return characters.find((item) => item.id === id) ?? characters[0];
}

function relatedTo(id: string) {
  return crossDramaFriendships.filter((rel) => rel.character_a === id || rel.character_b === id);
}

function otherId(rel: CrossRelation, id: string) {
  return rel.character_a === id ? rel.character_b : rel.character_a;
}

function Avatar({ character, size = "md" }: { character: Character; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-lg", lg: "h-20 w-20 text-3xl" };
  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-full border border-black/10 font-serif font-semibold shadow-sm ${character.is_alive ? "bg-[#F8DFCC] text-[#8A3E22]" : "bg-[#DDE8EE] text-[#315D69]"}`}>
      {character.initial}
    </div>
  );
}

function LifeBadge({ character }: { character: Character }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${character.is_alive ? "bg-[#F6E0D3] text-[#C4643A]" : "bg-[#DDECEF] text-[#4A7A8A]"}`}>
      {character.is_alive ? "生者" : `逝者 E${character.offline_episode ?? 0}`}
    </span>
  );
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-24 text-[#1A1611]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] px-4 pt-4">
        <header className="sticky top-0 z-20 -mx-4 mb-3 bg-[#FAF7F2]/95 px-4 pb-3 pt-2 backdrop-blur">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#766D62]">第25帧</p>
          <h1 className="text-2xl font-black">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

function SegmentedTabs<T extends string>({ tabs, value, onChange }: { tabs: T[]; value: T; onChange: (tab: T) => void }) {
  return (
    <div className={`mb-4 grid rounded-xl border border-black/5 bg-white/70 p-1 shadow-sm ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {tabs.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)} className={`rounded-lg px-2 py-2 text-sm font-semibold ${value === tab ? "bg-[#1A1611] text-white shadow-sm" : "text-[#6F665C]"}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function allPosts(character: Character, emotionPosts: Record<string, Post[]>) {
  return [...(emotionPosts[character.id] ?? []), ...(character.sample_posts ?? [])];
}

function ApiFeedCard({ post }: { post: ApiFeedPost }) {
  const character = byId(post.characterId);
  const adapted: Post = {
    id: post.id,
    characterId: post.characterId,
    type: post.postType === "group_event" ? "群组动态" : post.spaceType === "deceased" ? "逝者互助" : "剧后生活",
    text: post.content,
    time: "刚刚",
    note: post.emotionTag,
    group:
      post.postType === "group_event"
        ? { name: "意难平互助会", founder: "华妃 发起", members: ["hua-fei", "fuheng", "chunyuan"], intro: post.content }
        : undefined,
  };
  return <PostCard post={adapted} character={character} />;
}

function FeedPage() {
  const { allCharacters, emotionPosts } = useApp();
  const [tab, setTab] = useState<"全部" | "生者" | "逝者">("全部");
  const [apiFeed, setApiFeed] = useState<ApiFeedPost[] | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadFeed() {
      try {
        const response = await fetch("/api/feed");
        if (!response.ok) throw new Error("feed request failed");
        const data = await response.json();
        if (!ignore && Array.isArray(data.feed)) setApiFeed(data.feed);
      } catch {
        if (!ignore) setApiFeed(null);
      }
    }
    loadFeed();
    return () => {
      ignore = true;
    };
  }, []);

  const apiVisible = apiFeed?.filter((post) => tab === "全部" || (tab === "生者" ? post.spaceType === "living" : post.spaceType === "deceased"));
  const visible = allCharacters.filter((item) => tab === "全部" || (tab === "生者" ? item.is_alive : !item.is_alive));

  return (
    <Page title="动态">
      <SegmentedTabs tabs={["全部", "生者", "逝者"]} value={tab} onChange={setTab} />
      <div className="space-y-3">
        {apiVisible
          ? apiVisible.map((post) => <ApiFeedCard key={post.id} post={post} />)
          : visible.flatMap((character) => allPosts(character, emotionPosts).map((post) => <PostCard key={post.id} post={post} character={character} />))}
        {!apiVisible && tab !== "生者" && <PostCard post={groupPost} character={byId("hua-fei")} />}
        <UnlockCard character={byId("hua-fei")} />
      </div>
    </Page>
  );
}

function PostCard({ character, post }: { character: Character; post: Post }) {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isGroup = post.type === "群组动态";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 3000) + 100);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  };

  const handleShare = () => {
    showToast("已转发到你的动态");
  };

  return (
    <article className={`rounded-xl border border-black/[0.08] p-4 shadow-[0_10px_28px_rgba(70,45,20,0.06)] ${isGroup ? "bg-[#F5F0F8]" : "bg-white"}`}>
      {post.source && (
        <div className="mb-3 border-l-4 border-[#7B5EA7] bg-[#F0EAF8] px-3 py-2 text-[10px] font-medium text-[#7B5EA7]">
          因与《<b>{post.source.drama}</b>》{post.source.character}的一次对话
        </div>
      )}
      {isGroup && post.group ? (
        <button onClick={() => navigate("/group/yinanping")} className="mb-3 w-full text-left">
          <div className="mb-2 inline-flex rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-[#7B5EA7]">群组动态</div>
          <div className="flex items-center gap-3">
            <StackedAvatars ids={post.group.members} />
            <div>
              <h2 className="font-black text-[#4B365E]">{post.group.name}</h2>
              <p className="text-xs text-[#766D62]">{post.group.founder} · 傅恒、纯元皇后等4人参与</p>
            </div>
          </div>
        </button>
      ) : (
        <button onClick={() => navigate(`/character/${character.id}`)} className="mb-3 flex w-full items-center gap-3 text-left">
          <Avatar character={character} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{character.name}</h2>
              <LifeBadge character={character} />
            </div>
            <p className="text-xs text-[#766D62]">{character.is_alive ? "生者空间" : "逝者空间"} · {post.time ?? "刚刚"}</p>
          </div>
        </button>
      )}
      {post.note && <p className="mb-2 rounded-lg bg-[#FAF7F2] px-3 py-2 text-xs leading-5 text-[#8A7461]">{post.note}</p>}
      <p className="whitespace-pre-line font-serif text-[15px] leading-7 text-[#292018]">{post.text}</p>
      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3 text-sm font-semibold text-[#766D62]">
        <button onClick={() => setShowComments((v) => !v)} className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-[#C4643A]" : ""}`}>
          <MessageCircle className="h-4 w-4" />评论
        </button>
        <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? "text-[#C4643A]" : ""}`}>
          <Heart className={`h-4 w-4 transition-all ${liked ? "fill-[#C4643A] text-[#C4643A] scale-110" : ""}`} />
          {likeCount.toLocaleString()}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 active:text-[#C4643A]">
          <Share2 className="h-4 w-4" />转发
        </button>
      </div>
      {showComments && <CommentBlock post={post} character={character} />}
    </article>
  );
}

function TypePill({ type, alive }: { type: PostType; alive: boolean }) {
  const cls = type === "跨剧互动" ? "bg-[#F0EAF8] text-[#7B5EA7]" : type === "情绪波动" ? "bg-[#ECE4D5] text-[#7E5D2E]" : alive ? "bg-[#F7E3D6] text-[#C4643A]" : "bg-[#DDECEF] text-[#4A7A8A]";
  return <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{type}</div>;
}

function StackedAvatars({ ids }: { ids: string[] }) {
  return (
    <div className="flex w-16">
      {ids.slice(0, 3).map((id, index) => (
        <div key={id} className="-mr-5" style={{ zIndex: 5 - index }}>
          <Avatar character={byId(id)} size="sm" />
        </div>
      ))}
    </div>
  );
}

function CommentBlock({ post, character }: { post: Post; character: Character }) {
  const [draft, setDraft] = useState("");
  const [asRole, setAsRole] = useState("viewer");
  const [localComments, setLocalComments] = useState<Comment[]>(comments[post.id] ?? []);
  const [submitting, setSubmitting] = useState(false);
  const selected = asRole === "viewer" ? null : byId(asRole);
  const canRoleComment = !selected || selected.is_alive === character.is_alive;
  const mentions = mentionOptions(character);

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
      const res = await fetch("/api/comments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postCharacterId: character.id, postContent: post.text, commenterId: asRole, commenterRole: "character" }),
      });
      const data = await res.json();
      if (data.blocked) {
        setLocalComments((prev) => [...prev, { id: `blocked-${Date.now()}`, authorName: "系统", text: data.reason, likes: 0 }]);
      } else if (data.text) {
        setLocalComments((prev) => [...prev, { id: `ai-${Date.now()}`, characterId: data.commenterId, text: data.text, likes: 0 }]);
      }
    } catch {
      const commenter = byId(asRole);
      setLocalComments((prev) => [...prev, { id: `fb-${Date.now()}`, characterId: asRole, text: `${commenter.name}沉默片刻，没有说话。`, likes: 0 }]);
    }
    setDraft("");
    setSubmitting(false);
  };

  return (
    <section className="mt-4 space-y-3 border-t border-black/[0.06] pt-3">
      {localComments.length > 0 && (
        <div className={`rounded-xl p-3 ${character.is_alive ? "bg-[#FDF8F0]" : "bg-[#F0F4F8]"}`}>
          <p className="mb-2 text-[11px] font-bold text-[#766D62]">评论</p>
          {localComments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}
        </div>
      )}
      <div className="rounded-xl bg-[#FAF7F2] p-3">
        <div className="mb-2 flex gap-2">
          <select value={asRole} onChange={(event) => setAsRole(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-xs">
            <option value="viewer">我（观众）</option>
            {characters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        {!canRoleComment && <p className="mb-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#4A7A8A]">生者与逝者之间无法直接交流</p>}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submitComment()}
            placeholder={asRole === "viewer" ? "写下你的评论" : `以${byId(asRole).name}的身份评论`}
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={submitComment}
            disabled={!draft.trim() || submitting || (!canRoleComment && asRole !== "viewer")}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF] ${character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"}`}
          >
            {submitting ? "…" : "发送"}
          </button>
        </div>
        {draft.includes("@") && (
          <div className="mt-2 grid gap-1">
            {mentions.map((item) => (
              <div key={item.character.id} className={`flex items-center justify-between rounded-lg bg-white px-2 py-2 text-xs ${item.disabled ? "opacity-45" : ""}`}>
                <span>{item.character.initial} {item.character.name}《{item.character.drama}》</span>
                <span>{item.disabled ? "无法@" : item.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const character = comment.characterId ? byId(comment.characterId) : null;
  return (
    <div className={`py-2 ${comment.replyTo ? "ml-7 border-l border-black/10 pl-3" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-[#766D62]">
        {character && <Avatar character={character} size="sm" />}
        <span className="font-bold">{character ? `${character.name}《${character.drama}》· ${character.is_alive ? "生者" : "逝者"}` : `我 ${comment.authorName}`}</span>
      </div>
      {comment.replyTo && <p className="mt-1 text-xs text-[#8A7461]">回复 {comment.replyTo}：</p>}
      <p className="mt-1 font-serif text-sm leading-6">"{comment.text}"</p>
      <p className="mt-1 text-right text-xs text-[#766D62]">♡ {comment.likes}</p>
    </div>
  );
}

function mentionOptions(character: Character) {
  const relationIds = relatedTo(character.id).map((rel) => otherId(rel, character.id));
  const sameDramaIds = characters.filter((item) => item.drama === character.drama && item.id !== character.id).map((item) => item.id);
  const ordered = [...new Set([...relationIds, ...sameDramaIds, ...characters.filter((item) => item.id !== character.id).map((item) => item.id)])];
  return ordered.map((id) => {
    const item = byId(id);
    return { character: item, disabled: item.is_alive !== character.is_alive, reason: relationIds.includes(id) ? "关系优先" : "同剧" };
  });
}

function UnlockCard({ character }: { character: Character }) {
  const { interactionCounts } = useApp();
  const count = Math.min(interactionCounts[character.id] ?? 0, 3);
  return (
    <section className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#554B42]"><Lock className="h-4 w-4" />隐藏番外</div>
      <p className="font-serif text-sm leading-6 text-[#766D62]">她后来再提起那一炉香时，只说"人心比香灰冷得更快"。</p>
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-[#E5DFD9]">
          <div className="h-1.5 rounded-full bg-[#C4643A] transition-all duration-500" style={{ width: `${(count / 3) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-[#A06B4F]">与{character.name}互动3次后解锁 · 已解锁 {count}/3</p>
      </div>
    </section>
  );
}

function ExplorePage() {
  const { allCharacters, requestFriend } = useApp();
  const [tab, setTab] = useState<"剧集" | "群聊" | "角色">("剧集");
  return (
    <Page title="探索">
      <SegmentedTabs tabs={["剧集", "群聊", "角色"]} value={tab} onChange={setTab} />
      {tab === "剧集" && <DramaList />}
      {tab === "群聊" && <GroupList />}
      {tab === "角色" && (
        <div className="grid grid-cols-2 gap-3">
          {allCharacters.filter((item) => item.friend_status !== "friend").map((character) => (
            <section key={character.id} className="rounded-xl border border-black/[0.08] bg-white p-3">
              <Avatar character={character} />
              <h2 className="mt-3 font-bold">{character.name}</h2>
              <p className="min-h-10 text-xs leading-5 text-[#766D62]">{character.drama} · {character.role}</p>
              <button onClick={() => requestFriend(character)} disabled={character.friend_status === "pending"} className="mt-3 w-full rounded-lg bg-[#C4643A] py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF]">
                {character.friend_status === "pending" ? "等待中" : "申请加好友"}
              </button>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

function DramaList() {
  return (
    <div className="space-y-3">
      {[
        ["甄嬛传", "进行中", "12位角色"],
        ["延禧攻略", "进行中", "6位角色"],
        ["芈月传", "进行中", "4位角色"],
        ["庆余年第二季", "即将上线", "置灰"],
      ].map(([title, status, count]) => (
        <section key={title} className={`rounded-xl border border-black/[0.08] bg-white p-4 ${status === "即将上线" ? "opacity-45 grayscale" : ""}`}>
          <h2 className="font-black">{title}</h2>
          <p className="mt-1 text-sm text-[#766D62]">{status} · {count}</p>
        </section>
      ))}
    </div>
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
        <button key={group.id} onClick={() => navigate(`/group/${group.id}`)} className="w-full rounded-xl border border-black/[0.08] bg-white p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StackedAvatars ids={group.members} />
                <h2 className="font-black">{group.name}</h2>
              </div>
              <p className="mt-1 text-xs text-[#766D62]">{group.founder} · {group.deadOnly ? "仅逝者可加入" : "生者可申请"}</p>
            </div>
            <span className="ml-3 shrink-0 rounded-full px-2 py-1 text-xs font-bold" style={{ backgroundColor: group.bgColor, color: group.textColor }}>{group.status}</span>
          </div>
          {group.id === "yinanping" && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-[#E5DFE9]">
                <div className="h-2 rounded-full bg-[#7B5EA7] transition-all duration-500" style={{ width: `${(yinanpingProgress / 5) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#766D62]">与华妃、傅恒、纯元皇后任意一人互动超过5次 · 当前 {yinanpingProgress}/5</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function MessagesPage() {
  const { allCharacters } = useApp();
  const [tab, setTab] = useState<"角色" | "私信" | "群聊">("角色");
  const navigate = useNavigate();
  const mine = allCharacters.filter((item) => item.friend_status === "friend" || item.friend_status === "pending");
  return (
    <Page title="消息">
      <SegmentedTabs tabs={["角色", "私信", "群聊"]} value={tab} onChange={setTab} />
      {tab === "角色" && (
        <div className="grid grid-cols-2 gap-3">
          {mine.map((character) => <CharacterTile key={character.id} character={character} />)}
          <button onClick={() => navigate("/explore")} className="min-h-40 rounded-xl border border-dashed border-[#B8AFA5] bg-white/40 p-3 text-[#766D62]"><Plus className="mx-auto mb-2 h-6 w-6" />+申请加友</button>
        </div>
      )}
      {tab === "私信" && <div className="space-y-3">{mine.filter((item) => item.friend_status === "friend").map((item) => <ChatListItem key={item.id} character={item} />)}</div>}
      {tab === "群聊" && <GroupList />}
    </Page>
  );
}

function CharacterTile({ character }: { character: Character }) {
  const navigate = useNavigate();
  return (
    <section className={`rounded-xl border border-black/[0.08] bg-white p-3 ${character.friend_status === "pending" ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between"><Avatar character={character} size="sm" /><span className={`mt-1 h-2.5 w-2.5 rounded-full ${character.is_alive ? "bg-[#3AA56B]" : "bg-[#7F98A3]"}`} /></div>
      <h2 className="mt-3 font-bold">{character.name}</h2>
      <p className="text-xs text-[#766D62]">{character.is_alive ? "在线" : "回声"}</p>
      <button onClick={() => navigate(`/chat/${character.id}`)} disabled={character.friend_status === "pending"} className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white disabled:bg-[#CFC8BF] ${character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"}`}>
        {character.friend_status === "pending" ? "等待中" : "私信"}
      </button>
    </section>
  );
}

function ChatListItem({ character }: { character: Character }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/chat/${character.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-4 text-left">
      <Avatar character={character} />
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{character.name}</h2>
        <p className="truncate text-sm text-[#766D62]">{character.is_alive ? "我在，慢慢说。" : "回声已收到你的上一句话。"}</p>
      </div>
    </button>
  );
}

function ProfilePage() {
  const { carriedCount, allCharacters } = useApp();
  return (
    <Page title="我的">
      <section className="rounded-xl border border-black/[0.08] bg-white p-5">
        <div className="flex items-center gap-3"><div className="grid h-16 w-16 place-items-center rounded-full bg-[#1A1611] text-xl font-black text-white">我</div><div><h2 className="text-xl font-black">观众信使</h2><p className="text-sm text-[#766D62]">替跨剧角色保存那些不能直接抵达的话</p></div></div>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <section className="rounded-xl border border-black/[0.08] bg-white p-4"><p className="text-xs font-semibold text-[#766D62]">我的角色</p><p className="mt-2 text-3xl font-black">{allCharacters.filter((item) => item.friend_status === "friend").length}</p></section>
        <section className="rounded-xl border border-black/[0.08] bg-white p-4"><p className="text-xs font-semibold text-[#766D62]">带出的信</p><p className="mt-2 text-3xl font-black text-[#4A7A8A]">{carriedCount}</p></section>
      </div>
    </Page>
  );
}

function CharacterPage() {
  const { allCharacters, emotionPosts, requestFriend, carryLetter, carriedLetterIds } = useApp();
  const { characterId } = useParams();
  const navigate = useNavigate();
  const character = allCharacters.find((item) => item.id === characterId);
  const [tab, setTab] = useState<"动态" | "番外" | "关系" | "未寄出的信">("动态");
  if (!character) return <Navigate to="/feed" replace />;
  const tabs = character.is_alive ? ["动态", "番外", "关系"] : ["动态", "番外", "关系", "未寄出的信"];
  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-8 text-[#1A1611]">
      <div className="mx-auto w-full max-w-[390px] px-4 pt-4">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm font-bold text-[#766D62]"><ChevronLeft className="h-4 w-4" /> 返回</button>
        <section className="rounded-xl border border-black/[0.08] bg-white p-5">
          <div className="flex gap-4"><Avatar character={character} size="lg" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="text-2xl font-black">{character.name}</h1><LifeBadge character={character} /></div><p className="mt-1 text-sm text-[#766D62]">{character.drama}</p><p className="mt-2 text-sm leading-6">{character.role}</p></div></div>
          <p className="mt-4 rounded-xl bg-[#FAF7F2] p-3 text-xs leading-5 text-[#766D62]">{character.personality_type} · {character.social_style}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => navigate(`/chat/${character.id}`)} className={`rounded-lg py-2.5 text-sm font-bold text-white ${character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"}`}>私信</button>
            <button onClick={() => requestFriend(character)} disabled={character.friend_status !== "none"} className="rounded-lg border border-black/10 py-2.5 text-sm font-bold text-[#554B42] disabled:bg-[#F0ECE6] disabled:text-[#9B9087]">{character.friend_status === "friend" ? "已是好友" : character.friend_status === "pending" ? "申请中" : "申请好友"}</button>
          </div>
        </section>
        <SegmentedTabs tabs={tabs as Array<typeof tab>} value={tab} onChange={setTab} />
        {tab === "动态" && <div className="space-y-3">{allPosts(character, emotionPosts).map((post) => <PostCard key={post.id} post={post} character={character} />)}</div>}
        {tab === "番外" && <UnlockCard character={character} />}
        {tab === "关系" && <RelationGraph character={character} />}
        {tab === "未寄出的信" && <div className="space-y-3">{(character.unsent_letters ?? []).map((letter) => <LetterCard key={letter.id} character={character} letter={letter} carried={carriedLetterIds.includes(letter.id)} onCarry={() => carryLetter(character, letter)} />)}</div>}
      </div>
    </main>
  );
}

function RelationGraph({ character }: { character: Character }) {
  const navigate = useNavigate();
  const rels = relatedTo(character.id);
  const mismatch = characters.find((item) => item.id === "wei-yingluo" && item.is_alive !== character.is_alive && character.id === "hua-fei");
  return (
    <section className="rounded-xl border border-black/[0.08] bg-white p-4">
      <h2 className="mb-1 text-lg font-black">{character.name} 的关系网络</h2>
      <p className="mb-4 text-sm text-[#766D62]">{character.is_alive ? "生者空间" : "逝者空间"}</p>
      <div className="relative space-y-3">
        {rels.map((rel) => {
          const other = byId(otherId(rel, character.id));
          return (
            <button key={rel.id} onClick={() => navigate(`/character/${other.id}`)} className="relative flex w-full items-center gap-3 rounded-xl bg-[#FAF7F2] p-3 text-left">
              <Avatar character={other} size="sm" />
              <div className="h-px flex-1 bg-[#C4643A]" />
              <div className="min-w-0 flex-[2]">
                <h3 className="font-bold">{other.name}</h3>
                <p className="text-xs text-[#766D62]">{rel.relation_type} · 《{other.drama}》</p>
              </div>
            </button>
          );
        })}
        {mismatch && (
          <button onClick={() => navigate(`/character/${mismatch.id}`)} className="flex w-full items-center gap-3 rounded-xl bg-[#FAF7F2] p-3 text-left">
            <Avatar character={mismatch} size="sm" />
            <div className="flex-1 border-t border-dashed border-[#B0AA9F]" />
            <div className="min-w-0 flex-[2]"><h3 className="font-bold">{mismatch.name}</h3><p className="text-xs text-[#766D62]">无法直接联系 · 《{mismatch.drama}》</p></div>
          </button>
        )}
      </div>
      <p className="mt-4 rounded-lg bg-[#F0EAF8] px-3 py-2 text-xs text-[#7B5EA7]">接口预留：/api/characters/{character.id}/relations</p>
    </section>
  );
}

function LetterCard({ character, letter, carried, onCarry }: { character: Character; letter: Letter; carried: boolean; onCarry: () => void }) {
  const [folding, setFolding] = useState(false);
  const handleCarry = () => {
    if (!letter.to_character_alive || carried || folding) return;
    setFolding(true);
    window.setTimeout(onCarry, 520);
  };
  return (
    <article className={`rounded-xl border border-[#B8C8D8] bg-[#EDF0F5] p-4 transition duration-500 ${folding ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100"}`}>
      <div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-[#4A7A8A]">未寄出的信</span><Mail className="h-4 w-4 text-[#4A7A8A]" /></div>
      <p className="text-sm font-bold">收信人：{letter.to_character}</p><p className="mt-1 text-xs text-[#667A88]">此信无法送达</p>
      <div className="my-4 border-l-2 border-[#8BA7B7] pl-4"><p className="whitespace-pre-line font-serif text-[15px] italic leading-8 text-[#253743]">{letter.content}</p></div>
      <p className="text-right text-xs font-semibold text-[#667A88]">{character.name} · {letter.written_on}</p>
      <button onClick={handleCarry} disabled={!letter.to_character_alive || carried} className="mt-4 w-full rounded-lg bg-[#4A7A8A] py-2.5 text-sm font-bold text-white disabled:bg-[#AAB7BE]">{!letter.to_character_alive ? "此信只能留在逝者空间" : carried ? "已带回生者空间" : "带回生者空间"}</button>
    </article>
  );
}

const chatProfiles: Record<string, { delay: [number, number]; bubble: string; system?: string; typing?: string; proactive?: string; replies: string[] }> = {
  "hua-fei": { delay: [2000, 4000], bubble: "bg-[#E8EDF2] border-[#B8C8D8] text-[#253743]", system: "华妃不轻易与人深交，你需要先展示诚意", replies: ["本宫不爱听虚话。你若真懂，就说重点。", "输不可怕，可怕的是输得不明不白。"] },
  "wei-yingluo": { delay: [300, 800], bubble: "bg-[#F5EFE6] border-black/[0.05] text-[#2A211A]", proactive: "有话直说，本姑娘没工夫猜。", replies: ["这话倒还算痛快。", "能动手解决的事，少绕弯子。"] },
  "miyue": { delay: [1000, 2500], bubble: "bg-[#F5EFE6] border-black/[0.05] text-[#2A211A]", system: "芈月只与值得交谈的人深聊", replies: ["人心不可托，权力可借。", "看清代价，再谈选择。"] },
  "chunyuan": { delay: [3000, 6000], bubble: "bg-[#E8EDF2] border-[#B8C8D8] text-[#253743]", typing: "声音从很远的地方传来……", replies: ["......", "有些话，迟到许多年，也仍然会伤人。"] },
};

function ChatPage() {
  const { allCharacters, incrementInteraction } = useApp();
  const { characterId } = useParams();
  const navigate = useNavigate();
  const character = allCharacters.find((item) => item.id === characterId) ?? allCharacters[0];
  const profile = chatProfiles[character.id] ?? { delay: character.is_alive ? [700, 1400] : [1800, 3200], bubble: character.is_alive ? "bg-[#F5EFE6]" : "bg-[#E8EDF2]", replies: ["我在听。"] };
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "character", text: character.is_alive ? "我在。你若有话，就慢慢说。" : "这里是回声空间。话会晚一点抵达，但不会丢。" }]);

  useEffect(() => {
    if (!profile.proactive) return;
    const timer = window.setTimeout(() => setMessages((prev) => [...prev, { from: "character", text: profile.proactive ?? "" }]), 4500);
    return () => window.clearTimeout(timer);
  }, [profile.proactive]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setTyping(true);

    try {
      const response = await fetch(`/api/chat/${character.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (!response.ok) throw new Error("chat request failed");
      const data = await response.json();
      setMessages((prev) => [...prev, { from: "character", text: data.reply || profile.replies[0] || "我在听。" }]);
      incrementInteraction(character.id);
    } catch {
      const [min, max] = profile.delay;
      window.setTimeout(() => {
        const reply = profile.replies[Math.floor(Math.random() * profile.replies.length)] || "我在听。";
        setMessages((prev) => [...prev, { from: "character", text: reply }]);
        incrementInteraction(character.id);
      }, Math.min(900, min + Math.random() * (max - min)));
    } finally {
      setTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1A1611]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col">
        <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-[#FAF7F2]/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white"><ChevronLeft className="h-5 w-5" /></button><Avatar character={character} size="sm" /><div><h1 className="font-black">{character.name}</h1><p className="text-xs text-[#766D62]">{character.is_alive ? "在线" : "回声"} · /api/chat/{character.id}</p></div></div>
          {!character.is_alive && <p className="mt-3 rounded-lg bg-[#E8EDF2] px-3 py-2 text-xs font-semibold text-[#4A7A8A]">你正在与逝者空间的{character.name}交流</p>}
          {profile.system && <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#766D62]">{profile.system}</p>}
        </header>
        <section className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message, index) => <Bubble key={index} message={message} character={character} bubbleClass={profile.bubble} />)}
          {typing && <div className="text-xs text-[#766D62]">{profile.typing ?? "对方正在输入..."}</div>}
          {character.id === "hua-fei" && <p className="rounded-xl border border-dashed border-[#B8C8D8] bg-[#EDF0F5] p-3 text-xs text-[#4A7A8A]">对话达到10条后解锁「未寄出的信」入口 · 当前 {messages.length}/10</p>}
        </section>
        <footer className="border-t border-black/[0.06] bg-[#FAF7F2] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder={`给${character.name}发消息`} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button onClick={sendMessage} className={`grid h-10 w-10 place-items-center rounded-lg text-white ${character.is_alive ? "bg-[#C4643A]" : "bg-[#4A7A8A]"}`}><Send className="h-4 w-4" /></button></div>
        </footer>
      </div>
    </main>
  );
}

function Bubble({ message, character, bubbleClass }: { message: ChatMessage; character: Character; bubbleClass: string }) {
  const isUser = message.from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm leading-7 shadow-sm ${isUser ? "border-[#1A1611] bg-[#1A1611] text-white" : bubbleClass}`}>
        {message.text}
      </div>
    </div>
  );
}

function GroupPage() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const firstMember = byId(group.members[0]);
    const secondMember = group.members[1] ? byId(group.members[1]) : null;
    return [
      { from: "character", characterId: group.members[0], text: group.id === "yinanping" ? "本会成立宗旨：不讨论爱情值不值得，只讨论我们输在哪里。" : `${firstMember.name}在此。` },
      ...(secondMember ? [{ from: "character" as const, characterId: group.members[1], text: group.id === "yinanping" ? "有些结局，不是想接受，只是已经无法更改。" : `${secondMember.name}也在。` }] : []),
    ];
  });
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (!response.ok) throw new Error("group request failed");
      const data = await response.json();
      const incoming: ChatMessage[] = Array.isArray(data.messages)
        ? data.messages.map((item: { speakerId: string; text: string }) => ({ from: "character", characterId: item.speakerId, text: item.text }))
        : [];
      setMessages((prev) => [...prev, ...(incoming.length ? incoming : [{ from: "character", characterId: group.members[0], text: "……" }])]);
    } catch {
      setMessages((prev) => [...prev, { from: "character", characterId: group.members[0], text: "……" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1A1611]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col">
        <header className="border-b border-black/[0.06] px-4 py-3" style={{ backgroundColor: `${group.bgColor}cc` }}>
          <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm font-bold" style={{ color: group.textColor }}><ChevronLeft className="h-4 w-4" /> 返回</button>
          <div className="flex items-center gap-3">
            <StackedAvatars ids={group.members} />
            <div>
              <h1 className="text-xl font-black" style={{ color: group.textColor }}>{group.name}</h1>
              <p className="text-xs text-[#766D62]">发起人：{group.founder} · 成员：{group.members.map((id) => byId(id).name).join("、")}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: group.textColor }}>已接入：/api/groups/{group.id}/messages</p>
        </header>
        <section className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((message, index) => {
            const character = message.characterId ? byId(message.characterId) : null;
            return (
              <div key={index} className={`flex gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                {character && <Avatar character={character} size="sm" />}
                <div className={`max-w-[76%] ${message.from === "user" ? "text-right" : ""}`}>
                  {character && <p className="mb-1 text-xs font-bold text-[#766D62]">{character.name} · 《{character.drama}》</p>}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.from === "user" ? "bg-[#1A1611] text-white" : "border border-[#B8C8D8] bg-[#E8EDF2] text-[#253743]"}`}>{message.text}</div>
                </div>
              </div>
            );
          })}
        </section>
        <footer className="border-t border-black/[0.06] bg-[#FAF7F2] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={loading ? "角色正在回应..." : "以观众身份发言"} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
            <button onClick={send} disabled={loading} className="grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: group.color }}><Send className="h-4 w-4" /></button>
          </div>
        </footer>
      </div>
    </main>
  );
}

const navItems = [
  { to: "/feed", label: "动态", icon: Home },
  { to: "/explore", label: "探索", icon: Compass },
  { to: "/messages", label: "消息", icon: MessagesSquare },
  { to: "/profile", label: "我的", icon: UserRound },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-black/[0.08] bg-white/95 px-3 pb-3 pt-2 shadow-[0_-10px_30px_rgba(70,45,20,0.08)] backdrop-blur">
      <div className="grid grid-cols-4">
        {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold ${isActive ? "text-[#C4643A]" : "text-[#8D837A]"}`}><item.icon className="h-5 w-5" />{item.label}</NavLink>)}
      </div>
    </nav>
  );
}

function Shell() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/character/:characterId" element={<CharacterPage />} />
        <Route path="/chat/:characterId" element={<ChatPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
      <Routes>
        <Route path="/chat/:characterId" element={null} />
        <Route path="/group/:groupId" element={null} />
        <Route path="*" element={<BottomNav />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}
