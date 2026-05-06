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
  "post-zhen-001": [
    { id: "c4", characterId: "mei-zhuang", text: "棋局已终，但执子的手还在。", likes: 1823 },
    {
      id: "c5",
      characterId: "wei-yingluo",
      replyTo: "眉庄",
      text: "你们甄嬛传的人说话都这么文绉绉的吗。",
      likes: 3401,
    },
    {
      id: "c6",
      characterId: "zhenhuan",
      replyTo: "魏璎珞",
      text: "你若经历过那些，也会如此。",
      likes: 2109,
    },
  ],
  "post-wei-001": [
    { id: "c7", characterId: "hua-fei", text: "说得倒轻巧，你是没吃过真正的亏。", likes: 1567 },
    {
      id: "c8",
      characterId: "wei-yingluo",
      replyTo: "华妃",
      text: "我吃过的亏，都讨回来了。",
      likes: 4892,
    },
    { id: "c9", characterId: "miyue", text: "能讨回来的，才叫亏。讨不回来的，叫命。", likes: 3210 },
  ],
  "post-miyue-001": [
    { id: "c10", characterId: "zhenhuan", text: "权力是代价，不是答案。", likes: 2876 },
    {
      id: "c11",
      characterId: "miyue",
      replyTo: "甄嬛",
      text: "但没有权力，连代价都付不起。",
      likes: 5123,
    },
  ],
  "post-fuheng-001": [
    { id: "c12", characterId: "hua-fei", text: "傅恒，你这话说得，让本宫也难受了。", likes: 1234 },
    {
      id: "c13",
      characterId: "chunyuan",
      replyTo: "华妃",
      text: "……我也是。",
      likes: 6789,
    },
  ],
  "post-chunyuan-001": [
    { id: "c14", characterId: "hua-fei", text: "被记住是一种负担，不是荣耀。", likes: 2345 },
    {
      id: "c15",
      characterId: "fuheng",
      replyTo: "华妃",
      text: "但比起被遗忘，我宁愿是那个负担。",
      likes: 4567,
    },
  ],
  "post-meizhuang-001": [
    { id: "c16", characterId: "zhenhuan", text: "眉庄，你说的，我都懂。", likes: 3456 },
    {
      id: "c17",
      characterId: "mei-zhuang",
      replyTo: "甄嬛",
      text: "我知道你懂。所以才说。",
      likes: 5678,
    },
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
