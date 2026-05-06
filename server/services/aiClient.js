import fetch from "node-fetch"; // 如果你用 Node 18+ 可以直接用全局 fetch

function fallbackText(messages = [], options = {}) {
  if (options.fallbackText) return options.fallbackText;
  const user = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (user.includes("JSON")) return "[]";
  return "这话落在第25帧里，不会没有回声。只是此刻风声太重，我需缓一缓再答你。";
}

export async function generateChatCompletion(messages, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) {
    return fallbackText(messages, options);
  }

  try {
    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.75,
        max_tokens: options.maxTokens ?? 800,
        response_format: options.responseFormat,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek API error:", response.statusText);
      return fallbackText(messages, options);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || fallbackText(messages, options);
  } catch (error) {
    console.error("AI completion failed:", error?.message || error);
    return fallbackText(messages, options);
  }
}