import { sceneArt } from "./config.js";
import { all, required } from "./dom.js";

const cgItems = [
  { title: "灰霭之海", meta: "SCENE / 01", art: sceneArt.mist },
  { title: "晴日潮声", meta: "SCENE / 02", art: sceneArt.day },
  { title: "无灯深夜", meta: "SCENE / 03", art: sceneArt.night },
  { title: "赤色梦境", meta: "SCENE / 04", art: sceneArt.crimson },
  { title: "潮汐习作", meta: "SKETCH / 05", art: sceneArt.day },
  { title: "遗失的窗景", meta: "CAPTURE / 06", art: sceneArt.mist },
  { title: "未采用界面", meta: "ARCHIVE / 07", art: sceneArt.crimson },
  { title: "冬夜存档", meta: "SCENE / 08", art: sceneArt.night },
];

const projectItems = [
  { title: "Asashiki", meta: "BLOG / ACTIVE", desc: "个人博客与内容迁移主线。", art: sceneArt.mist },
  { title: "Gal-blog", meta: "WEB EXPERIMENT", desc: "把 Blog 做成视觉小说式入口。", art: sceneArt.night },
  { title: "Bangumi Heatmap", meta: "DATA VISUAL", desc: "追番活动与年度观看记录。", art: sceneArt.day },
  { title: "Project Archive", meta: "REPOSITORY", desc: "完成、搁置与失败实验的陈列。", art: sceneArt.crimson },
  { title: "Theme Lab", meta: "DESIGN SYSTEM", desc: "角色主题和四场景视觉实验。", art: sceneArt.day },
  { title: "Tiny Tools", meta: "COLLECTION", desc: "散落在 GitHub 的小型工具。", art: sceneArt.mist },
];

const tracks = [
  ["01", "Lonely Sea", "04:18"],
  ["02", "After the Rain", "03:46"],
  ["03", "Blue Hour", "05:02"],
  ["04", "Crimson Sleep", "04:31"],
  ["05", "Reading Loop", "∞"],
];

const memories = [
  ["2026", "孤独之海", "CURRENT"],
  ["2025", "重写开始", "RECOLLECTION"],
  ["2024", "旧站迁移", "ARCHIVE"],
  ["2023", "追番之年", "ANIME"],
  ["2022", "项目搁浅", "PROJECT"],
  ["2021", "第一篇文章", "ORIGIN"],
  ["EX", "没有发生的结局", "IF ROUTE"],
  ["TRUE", "尚未写完", "LOCKED"],
  ["AFTER", "海仍在继续", "EPILOGUE"],
];

const timelineItems = [
  ["2021", "起点", "第一篇公开文章。"],
  ["2022", "收藏", "追番与游戏记录成形。"],
  ["2023", "扩张", "项目、状态与热力图加入。"],
  ["2025", "迁移", "重新整理 Asashiki。"],
  ["2026", "孤独之海", "Galgame Blog 视觉实验。"],
];

const characterProfiles = [
  { name: "爱丽丝", role: "LIBRARIAN / GUIDE", text: "负责整理文章、项目与未写完的记忆。她不是 CG 缩略图，而是这个站点的引导角色。" },
  { name: "水无灯里", role: "THEME / DAY", text: "晴日主题的占位角色。未来可以负责追番、旅行与温柔日常的内容入口。" },
  { name: "伊卡洛斯", role: "THEME / NIGHT", text: "暗夜主题的占位角色。未来可以连接音乐室、技术文章和深夜记录。" },
  { name: "COMING SOON", role: "UNASSIGNED ROUTE", text: "角色页可以承载主题、简介、关联文章和解锁记录，而不是重复的照片列表。" },
];

const defaultHover = {
  cg: ["灰霭之海", "HOVER TO PREVIEW / CLICK TO VIEW"],
  projects: ["Asashiki", "HOVER TO PREVIEW / CLICK TO OPEN"],
  music: ["Lonely Sea", "SELECT A TRACK"],
  memory: ["孤独之海", "OPEN RECOLLECTION"],
  timeline: ["起点", "OPEN TIMELINE ENTRY"],
  character: ["爱丽丝", "CHARACTER FILE"],
};

