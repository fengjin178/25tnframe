export const dramas = [
  {
    id: "zhen-huan-zhuan",
    title: "甄嬛传",
    coverColor: "#C4643A",
    bgColor: "#F7E3D6",
    description: "后宫权谋与情感的史诗，从天真到清醒的蜕变。",
    characterIds: ["hua-fei", "zhenhuan", "chunyuan", "mei-zhuang"],
  },
  {
    id: "yan-xi-gong-lue",
    title: "延禧攻略",
    coverColor: "#4A7A8A",
    bgColor: "#DDECEF",
    description: "行动型生存者的宫廷故事，不忍气吞声的反击之路。",
    characterIds: ["wei-yingluo", "fuheng"],
  },
  {
    id: "mi-yue-zhuan",
    title: "芈月传",
    coverColor: "#7B5EA7",
    bgColor: "#F0EAF8",
    description: "从情感与权力夹缝中走出的宣太后传奇。",
    characterIds: ["miyue"],
  },
];

export function getDramaById(id) {
  return dramas.find((d) => d.id === id);
}
