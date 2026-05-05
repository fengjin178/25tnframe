import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { characters, getCharacterById } from "./data/characters.js";
import { feedSeeds } from "./data/feedSeeds.js";
import { getGroupById } from "./data/groups.js";
import { generateChatCompletion } from "./services/aiClient.js";
import { getRelevantMemories } from "./services/memoryRetriever.js";
import { buildCharacterSystemPrompt } from "./services/promptBuilder.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function fallbackCharacterReply(character, message = "") {
  if (character.id === "hua-fei") return message.includes("皇") ? "恨？本宫从前不肯用这个字。如今想来，倒不是恨一个人，是恨自己竟把恩宠认作真心。" : "本宫不爱听虚话。你若真想问，就问得明白些。";
  if (character.id === "zhenhuan") return "有些事到最后才看得清。人活下来，不等于没有失去；只是不能再让失去牵着自己走。";
  if (character.id === "wei-yingluo") return "有话直说。若是不平，就想法子讨回来，光叹气没有用。";
  if (character.id === "miyue") return "选择从来不是只问愿不愿意，还要问你手里有什么、愿意付出什么。";
  if (character.id === "chunyuan") return "有些话隔得太久，说出口时，反倒轻了。";
  if (character.id === "fuheng") return "若能重来，也未必能改。只是有些话，当年该说得再早些。";
  return "我在听。";
}

function inferEmotion(character, text = "") {
  if (character.id === "hua-fei") return text.includes("皇") || text.includes("爱") ? "嘴硬破防" : "傲慢防御";
  if (character.id === "zhenhuan") return "清醒克制";
  if (character.id === "wei-yingluo") return "锋利反击";
  if (character.id === "miyue") return "战略审视";
  if (character.id === "chunyuan") return "温柔点破";
  if (character.id === "fuheng") return "克制遗憾";
  return "回声";
}

function stripCodeFence(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    const match = stripCodeFence(text).match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) return fallback;
    try {
      return JSON.parse(match[1]);
    } catch {
      return fallback;
    }
  }
}

function chooseGroupSpeakers(group, userText) {
  const text = userText || "";
  const members = group.members.map(getCharacterById).filter(Boolean);
  const scored = members.map((character) => {
    let score = 0;
    if (text.includes(character.name)) score += 5;
    if (text.includes("爱") || text.includes("皇") || text.includes("恨")) {
      if (["hua-fei", "zhenhuan", "fuheng"].includes(character.id)) score += 3;
    }
    if (text.includes("权") || text.includes("规则") || text.includes("生存")) {
      if (["zhenhuan", "miyue", "wei-yingluo"].includes(character.id)) score += 3;
    }
    if (text.includes("重来") || text.includes("选择") || text.includes("结局")) score += 2;
    return { character, score };
  });
  const selected = scored.sort((a, b) => b.score - a.score).slice(0, Math.min(3, Math.max(2, members.length))).map((item) => item.character);
  return selected.length ? selected : members.slice(0, 2);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/characters", (_req, res) => {
  res.json({ characters });
});

app.get("/api/feed", (_req, res) => {
  res.json({ feed: feedSeeds });
});

app.post("/api/chat/:characterId", async (req, res) => {
  const character = getCharacterById(req.params.characterId);
  if (!character) return res.status(404).json({ error: "Character not found" });

  const { message = "", history = [] } = req.body ?? {};
  const memories = getRelevantMemories(character.id, message, { history });
  const systemPrompt = buildCharacterSystemPrompt(character, memories, { sceneType: "private_chat" });

  const recentHistory = Array.isArray(history)
    ? history.slice(-10).map((item) => ({ role: item.from === "user" || item.role === "user" ? "user" : "assistant", content: item.text || item.content || "" })).filter((item) => item.content)
    : [];

  const reply = await generateChatCompletion([
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: message },
  ], { temperature: 0.78, maxTokens: 500, fallbackText: fallbackCharacterReply(character, message) });

  res.json({
    characterId: character.id,
    characterName: character.name,
    reply: reply || fallbackCharacterReply(character, message),
    emotion: inferEmotion(character, `${message}${reply}`),
  });
});

