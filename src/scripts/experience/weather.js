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
    const depth = .18 + Math.random() * .82;
    return {
      kind: "rain",
      x: Math.random() * (width + 180) - 90,
      y: initial ? Math.random() * height : -60,
      depth,
      length: 8 + depth * 27,
      speed: 430 + depth * 690,
      slant: 4 + depth * 10,
      alpha: .09 + depth * .32,
      lineWidth: .45 + depth * .85,
    };
  }

  function populateParticles() {
    particles = [];
    if (weather === "clear" || reduceMotion.matches || !width || !height || density === 0) return;

    const area = width * height;
    const baseCount = weather === "snow"
      ? Math.min(270, Math.max(84, Math.round(area / 8200)))
      : Math.min(430, Math.max(150, Math.round(area / 5000)));
    const count = Math.round(baseCount * density);

    for (let index = 0; index < count; index += 1) {
      particles.push(weather === "snow" ? createSnowParticle(true) : createRainParticle(true));
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
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

  function drawRain(particle, delta) {
    particle.y += particle.speed * delta;
    particle.x -= particle.speed * .12 * delta;

    if (particle.y > height + particle.length || particle.x < -100) {
      resetParticle(particle);
      particle.x = Math.random() * (width + 160);
    }

    context.beginPath();
    context.moveTo(particle.x, particle.y);
    context.lineTo(particle.x - particle.slant, particle.y + particle.length);
    context.strokeStyle = `rgba(220,235,246,${particle.alpha})`;
    context.lineWidth = particle.lineWidth;
    context.stroke();
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

    for (const particle of particles) {
      if (particle.kind === "snow") drawSnow(particle, delta, time);
      else drawRain(particle, delta);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    frameId = requestAnimationFrame(drawFrame);
  }

  function start() {
    if (body.dataset.route !== "title" || frameId || reduceMotion.matches || weather === "clear" || document.hidden) return;
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
