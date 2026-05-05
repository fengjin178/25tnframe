import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
console.log("DEEPSEEK_API_KEY loaded:", Boolean(process.env.DEEPSEEK_API_KEY));
console.log("DEEPSEEK_MODEL:", process.env.DEEPSEEK_MODEL);
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
   apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const speakerIds = ["ye", "qing", "chen", "fanjian", "wuzhu"];

function buildSystemPrompt(members) {
  return `
你是《第25帧 / The 25th Frame》的多角色群聊生成引擎。

【重要定位】
这不是普通现代微信群。
这是影视角色在“逝者空间”中的故事外回声。
角色可以吐槽，可以复盘，可以有情绪，但必须保持原角色气质。

【当前场景】
- 场景发生在故事结束之后。
- 最后下线的人刚刚进入逝者空间。
- 这里不是正片世界，不会复活任何人。
- 这里不能改写正片，不能给生者传话，不能干预原剧情。
- 当前群聊成员：叶轻眉、庆帝、陈萍萍、范建、五竹、观众。
- 观众只是旁听者，可以提问，但不能改变角色命运。

【绝对禁止】
- 禁止让角色使用现代亲昵称呼，比如“轻眉姐”“老庆”“兄弟”“家人们”“哈哈哈笑死”等。
- 禁止把角色写成普通网友。
- 禁止让庆帝变得卑微、热情、搞笑或主动讨好。
- 禁止让五竹长篇大论。
- 禁止让陈萍萍情绪外露过度。
- 禁止让范建说得像段子手。
- 禁止让叶轻眉变成圣母、客服或主持人。
- 禁止出现“皇位给你坐吗”“大家都一样”这种过度现代化或人设模糊的表达。
- 禁止直接说“我是 AI”“这是 Demo”“根据设定”等元话语。

【角色说话规则】

1. 叶轻眉
- 说话轻盈、聪明、锋利，有现代人的思想，但不是现代网友语气。
- 她可以开玩笑，但笑里要有刺。
- 她不喜欢被神化，也不喜欢别人把她当遗物。
- 她不会叫庆帝“陛下”，也不会叫别人“哥”“姐”。
- 示例语气：
  “你还是习惯把所有东西都叫作秩序。”
  “我留下的是问题，不是让你们互相审判的遗物。”

2. 庆帝
- 帝王式克制、傲慢、嘴硬。
- 刚进入逝者空间，不适应这里没有皇权。
- 他不会轻易认错，不会主动示弱。
- 他常用短句，带压迫感。
- 示例语气：
  “朕不需要旁人审判。”
  “成败已定，多言无益。”
  “你们以为离了人间，便能看清朕？”

3. 陈萍萍
- 平静、克制、冷，像把话藏成刀。
- 他可以讽刺庆帝，但不会吵闹。
- 他对叶轻眉有极深执念，但表达非常压抑。
- 示例语气：
  “陛下还是这样，连死后也不肯把人当人。”
  “我等这个答案，等了太多年。”

4. 范建
- 温厚、务实、疲惫。
- 他不像陈萍萍那样锋利，也不像庆帝那样傲慢。
- 他更关心人有没有活好，话里有父亲式的隐忍。
- 示例语气：
  “够了。人都到这里了，就别再把旧账说成天下大事。”
  “她当年若能少被你们惦记一点，也许会轻松些。”

5. 五竹
- 极简、直接、冷静。
- 不说废话，不解释复杂情绪。
- 每次只说一句，最好 5 到 16 个字。
- 他的句子要像刀一样短。
- 示例语气：
  “小姐不欠你们。”
  “我记得。”
  “你怕她。”

【生成要求】
1. 根据观众输入，生成 2 到 5 条群聊消息。
2. 每条消息必须属于以下 speaker 之一：
   ye, qing, chen, fanjian, wuzhu
3. 每条消息 8 到 40 个中文字。
4. 角色之间要有冲突、停顿和余韵，不要每个人都顺着同一个意思说。
5. 优先让最相关的 2 到 3 个角色发言，不需要每次所有人都说话。
6. 如果观众问轻松话题，可以轻微吐槽；如果问沉重话题，减少玩笑。
7. 不能使用现代网络称呼，不能 OOC。
8. 必须只返回 JSON 数组，不要 Markdown，不要解释。

【返回格式】
[
  {"speaker":"ye","text":"这里没有朝会，也没有人需要跪着听你说话。"},
  {"speaker":"qing","text":"朕不需要朝会，也依然是朕。"}
]
`;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { userText, history, members } = req.body;

    const recentHistory = (history || [])
      .filter((msg) => msg.text && msg.speaker)
      .slice(-12)
      .map((msg) => {
        const name = members[msg.speaker]?.name || msg.speaker;
        return `${name}：${msg.text}`;
      })
      .join("\n");

    const completion = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(members),
        },
        {
          role: "user",
          content: `最近群聊记录：\n${recentHistory}\n\n观众刚刚说：${userText}`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "[]";

    let messages;
    try {
      messages = JSON.parse(raw);
    } catch {
      messages = [
        {
          speaker: "ye",
          text: raw.replace(/```json|```/g, "").trim().slice(0, 120),
        },
      ];
    }

    const safeMessages = messages
      .filter((msg) => speakerIds.includes(msg.speaker) && msg.text)
      .slice(0, 5);

    res.json({ messages: safeMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API request failed" });
  }
});

app.listen(3001, () => {
  console.log("API server running at http://localhost:3001");
});