export interface StartTopic {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  lines: string[];
}

export const startTopics: StartTopic[] = [
  {
    id: "about",
    label: "ABOUT",
    eyebrow: "INTRODUCTION",
    title: "关于这片海",
    lines: [
      "这里是浅仪式的个人博客，也是一次把博客做成视觉小说系统的长期实验。",
      "文章、游戏记录、动画、项目与一些没有被忘记的日常，会以各自合适的方式留在这里。",
    ],
  },
  {
    id: "status",
    label: "STATUS",
    eyebrow: "CURRENT STATE",
    title: "现在仍在施工",
    lines: [
      "LOAD ⅩⅢ 的风格已经确定，接下来正在把 START、EXTRA、OPTION 与文章阅读页真正做完。",
      "这不是实时监控；本条状态更新于 2026 年 7 月 28 日。",
    ],
  },
  {
    id: "updates",
    label: "UPDATES",
    eyebrow: "RECENT UPDATE",
    title: "最近留下的记录",
    lines: [
      "读取页已经拥有文章、玩家存档、流程图、故事场景与月度日记五种内容表现。",
      "特殊页面将共享同一套游戏系统语言，但不会被迫使用同一种布局。",
    ],
  },
  {
    id: "guide",
    label: "GUIDE",
    eyebrow: "SITE GUIDE",
    title: "第一次来这里",
    lines: [
      "想直接阅读文章，请进入 LOAD；想看 CG、项目、角色与追番记录，请进入 EXTRA。",
      "OPTION 会保存显示、文字、动效与鼠标指针偏好。重复访问时可以直接跳过开场。",
    ],
  },
  {
    id: "contact",
    label: "CONTACT",
    eyebrow: "DIRECT CONNECTION",
    title: "可以找到我的地方",
    lines: [
      "公开项目与本站源代码目前保存在 GitHub。其他联系方式会在确认公开范围后再加入。",
      "这里不会伪造一个无法真正送达的留言表单。",
    ],
  },
  {
    id: "random",
    label: "RANDOM",
    eyebrow: "RANDOM RECORD",
    title: "随便读取一条记录",
    lines: [
      "如果不想先理解整个网站，就从一篇文章开始。",
      "下面的入口会读取当前文章库里的一条真实记录。",
    ],
  },
];
