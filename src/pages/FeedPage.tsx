import { useEffect, useState } from "react";
import { Page, SegmentedTabs } from "../components/Page";
import { PostCard } from "../components/PostCard";
import { useApp } from "../store/AppContext";
import { api } from "../services/api";
import type { ApiFeedPost, Post } from "../types";

type FeedTab = "生者动态" | "逝者回声" | "共鸣动态";

const groupPost: Post = {
  id: "post-group-001",
  characterId: "hua-fei",
  type: "群组动态",
  time: "昨天",
  text: "本会今日议题：输给爱情，算不算输？",
  group: {
    id: "yinanping",
    name: "意难平互助会",
    founder: "华妃发起",
    members: ["hua-fei", "fuheng", "chunyuan"],
  },
};

function apiFeedToPost(item: ApiFeedPost): Post {
  return {
    id: item.id,
    characterId: item.characterId,
    type: "剧后生活",
    text: item.content,
    time: "刚刚",
    stats: { likes: 0, comments: 0, shares: 0 },
  };
}

export function FeedPage() {
  const { allCharacters, emotionPosts } = useApp();
  const [tab, setTab] = useState<FeedTab>("生者动态");
  const [apiFeed, setApiFeed] = useState<ApiFeedPost[]>([]);

  useEffect(() => {
    api.feed.list().then((data) => setApiFeed(data.feed)).catch(() => {});
  }, []);

  const livingChars = allCharacters.filter((c) => c.is_alive);
  const deceasedChars = allCharacters.filter((c) => !c.is_alive);

  const apiFeedByChar = apiFeed.reduce<Record<string, Post[]>>((acc, item) => {
    const post = apiFeedToPost(item);
    acc[item.characterId] = [...(acc[item.characterId] ?? []), post];
    return acc;
  }, {});

  function allPostsWithApi(character: ReturnType<typeof useApp>["allCharacters"][number]): Post[] {
    return [
      ...(character.sample_posts ?? []),
      ...(apiFeedByChar[character.id] ?? []),
      ...(emotionPosts[character.id] ?? []),
    ];
  }

  const livingPosts = livingChars.flatMap((c) => allPostsWithApi(c).map((p) => ({ post: p, character: c })));
  const deceasedPosts = deceasedChars.flatMap((c) => allPostsWithApi(c).map((p) => ({ post: p, character: c })));
  const echoPosts = allCharacters.flatMap((c) =>
    (emotionPosts[c.id] ?? []).map((p) => ({ post: p, character: c })),
  );

  return (
    <Page title="动态">
      <SegmentedTabs<FeedTab>
        tabs={["生者动态", "逝者回声", "共鸣动态"]}
        value={tab}
        onChange={setTab}
      />
      <div className="space-y-3">
        {tab === "生者动态" &&
          livingPosts.map(({ post, character }) => (
            <PostCard key={post.id} post={post} character={character} />
          ))}
        {tab === "逝者回声" && (
          <>
            {deceasedPosts.map(({ post, character }) => (
              <PostCard key={post.id} post={post} character={character} />
            ))}
            <PostCard post={groupPost} character={allCharacters.find((c) => c.id === "hua-fei") ?? allCharacters[0]} />
          </>
        )}
        {tab === "共鸣动态" &&
          (echoPosts.length > 0 ? (
            echoPosts.map(({ post, character }) => (
              <PostCard key={post.id} post={post} character={character} />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#B8AFA5] bg-white/50 p-6 text-center">
              <p className="font-serif text-sm leading-7 text-[#766D62]">
                当你将逝者的信带回生者空间，
                <br />
                生者会感知到一丝回声，在这里留下痕迹。
              </p>
            </div>
          ))}
      </div>
    </Page>
  );
}
