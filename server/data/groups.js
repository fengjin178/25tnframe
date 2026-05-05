export const groups = [
  {
    id: "yinanping",
    name: "意难平互助会",
    spaceType: "deceased",
    members: ["hua-fei", "chunyuan", "fuheng"],
    rules: ["只允许逝者或遗憾型角色加入", "可以吐槽剧情、复盘人生、互相安慰", "允许角色之间有冲突、讽刺和沉默", "不要写成鸡汤", "不要让所有角色语气一致"],
  },
  {
    id: "power-women",
    name: "权谋女性观察室",
    spaceType: "mixed",
    members: ["hua-fei", "wei-yingluo", "zhenhuan", "miyue"],
    rules: ["讨论权力、情感、规则和生存策略", "华妃可以嘴硬和攻击，魏璎珞可以反击，甄嬛克制清醒，芈月战略性总结", "甄嬛必须是原剧完结后的最终人格状态，不得拆分前期/后期", "生者和逝者不能直接建立现实通信，只能在第25帧观众空间形成观点交锋"],
  },
];

export function getGroupById(id) {
  return groups.find((group) => group.id === id);
}
