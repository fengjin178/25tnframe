import { memories } from "../data/memories.js";

const keywordMap = {
  皇上: ["皇帝", "欢宜香", "宠爱", "权力", "利用"],
  皇帝: ["皇帝", "欢宜香", "宠爱", "权力", "利用"],
  爱: ["爱", "情", "傅恒", "皇帝", "皇上"],
  恨: ["恨", "怨", "皇帝", "皇上", "棋子"],
  甄嬛: ["甄嬛"],
  华妃: ["华妃"],
  魏璎珞: ["魏璎珞"],
  傅恒: ["傅恒"],
  纯元: ["纯元"],
  芈月: ["芈月"],
  复活: ["复活", "回到现实", "改写"],
  重来: ["重来", "选择", "代价", "结局"],
  结局: ["结局", "代价", "改写"],
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function matchList(list = [], keywords = []) {
  return list.filter((item) => {
    const value = typeof item === "string" ? item : `${item.target}${item.attitude}${item.detail}`;
    return includesAny(value, keywords);
  });
}

export function getRelevantMemories(characterId, userText = "", context = {}) {
  const memory = memories[characterId];
  if (!memory) return null;

  const text = `${userText} ${JSON.stringify(context)}`;
  const keywords = Object.entries(keywordMap)
    .filter(([key]) => text.includes(key))
    .flatMap(([, values]) => values);

  const relevant = {
    corePersonality: memory.corePersonality ?? [],
    currentDigitalState: memory.currentDigitalState ?? [],
    forbiddenChanges: memory.forbiddenChanges ?? [],
    keyEvents: [],
    relationships: [],
    emotionalWounds: [],
  };

  if (keywords.length > 0) {
    relevant.keyEvents = matchList(memory.keyEvents, keywords).slice(0, 4);
    relevant.relationships = matchList(memory.relationships, keywords).slice(0, 4);
    relevant.emotionalWounds = matchList(memory.emotionalWounds, keywords).slice(0, 3);
  }

  if (relevant.keyEvents.length === 0) relevant.keyEvents = (memory.keyEvents ?? []).slice(0, 2);
  if (relevant.relationships.length === 0) relevant.relationships = (memory.relationships ?? []).slice(0, 2);
  if (relevant.emotionalWounds.length === 0) relevant.emotionalWounds = (memory.emotionalWounds ?? []).slice(0, 2);

  return relevant;
}
