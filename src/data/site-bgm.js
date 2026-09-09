// Original site/game music. Kept separate from the external MUSIC library.
export const SITE_BGM = Object.freeze([
  { id: "detectives-study", title: "Detective's Study - Gentle Monologue", src: "/assets/audio/bgm/detectives-study.mp3", context: "nvl" },
  { id: "quiet-tide", title: "Quiet Tide", src: "/assets/lonely-sea/quiet-tide.mp3", context: "blog" },
  { id: "morning-mist", title: "The Lonely Sea · Morning Mist", src: "/assets/audio/bgm/morning-mist.mp3", context: "blog" },
  { id: "daylight", title: "The Lonely Sea · Daylight", src: "/assets/audio/bgm/daylight.mp3", context: "blog" },
  { id: "still-night", title: "The Lonely Sea · Still Night", src: "/assets/audio/bgm/still-night.mp3", context: "blog" },
  { id: "crimson-night", title: "The Lonely Sea · Crimson Night", src: "/assets/audio/bgm/crimson-night.mp3", context: "blog" },
  { id: "cozy-lighthouse", title: "Cozy Lighthouse", src: "/games/lonely-sea-chapter-one/0.3.0-4830749c/assets/bgm-cozy-lighthouse-dialogue-cozy-lighthouse-dialogue.mp3", context: "game" },
]);

export const BLOG_BGM_TRACKS = Object.freeze(SITE_BGM.filter((track) => track.context === "blog").map((track) => track.src));
