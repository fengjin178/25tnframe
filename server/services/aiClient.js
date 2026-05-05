import OpenAI from "openai";

function fallbackText(messages = [], options = {}) {
  if (options.fallbackText) return options.fallbackText;
  const user = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (user.includes("JSON")) return "[]";
  return "这话落在第25帧里，不会没有回声。只是此刻风声太重，我需缓一缓再答你。";
}

export async function generateChatCompletion(messages, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.OPENAI_MODEL || "deepseek-chat";

  if (!apiKey) {
    return fallbackText(messages, options);
  }

  try {
    const client = new OpenAI({ apiKey, baseURL });
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.75,
      max_tokens: options.maxTokens ?? 800,
      response_format: options.responseFormat,
    });

    return completion.choices?.[0]?.message?.content?.trim() || fallbackText(messages, options);
  } catch (error) {
    console.error("AI completion failed:", error?.message || error);
    return fallbackText(messages, options);
  }
}
