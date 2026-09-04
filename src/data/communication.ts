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

export const publishedFriends: readonly PublishedFriend[] = Object.freeze([
  Object.freeze({
    name: "714.fyi",
    url: "https://714.fyi/",
    description: "通往同一片孤独之海的另一处入口。",
  }),
]);