export function initExtraScreen() {
  const extraStage = required("#v4-extra-stage");
  const extraCanvas = required("#extra-canvas");
  const extraHover = required("#v4-extra-hover");
  const extraPageLabel = required("#extra-page-label");
  const extraPageProgress = required("#extra-page-progress");
  const extraPageButtons = all("[data-extra-page-direction]");
  const extraModeButtons = all("[data-v4-extra]");
  const cgViewer = required("#cg-viewer");
  const cgViewerArt = required("#cg-viewer-art");
  const cgViewerClose = required("#cg-viewer-close");

  let extraMode = "cg";
  let extraPage = 0;
  let cgIndex = 0;

  function setHover(title, action) {
    required("strong", extraHover).textContent = title;
    required("small", extraHover).textContent = action || "CLICK TO OPEN";
  }

  function totalPages() {
    return extraMode === "cg" ? Math.ceil(cgItems.length / 6) : 1;
  }

  function cgCardMarkup(item, index) {
    return `<button class="v4-extra-card" type="button" data-cg-index="${index}" data-hover-title="${item.title}" data-hover-action="CLICK TO VIEW FULLSCREEN" style="--card-art:url(${item.art})"><span class="v4-extra-card-copy"><strong>${item.title}</strong><small>${item.meta}</small><em>${String(index + 1).padStart(2, "0")} / ${String(cgItems.length).padStart(2, "0")}</em></span></button>`;
  }

  function renderCgRoom() {
    const start = extraPage * 6;
    const items = cgItems.slice(start, start + 6);
    extraStage.innerHTML = `<div class="v4-extra-grid">${items.map((item, offset) => cgCardMarkup(item, start + offset)).join("")}</div>`;
  }

  function renderProjects() {
    extraStage.innerHTML = `<div class="project-room">${projectItems.map((item) =>
      `<button class="project-card" type="button" data-hover-title="${item.title}" data-hover-action="OPEN PROJECT LINK"><span class="project-cover" style="--card-art:url(${item.art})"></span><span class="project-copy"><small>${item.meta}</small><strong>${item.title}</strong><p>${item.desc}</p><em>LIVE / REPO →</em></span></button>`
    ).join("")}</div>`;
  }

  function renderMusic() {
    extraStage.innerHTML = `<div class="music-room"><div class="music-disc" aria-hidden="true"></div><div class="track-list">${tracks.map((track, index) =>
      `<button class="track-row" type="button" data-track="${index}" data-hover-title="${track[1]}" data-hover-action="PLAY / PAUSE"><b>${track[0]}</b><strong>${track[1]}</strong><small>${track[2]}</small></button>`
    ).join("")}</div></div>`;
  }

  function renderMemory() {
    const columns = [memories.slice(0, 3), memories.slice(3, 6), memories.slice(6, 9)];
    extraStage.innerHTML = `<div class="memory-room">${columns.map((column, index) =>
      `<section class="memory-column"><h3>ROUTE ${String(index + 1).padStart(2, "0")}</h3>${column.map((item) =>
        `<button class="memory-item" type="button" data-hover-title="${item[1]}" data-hover-action="OPEN RECOLLECTION"><small>${item[0]}</small><span>${item[1]}</span><small>${item[2]}</small></button>`
      ).join("")}</section>`
    ).join("")}</div>`;
  }

  function renderTimeline() {
    extraStage.innerHTML = `<div class="timeline-room">${timelineItems.map((item) =>
      `<button class="timeline-item" type="button" data-hover-title="${item[1]}" data-hover-action="OPEN TIMELINE ENTRY"><small>${item[0]}</small><strong>${item[1]}</strong><p>${item[2]}</p></button>`
    ).join("")}</div>`;
  }

  function renderCharacter(index = 0) {
    const current = characterProfiles[index];
    extraStage.innerHTML = `<div class="character-room"><div class="character-portrait"><img src="/assets/lonely-sea/alice_chibi_transparent.png" alt=""></div><div class="character-profile"><div class="character-copy"><small>${current.role}</small><h3 id="character-name">${current.name}<span>CHARACTER FILE</span></h3><p id="character-text">${current.text}</p></div><div class="character-list">${characterProfiles.map((profile, profileIndex) =>
      `<button type="button" data-character="${profileIndex}" aria-pressed="${profileIndex === index}">${profile.name}</button>`
    ).join("")}</div></div></div>`;
  }

  function openCg(index) {
    cgIndex = (index + cgItems.length) % cgItems.length;
    const item = cgItems[cgIndex];
    cgViewerArt.style.setProperty("--cg-art", `url("${item.art}")`);
    required("#cg-viewer-index").textContent = `CG ${String(cgIndex + 1).padStart(2, "0")} / ${String(cgItems.length).padStart(2, "0")}`;
    required("#cg-viewer-title").textContent = item.title;
    cgViewer.setAttribute("aria-hidden", "false");
    cgViewerClose.focus({ preventScroll: true });
  }

  function closeCg() {
    if (cgViewer.getAttribute("aria-hidden") === "true") return false;
    cgViewer.setAttribute("aria-hidden", "true");
    return true;
  }

  function bindStage() {
    all("[data-hover-title]", extraStage).forEach((node) => {
      node.addEventListener("pointerenter", () => setHover(node.dataset.hoverTitle, node.dataset.hoverAction));
      node.addEventListener("focus", () => setHover(node.dataset.hoverTitle, node.dataset.hoverAction));
    });
    all("[data-cg-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => openCg(Number(node.dataset.cgIndex)));
    });
    all(".project-card", extraStage).forEach((node) => {
      node.addEventListener("click", () => setHover(node.dataset.hoverTitle, "PROJECT LINK PLACEHOLDER"));
    });
    all("[data-track]", extraStage).forEach((node) => {
      node.addEventListener("click", () => {
        all("[data-track]", extraStage).forEach((track) => track.classList.toggle("is-playing", track === node));
        setHover(node.dataset.hoverTitle, "NOW PLAYING / PROTOTYPE");
      });
    });
    all("[data-character]", extraStage).forEach((node) => {
      node.addEventListener("click", () => {
        const index = Number(node.dataset.character);
        renderCharacter(index);
        bindStage();
        setHover(characterProfiles[index].name, "CHARACTER FILE");
      });
    });
  }

  function renderMode() {
    if (extraMode === "cg") renderCgRoom();
    if (extraMode === "projects") renderProjects();
    if (extraMode === "music") renderMusic();
    if (extraMode === "memory") renderMemory();
    if (extraMode === "timeline") renderTimeline();
    if (extraMode === "character") renderCharacter();
    bindStage();

    const total = totalPages();
    extraCanvas.dataset.hasMultiplePages = String(total > 1);
    extraPageLabel.textContent = `PAGE ${String(extraPage + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    extraPageProgress.style.width = `${(extraPage + 1) / total * 100}%`;
    extraPageButtons.forEach((button) => {
      const direction = Number(button.dataset.extraPageDirection);
      button.disabled = direction < 0 ? extraPage === 0 : extraPage >= total - 1;
    });
    setHover(...defaultHover[extraMode]);
  }

  function setMode(mode) {
    extraMode = mode;
    extraPage = 0;
    extraModeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.v4Extra === mode));
    });
    renderMode();
  }

  function changePage(direction) {
    if (cgViewer.getAttribute("aria-hidden") === "false") {
      openCg(cgIndex + direction);
      return;
    }
    extraPage = Math.max(0, Math.min(extraPage + direction, totalPages() - 1));
    renderMode();
  }

  extraModeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.v4Extra)));
  extraPageButtons.forEach((button) => button.addEventListener("click", () => changePage(Number(button.dataset.extraPageDirection))));
  all("[data-cg-direction]").forEach((button) => button.addEventListener("click", () => openCg(cgIndex + Number(button.dataset.cgDirection))));
  cgViewerClose.addEventListener("click", closeCg);
  renderMode();

  return {
    changePage,
    closeCg,
  };
}