app.post("/api/groups/:groupId/messages", async (req, res) => {
  const group = getGroupById(req.params.groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const { message = "", history = [] } = req.body ?? {};
  const speakers = chooseGroupSpeakers(group, message);
  const speakerBrief = speakers.map((character) => `${character.id}:${character.name}:${character.speechStyle}`).join("\n");
  const groupPrompt = `你是“第25帧”群聊编排器。请根据观众输入生成 1-3 条群聊消息，只能使用候选角色。群聊不是每个人机械答题，要有关系张力，第二个角色可以回应第一个角色。

世界观边界：不复活角色，不改写原剧情；生者和逝者不能直接建立现实通信，只能在观众空间形成观点交锋；不得自称 AI；甄嬛只有 zhenhuan，必须是完结后的最终人格。

群聊：${group.name}
群规：${group.rules.map((rule) => `- ${rule}`).join("\n")}
候选角色：
${speakerBrief}

必须只返回 JSON，不要 Markdown。格式：
{"messages":[{"speakerId":"hua-fei","speakerName":"华妃","text":"...","emotion":"嘴硬破防","replyTo":"user"}]}`;

  const raw = await generateChatCompletion([
    { role: "system", content: groupPrompt },
    { role: "user", content: `历史消息：${JSON.stringify((history || []).slice(-8))}\n观众刚刚说：${message}` },
  ], { temperature: 0.82, maxTokens: 900, responseFormat: { type: "json_object" }, fallbackText: "[]" });

  const parsed = safeJsonParse(raw, null);
  const allowedIds = new Set(group.members);
  const messages = Array.isArray(parsed?.messages)
    ? parsed.messages.filter((item) => allowedIds.has(item.speakerId) && item.text).slice(0, 3)
    : [];

  if (messages.length > 0) return res.json({ messages });

  const fallbackMessages = speakers.slice(0, 2).map((character, index) => ({
    speakerId: character.id,
    speakerName: character.name,
    text: fallbackCharacterReply(character, message),
    emotion: inferEmotion(character, message),
    replyTo: index === 0 ? "user" : speakers[0].id,
  }));
  res.json({ messages: fallbackMessages });
});

app.post("/api/comments/generate", async (req, res) => {
  const { postCharacterId, postContent = "", commenterId, commenterRole = "viewer" } = req.body ?? {};

  if (commenterRole === "viewer") {
    return res.status(400).json({ error: "viewer comments are client-side only" });
  }

  const commenter = getCharacterById(commenterId);
  const postCharacter = getCharacterById(postCharacterId);
  if (!commenter || !postCharacter) return res.status(404).json({ error: "Character not found" });

  if (commenter.spaceType !== postCharacter.spaceType) {
    return res.json({ blocked: true, reason: "生者与逝者之间无法直接交流" });
  }

  const memories = getRelevantMemories(commenter.id, postContent, {});
  const systemPrompt = buildCharacterSystemPrompt(commenter, memories, { sceneType: "comment_reply" });

  const reply = await generateChatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `请以${commenter.name}的身份，对${postCharacter.name}的这条动态写一句评论（20-50字，保持角色语气）：\n"${postContent}"` },
  ], { temperature: 0.8, maxTokens: 150, fallbackText: fallbackCharacterReply(commenter, postContent) });

  res.json({
    commenterId: commenter.id,
    commenterName: commenter.name,
    text: reply || fallbackCharacterReply(commenter, postContent),
    emotion: inferEmotion(commenter, reply),
  });
});

app.post("/api/feed/generate", async (req, res) => {
  const { characterId, triggerType = "daily_life", context = "" } = req.body ?? {};
  const character = getCharacterById(characterId);
  if (!character) return res.status(404).json({ error: "Character not found" });

  const memories = getRelevantMemories(character.id, context, { triggerType });
  const sceneType = triggerType === "unsent_letter" ? "unsent_letter" : "feed_post";
  const systemPrompt = buildCharacterSystemPrompt(character, memories, { sceneType, extra: context });
  const content = await generateChatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `请生成一条第25帧动态。触发类型：${triggerType}。上下文：${context}。只输出动态正文，不要标题。` },
  ], { temperature: 0.82, maxTokens: 420, fallbackText: fallbackCharacterReply(character, context) });

  res.json({
    post: {
      id: `generated-${Date.now()}`,
      characterId: character.id,
      characterName: character.name,
      source: character.source,
      spaceType: character.spaceType,
      postType: triggerType,
      content: content || fallbackCharacterReply(character, context),
      emotionTag: triggerType === "unsent_letter" ? "未寄出的执念" : inferEmotion(character, content),
      visibility: "public",
      comments: [],
    },
  });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
