import chapter04zh from "../../content-drafts/nvl/2026-04.zh-CN.json";
import chapter06zh from "../../content-drafts/nvl/2026-06.zh-CN.json";
import chapter04ja from "../../content-drafts/nvl/2026-04.ja-JP.json";
import chapter06ja from "../../content-drafts/nvl/2026-06.ja-JP.json";
import chapter04en from "../../content-drafts/nvl/2026-04.en-US.json";
import chapter06en from "../../content-drafts/nvl/2026-06.en-US.json";

export interface NvlLine {
  type: "narration" | "quote" | "alice-voice" | "terminal" | "inner";
  text: string;
}

export interface NvlPage {
  pageId: string;
  lines: NvlLine[];
}

export interface NvlCutscene {
  type: "cutscene";
  subTitle: string;
  mainTitle: string;
  duration: number;
}

export interface NvlSceneInit {
  type: "scene_init";
  pov: "self" | "anna" | "claude" | "alice";
  povName: string;
  timestamp: string;
  bgStyle: string;
  /** Optional future CG/background hook; gradients remain the asset-free fallback. */
  bgImage?: string;
}

export interface NvlPageBlock {
  type: "page";
  pageId: string;
  lines: NvlLine[];
}

export type NvlScriptStep = NvlCutscene | NvlSceneInit | NvlPageBlock;

export interface NvlChapter {
  id: string;
  monthId: string; // e.g. "2026-04"
  year: string;
  monthNumber: string;
  monthName: string;
  title: string;
  subtitle: string;
  companion: "anna" | "claude" | "alice";
  companionName: string;
  coverArt: string;
  summary: string;
  scenario: NvlScriptStep[];
}

// Only published chapters belong here: this map is serialized into public HTML.
// Keep unpublished originals in content-drafts, outside the runtime import graph.
export const NVL_CHAPTERS_BY_LANGUAGE = {
  "ZH-CN": { "2026-04": chapter04zh, "2026-06": chapter06zh },
  "JA-JP": { "2026-04": chapter04ja, "2026-06": chapter06ja },
  "EN-US": { "2026-04": chapter04en, "2026-06": chapter06en }
} as unknown as Record<string, Record<string, NvlChapter>>;

export const NVL_CHAPTERS = NVL_CHAPTERS_BY_LANGUAGE["ZH-CN"];
