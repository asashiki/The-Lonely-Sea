export type PublishedFriend = {
  name: string;
  url: string;
  description: string;
  avatar?: string;
};

export const communicationConfig = Object.freeze({
  publicIssueUrl: "https://github.com/asashiki/The-Lonely-Sea/issues/new",
  site: Object.freeze({
    name: "Asashiki / 孤独之海",
    url: "https://asashiki.com",
    description: "浅仪式的个人博客，也是一套视觉小说式的内容读取系统。",
    rss: "https://asashiki.com/rss.xml",
  }),
});

// 只在确认真实站点信息后加入；空数组会显示真实的空状态，不生成示例友链。
export const publishedFriends: readonly PublishedFriend[] = Object.freeze([]);
