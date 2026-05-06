import type { Group } from "../types";

export const groups: Group[] = [
  {
    id: "yinanping",
    name: "意难平互助会",
    founder: "华妃发起",
    status: "已加入",
    deadOnly: true,
    spaceType: "deceased",
    rules: ["只谈遗憾，不谈复仇", "允许哭泣，不允许崩溃", "每人只能说一件最意难平的事"],
    members: ["hua-fei", "fuheng", "chunyuan"],
    color: "#7B5EA7",
    bgColor: "#F0EAF8",
    textColor: "#7B5EA7",
  },
  {
    id: "power-women",
    name: "权谋女性观察室",
    founder: "华妃发起",
    status: "已加入",
    deadOnly: false,
    spaceType: "mixed",
    rules: ["只谈权谋，不谈情爱", "生者与逝者各抒己见，不得直接对话", "观点可以交锋，但不得人身攻击"],
    members: ["hua-fei", "wei-yingluo", "zhenhuan", "miyue"],
    color: "#C4643A",
    bgColor: "#F7E3D6",
    textColor: "#C4643A",
  },
  {
    id: "garden",
    name: "御花园茶话局",
    founder: "甄嬛发起",
    status: "未申请",
    deadOnly: false,
    spaceType: "living",
    rules: ["只谈风花雪月", "不提宫斗往事", "以茶代酒，以诗会友"],
    members: ["zhenhuan", "wei-yingluo", "miyue"],
    color: "#3AA56B",
    bgColor: "#E3F5EC",
    textColor: "#3AA56B",
  },
  {
    id: "strategy",
    name: "太后权谋夜谈",
    founder: "芈月发起",
    status: "审核中",
    deadOnly: false,
    spaceType: "living",
    rules: ["只谈权术，不谈儿女情长", "以史为鉴，不重蹈覆辙"],
    members: ["zhenhuan", "miyue"],
    color: "#4A7A8A",
    bgColor: "#DDECEF",
    textColor: "#4A7A8A",
  },
];

export function getGroupById(id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}
