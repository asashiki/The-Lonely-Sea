import { required } from "./dom.js";

export function createWeatherController({ body, reduceMotion, onChange, initialDensity = 1 }) {
  const canvas = required("#weather-canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("Weather canvas is unavailable");

  let width = 0;
  let height = 0;
  let weather = body.dataset.weather;
  let particles = [];
  let frameId = 0;
  let previousTime = 0;
  let weatherTimer = 0;
  let density = Math.min(1, Math.max(0, Number(initialDensity) || 0));

  function makeSnowSprite(size, coreOpacity) {
    const sprite = document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const spriteContext = sprite.getContext("2d");
    const center = size / 2;
    const gradient = spriteContext.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, `rgba(255,255,255,${coreOpacity})`);
    gradient.addColorStop(.22, `rgba(251,253,255,${coreOpacity * .88})`);
    gradient.addColorStop(.58, `rgba(241,247,252,${coreOpacity * .3})`);
    gradient.addColorStop(1, "rgba(235,243,250,0)");
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, size, size);
    return sprite;
  }

  const snowSprites = [
    makeSnowSprite(12, .94),
    makeSnowSprite(28, .92),
    makeSnowSprite(58, .82),
  ];

  const rainPalettes = {
    mist: { haze: [88, 116, 125], body: [108, 136, 145], glint: [211, 226, 231] },
    day: { haze: [88, 125, 137], body: [116, 153, 165], glint: [219, 235, 239] },
    night: { haze: [90, 124, 141], body: [175, 203, 214], glint: [236, 246, 248] },
    crimson: { haze: [116, 82, 86], body: [183, 155, 155], glint: [240, 225, 222] },
  };

  function getRainPalette() {
    return rainPalettes[body.dataset.scene] || rainPalettes.mist;
  }

  const rainWindByScene = {
    mist: .02,
    day: .05,
    night: .12,
    crimson: .1,
  };

  function getRainWind() {
    return rainWindByScene[body.dataset.scene] || rainWindByScene.mist;
  }

  function rgba(color, alpha) {
    return `rgba(${color.join(",")},${alpha})`;
  }

  // Reference-style rain: mostly vertical, short translucent streaks. Scene
  // wind adds a small leftward lean without ever painting over the artwork.
  const rainSpriteDefinitions = [
    [
      { width: 13, height: 78, slant: .015, thickness: 4.8, opacity: .62 },
      { width: 15, height: 92, slant: .03, thickness: 5.4, opacity: .68 },
      { width: 12, height: 70, slant: .045, thickness: 4.2, opacity: .56 },
      { width: 17, height: 104, slant: .02, thickness: 5.8, opacity: .64 },
    ],
    [
      { width: 16, height: 96, slant: .025, thickness: 5.8, opacity: .68 },
      { width: 19, height: 112, slant: .045, thickness: 6.6, opacity: .74 },
      { width: 15, height: 88, slant: .065, thickness: 5.2, opacity: .62 },
      { width: 21, height: 124, slant: .035, thickness: 7, opacity: .7 },
    ],
    [
      { width: 20, height: 120, slant: .035, thickness: 6.8, opacity: .74 },
      { width: 23, height: 138, slant: .055, thickness: 7.6, opacity: .8 },
      { width: 18, height: 108, slant: .08, thickness: 6.2, opacity: .68 },
      { width: 26, height: 152, slant: .045, thickness: 8, opacity: .76 },
    ],
  ];

  let rainSpriteScene = "";
  let rainSprites = null;

  function paintRainStreak(targetContext, {
    startX,
    startY,
    endX,
    endY,
    thickness,
    opacity,
    palette,
    halo = true,
  }) {
    const gradient = targetContext.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, rgba(palette.glint, 0));
    gradient.addColorStop(.12, rgba(palette.body, opacity * .12));
    gradient.addColorStop(.42, rgba(palette.body, opacity * .48));
    gradient.addColorStop(.78, rgba(palette.glint, opacity * .7));
    gradient.addColorStop(1, rgba(palette.glint, opacity));

    targetContext.save();
    if (halo) {
      targetContext.filter = "blur(.8px)";
      targetContext.strokeStyle = rgba(palette.body, opacity * .2);
      targetContext.lineWidth = thickness * 2.2;
      targetContext.beginPath();
      targetContext.moveTo(startX, startY);
      targetContext.lineTo(endX, endY);
      targetContext.stroke();
      targetContext.filter = "none";
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const profile = [
      [0, .06],
      [.08, .42],
      [.32, .78],
      [.68, .64],
      [.9, .3],
      [1, .04],
    ];

    targetContext.fillStyle = gradient;
    targetContext.beginPath();
    profile.forEach(([progress, widthFactor], index) => {
      const x = startX + dx * progress;
      const y = startY + dy * progress;
      const halfWidth = thickness * widthFactor * .5;
      const pointX = x + normalX * halfWidth;
      const pointY = y + normalY * halfWidth;
      if (index === 0) targetContext.moveTo(pointX, pointY);
      else targetContext.lineTo(pointX, pointY);
    });
    for (let index = profile.length - 1; index >= 0; index -= 1) {
      const [progress, widthFactor] = profile[index];
      const x = startX + dx * progress;
      const y = startY + dy * progress;
      const halfWidth = thickness * widthFactor * .5;
      targetContext.lineTo(x - normalX * halfWidth, y - normalY * halfWidth);
    }
    targetContext.closePath();
    targetContext.fill();

    targetContext.restore();
  }

  function makeRainSprite({ definition, palette, band, wind }) {
    const slant = definition.slant + wind;
    const sprite = document.createElement("canvas");
    const pathPadding = Math.ceil(definition.thickness * 3 + 4);
    sprite.width = Math.max(
      definition.width,
      Math.ceil(definition.height * slant + pathPadding * 2),
    );
    sprite.height = definition.height;
    const spriteContext = sprite.getContext("2d");
    const startX = sprite.width - pathPadding;
    const startY = 3;
    const endX = startX - definition.height * slant;
    const endY = definition.height - 3;
    const baseOpacity = definition.opacity * (band === 0 ? .62 : band === 1 ? .76 : .9);

    paintRainStreak(spriteContext, {
      startX,
      startY,
      endX,
      endY,
      thickness: definition.thickness,
      opacity: baseOpacity,
      palette,
      halo: true,
    });
    sprite.rainAnchor = startX / sprite.width;
    return sprite;
  }

  function getRainSprites(palette) {
    const scene = body.dataset.scene || "mist";
    const wind = getRainWind();
    const spriteKey = `${scene}:${wind}`;
    if (rainSprites && spriteKey === rainSpriteScene) return rainSprites;
    rainSpriteScene = spriteKey;
    rainSprites = rainSpriteDefinitions.map((bandDefinitions, band) => (
      bandDefinitions.map((definition) => makeRainSprite({ definition, palette, band, wind }))
    ));
    return rainSprites;
  }

  function createSnowParticle(initial = false) {
    const depth = Math.pow(Math.random(), 1.45);
    const size = .7 + depth * 7.2;
    return {
      kind: "snow",
      x: Math.random() * width,
      y: initial ? Math.random() * height : -size * 8,
      depth,
      size,
      speed: 19 + depth * 56 + Math.random() * 9,
      drift: -4 + Math.random() * 10,
      sway: 5 + depth * 18,
      phase: Math.random() * Math.PI * 2,
      alpha: .22 + depth * .7,
      sprite: depth > .76 ? 2 : depth > .34 ? 1 : 0,
    };
  }

  function createRainParticle(initial = false) {
    const depth = Math.random();
    const band = depth < .58 ? 0 : depth < .9 ? 1 : 2;
    const lengths = [18 + Math.random() * 10, 24 + Math.random() * 12, 30 + Math.random() * 16];
    const speeds = [840 + Math.random() * 240, 1040 + Math.random() * 300, 1280 + Math.random() * 380];
    const variant = Math.floor(Math.random() * rainSpriteDefinitions[band].length);
    const length = lengths[band];
    const alphas = [.24 + Math.random() * .14, .32 + Math.random() * .18, .42 + Math.random() * .2];
    const wind = getRainWind();
    return {
      kind: "rain",
      x: Math.random() * (width + 180) - 90,
      y: initial ? Math.random() * height : -length - Math.random() * height * .22,
      depth,
      band,
      variant,
      length,
      speed: speeds[band],
      wind: Math.max(0, wind + (Math.random() - .35) * .018),
      alpha: alphas[band],
    };
  }

  function populateParticles() {
    particles = [];
    if (weather === "clear" || reduceMotion.matches || !width || !height || density === 0) return;

    const area = width * height;
    const baseCount = weather === "snow"
      ? Math.min(270, Math.max(84, Math.round(area / 8200)))
      : Math.min(720, Math.max(220, Math.round(area / 1800)));
    const count = Math.round(baseCount * density);

    for (let index = 0; index < count; index += 1) {
      particles.push(weather === "snow" ? createSnowParticle(true) : createRainParticle(true));
    }
    if (weather === "rain") particles.sort((first, second) => first.depth - second.depth);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    // getBoundingClientRect() includes the 90deg body rotation used by the
    // mobile landscape preference. Read the layout box instead so the
    // backing bitmap keeps the canvas' unrotated aspect ratio.
    width = Math.max(1, canvas.offsetWidth || rect.width);
    height = Math.max(1, canvas.offsetHeight || rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    populateParticles();
  }

  function resetParticle(particle) {
    const next = particle.kind === "snow" ? createSnowParticle(false) : createRainParticle(false);
    Object.assign(particle, next);
  }

  function drawSnow(particle, delta, time) {
    particle.y += particle.speed * delta;
    particle.x += (particle.drift + Math.sin(time * .00055 + particle.phase) * particle.sway) * delta;

    if (particle.y > height + particle.size * 8 || particle.x < -80 || particle.x > width + 80) {
      resetParticle(particle);
      particle.x = Math.random() * width;
    }

    const sprite = snowSprites[particle.sprite];
    const renderSize = Math.max(3, particle.size * (particle.sprite === 2 ? 5.2 : 3.7));
    context.globalAlpha = particle.alpha;
    context.drawImage(sprite, particle.x - renderSize / 2, particle.y - renderSize / 2, renderSize, renderSize);
  }

  function drawRain(particle, delta, sprites) {
    particle.y += particle.speed * delta;
    particle.x -= particle.speed * particle.wind * delta;

    if (particle.y > height + particle.length || particle.x < -100) {
      resetParticle(particle);
      particle.x = Math.random() * (width + 160);
    }

    const sprite = sprites[particle.band][particle.variant];
    const renderHeight = particle.length / .92;
    const renderWidth = renderHeight * (sprite.width / sprite.height);
    context.globalAlpha = particle.alpha;
    context.drawImage(
      sprite,
      particle.x - renderWidth * sprite.rainAnchor,
      particle.y - renderHeight * .035,
      renderWidth,
      renderHeight,
    );
  }

  function drawFrame(time) {
    frameId = 0;
    if (document.hidden || reduceMotion.matches || weather === "clear") {
      context.clearRect(0, 0, width, height);
      return;
    }

    const delta = previousTime ? Math.min((time - previousTime) / 1000, .034) : .016;
    previousTime = time;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = weather === "snow" ? "screen" : "source-over";

    const rainPalette = weather === "rain" ? getRainPalette() : null;
    const currentRainSprites = rainPalette && particles.length ? getRainSprites(rainPalette) : null;

    for (const particle of particles) {
      if (particle.kind === "snow") drawSnow(particle, delta, time);
      else drawRain(particle, delta, currentRainSprites);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    frameId = requestAnimationFrame(drawFrame);
  }

  function start() {
    if (frameId || reduceMotion.matches || weather === "clear" || document.hidden) return;
    previousTime = 0;
    frameId = requestAnimationFrame(drawFrame);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    previousTime = 0;
    context.clearRect(0, 0, width, height);
  }

  function set(nextWeather) {
    if (nextWeather === weather) return;
    window.clearTimeout(weatherTimer);
    canvas.classList.add("is-switching");
    weatherTimer = window.setTimeout(() => {
      stop();
      weather = nextWeather;
      body.dataset.weather = weather;
      populateParticles();
      canvas.classList.remove("is-switching");
      onChange(weather);
      start();
    }, reduceMotion.matches ? 0 : 180);
  }

  function handlePreferenceChange() {
    stop();
    populateParticles();
    start();
  }

  function setDensity(value) {
    const nextDensity = Math.min(1, Math.max(0, Number(value) || 0));
    if (nextDensity === density) return;
    density = nextDensity;
    handlePreferenceChange();
  }

  return {
    get value() {
      return weather;
    },
    handlePreferenceChange,
    populateParticles,
    resize,
    set,
    setDensity,
    start,
    stop,
  };
}
