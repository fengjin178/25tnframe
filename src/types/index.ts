export type Space = "living" | "deceased";
export type FriendStatus = "friend" | "pending" | "none";
export type CharacterStatus = "online" | "echo";

export type Drama = {
  id: string;
  title: string;
  coverColor: string;
  bgColor: string;
  description: string;
  characterIds: string[];
};

export type Character = {
  id: string;
  name: string;
  initial: string;
  drama: string;
  dramaId: string;
  role: string;
  is_alive: boolean;
  space: Space;
  status: CharacterStatus;
  friend_status: FriendStatus;
  offline_episode?: number;
  personality_type: string;
  social_style: string;
  forbidden_relations?: string[];
  sample_posts?: Post[];
  unsent_letters?: Letter[];
};

export type Letter = {
  id: string;
  to_character: string;
  to_character_alive: boolean;
  content: string;
  written_on: string;
};

export type CrossRelation = {
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

export type PostType =
  | "剧后生活"
  | "吐槽解构"
  | "逝者互助"
  | "情绪波动"
  | "跨剧互动"
  | "群组动态"
  | "共鸣回声";

export type Post = {
  id: string;
  characterId: string;
  type: PostType;
  text: string;
  time?: string;
  note?: string;
  source?: { drama: string; character: string };
  group?: { name: string; founder: string; members: string[]; intro?: string; id?: string };
  stats?: { likes: number; comments: number; shares: number };
  triggeredBy?: string;
  linkedEchoId?: string;
};

export type ApiFeedPost = {
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

export type Comment = {
  id: string;
  characterId?: string;
  authorName?: string;
  text: string;
  likes: number;
  replyTo?: string;
};

export type RecommendedCard = {
  id: string;
  targetCharacterId: string;
  recommendedCharacterId: string;
  space: Space;
  dramaCrossed: boolean;
  decision: "pending" | "accepted" | "rejected" | "interested";
  responseText: string;
};

export type ChatMessageType = "text" | "card" | "system" | "echoNotice";

export type ChatMessage = {
  from: "user" | "character";
  text: string;
  characterId?: string;
  type?: ChatMessageType;
  cardPayload?: RecommendedCard;
  createdAt?: number;
};

export type Group = {
  id: string;
  name: string;
  founder: string;
  status: "已加入" | "未申请" | "审核中" | "锁定";
  deadOnly: boolean;
  spaceType: "living" | "deceased" | "mixed";
  rules: string[];
  members: string[];
  color: string;
  bgColor: string;
  textColor: string;
};

export type NotificationType =
  | "friend_accepted"
  | "echo_carried"
  | "card_accepted"
  | "card_interested"
  | "echo_resonance"
  | "unlock_extra";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  characterId?: string;
  relatedId?: string;
  createdAt: number;
  read: boolean;
};

export type AppState = {
  allCharacters: Character[];
  emotionPosts: Record<string, Post[]>;
  carriedLetterIds: string[];
  carriedCount: number;
  interactionCounts: Record<string, number>;
  pendingCards: RecommendedCard[];
  notifications: Notification[];
  unreadNotificationCount: number;
  incrementInteraction: (characterId: string) => void;
  requestFriend: (character: Character) => void;
  acceptFriend: (characterId: string) => void;
  carryLetter: (from: Character, letter: Letter) => void;
  addPendingCard: (card: RecommendedCard) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationsRead: () => void;
  showToast: (message: string) => void;
  toast: string | null;
  clearToast: () => void;
};
