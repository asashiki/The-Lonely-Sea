export type SocialLink = {
  id: string;
  label: string;
  account: string;
  mark: string;
  href: string;
};

// EXIT 页是唯一会直接离开当前 Blog 页面的出口；账号集中维护，避免散落在组件模板里。
export const socialLinks: readonly SocialLink[] = Object.freeze([
  { id: "x", label: "X", account: "@asashiki_", mark: "𝕏", href: "https://x.com/asashiki_" },
  { id: "github", label: "GitHub", account: "asashiki", mark: "GH", href: "https://github.com/asashiki" },
  { id: "bangumi", label: "Bangumi", account: "user / asashiki", mark: "BG", href: "https://bangumi.tv/user/asashiki" },
  { id: "bilibili", label: "哔哩哔哩", account: "UID 35128108", mark: "哔", href: "https://space.bilibili.com/35128108?spm_id_from=333.1007.0.0" },
  { id: "steam", label: "Steam", account: "id / Asashiki", mark: "ST", href: "https://steamcommunity.com/id/Asashiki/" },
  { id: "telegram", label: "Telegram", account: "@asashiki_timeline", mark: "TG", href: "https://web.telegram.org/k/#@asashiki_timeline" },
]);
