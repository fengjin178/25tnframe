import type { Comment } from "../types";

export const initialComments: Record<string, Comment[]> = {
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

// 基于 postId 字符串 hash 生成稳定的点赞数，避免每次渲染随机跳变
export function stableLikeCount(postId: string): number {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = (hash << 5) - hash + postId.charCodeAt(i);
    hash |= 0;
  }
  return 100 + Math.abs(hash) % 2900;
}
