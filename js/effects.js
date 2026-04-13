// ═══════════════════════════════════════════════════════════════
// effects.js — Clima dinámico, CRT, mensajes arcade, parallax, evolución
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════
// WeatherSystem — Lluvia, noche, tormenta
// ═══════════════════════════════════════════
window.WeatherSystem = (function () {
  let currentWeather = 'clear';
  let intensity = 0;
  let raindrops = [];
  let lightningTimer = 0;
  let lightningActive = false;
  let lightningDuration = 0;
  let stars = [];

  function init(canvas) {
    // Generar posiciones de estrellas para cielo nocturno
    stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (CONFIG.CANVAS.GROUND_Y - 40),
        size: Math.random() > 0.7 ? 2 : 1,
        blinkOffset: Math.random() * Math.PI * 2
      });
    }
    // Generar gotas de lluvia
    raindrops = [];
    for (let i = 0; i < 70; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * CONFIG.CANVAS.GROUND_Y
      });
    }
  }

  function update(score, canvas) {
    if (score >= CONFIG.CLIMA.STORM_THRESHOLD) {
      currentWeather = 'storm';
      intensity = 1.0;
    } else if (score >= CONFIG.CLIMA.NIGHT_THRESHOLD) {
      currentWeather = 'night';
      intensity = 0.8;
    } else if (score >= CONFIG.CLIMA.RAIN_THRESHOLD) {
      currentWeather = 'rain';
      intensity = 0.5;
    } else {
      currentWeather = 'clear';
      intensity = 0;
    }

    // Mover gotas de lluvia
    if (currentWeather === 'rain' || currentWeather === 'storm') {
      for (let drop of raindrops) {
        drop.y += 6 + intensity * 4;
        drop.x -= 1;
        if (drop.y > CONFIG.CANVAS.GROUND_Y) {
          drop.y = 0;
          drop.x = Math.random() * canvas.width;
        }
        if (drop.x < 0) drop.x = canvas.width;
      }
    }

    // Relámpagos
    if (currentWeather === 'storm') {
      lightningTimer++;
      if (lightningTimer > 80 + Math.random() * 120) {
        lightningActive = true;
        lightningDuration = 3;
      }
      if (lightningActive) {
        lightningDuration--;
        if (lightningDuration <= 0) {
          lightningActive = false;
          lightningTimer = 0;
        }
      }
    }
  }

  function drawWeatherEffects(ctx, canvas) {
    // Lluvia
    if (currentWeather === 'rain' || currentWeather === 'storm') {
      ctx.save();
      ctx.globalAlpha = 0.25 + intensity * 0.2;
      ctx.strokeStyle = '#aaddff';
      ctx.lineWidth = 1;
      for (let drop of raindrops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 3, drop.y + 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Flash de relámpago
    if (currentWeather === 'storm' && lightningActive) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function getSkyOverlayColor() {
    switch (currentWeather) {
      case 'night': return 'rgba(0,0,20,0.5)';
      case 'storm': return 'rgba(10,10,30,0.3)';
      case 'rain':  return 'rgba(0,0,15,0.15)';
      default:      return null;
    }
  }

  return {
    init,
    update,
    drawWeatherEffects,
    getSkyOverlayColor,
    get currentWeather() { return currentWeather; },
    get stars() { return stars; },
    get intensity() { return intensity; }
  };
})();


// ═══════════════════════════════════════════
// CRTEffect — Líneas de escaneo y viñeta
// ═══════════════════════════════════════════
window.CRTEffect = (function () {
  let scanlineOpacity = 0.12;
  let flickerTimer = 0;
  let vignetteOpacity = 0.4;

  function update() {
    flickerTimer++;
    if (flickerTimer >= 30) {
      scanlineOpacity = 0.10 + Math.random() * 0.05;
      flickerTimer = 0;
    }
  }

  function draw(ctx, canvas) {
    ctx.save();
    // Líneas de escaneo
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillStyle = `rgba(0,0,0,${scanlineOpacity})`;
      ctx.fillRect(0, y, canvas.width, 2);
    }
    // Viñeta
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.9
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${vignetteOpacity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  return { update, draw };
})();


// ═══════════════════════════════════════════
// ArcadeMessages — Mensajes pop-up animados
// ═══════════════════════════════════════════
window.ArcadeMessages = (function () {
  let messages = [];

  // Definición de tipos de mensaje
  const TYPES = {
    fly:     { color: '#4fc3f7', fontSize: 10, duration: 80,  prefix: '+15' },
    combo:   { color: '#ce93d8', fontSize: 14, duration: 100, prefix: '¡COMBO ' },
    powerup: { color: '#ff9800', fontSize: 12, duration: 90,  prefix: '⚡ ' },
    record:  { color: '#ffe600', fontSize: 14, duration: 120, prefix: '¡NUEVA MARCA!' },
    amazing: { color: '#3ddc84', fontSize: 11, duration: 90,  prefix: '' },
    level:   { color: '#ffffff', fontSize: 9,  duration: 80,  prefix: '' },
    daily:   { color: '#ffd700', fontSize: 14, duration: 150, prefix: '¡RETO! +500' },
    evolve:  { color: '#3ddc84', fontSize: 13, duration: 110, prefix: '¡EVOLUCIÓN! ' }
  };

  const amazingTexts = ['¡GENIAL!', '¡INCREÍBLE!', '¡ASOMBROSO!', '¡BRUTAL!', '¡WOW!'];

  function buildText(type, extraText) {
    const cfg = TYPES[type];
    switch (type) {
      case 'fly':     return cfg.prefix;
      case 'combo':   return cfg.prefix + (extraText || 'x1.5') + '!';
      case 'powerup': return cfg.prefix + (extraText || '').toUpperCase();
      case 'record':  return cfg.prefix;
      case 'amazing': return amazingTexts[Math.floor(Math.random() * amazingTexts.length)];
      case 'level':   return extraText || '';
      case 'daily':   return cfg.prefix;
      case 'evolve':  return cfg.prefix + (extraText || '');
      default:        return extraText || '';
    }
  }

  function add(type, x, y, extraText) {
    const cfg = TYPES[type] || TYPES['fly'];
    messages.push({
      type,
      x, y,
      text: buildText(type, extraText),
      timer: cfg.duration,
      maxTimer: cfg.duration,
      color: cfg.color,
      fontSize: cfg.fontSize
    });
  }

  function update() {
    for (let m of messages) m.timer--;
    messages = messages.filter(m => m.timer > 0);
  }

  function draw(ctx) {
    for (let msg of messages) {
      const progress = 1 - (msg.timer / msg.maxTimer);
      // Animación de escala popup
      let scale;
      if (progress < 0.2) {
        scale = 0.5 + (progress / 0.2) * 0.7;
      } else if (progress < 0.3) {
        scale = 1.2 - ((progress - 0.2) / 0.1) * 0.2;
      } else {
        scale = 1.0;
      }
      const offsetY = progress * 40;
      const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${Math.floor(msg.fontSize * scale)}px '${CONFIG.PIXEL_FONT}'`;
      ctx.fillStyle = msg.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(msg.text, msg.x, msg.y - offsetY);
      ctx.restore();
    }
  }

  return { add, update, draw };
})();


// ═══════════════════════════════════════════
// ParallaxBackground — Cielo, nubes, montañas, suelo
// ═══════════════════════════════════════════
window.ParallaxBackground = (function () {
  let offsets = { clouds: 0, mountains: 0, ground: 0 };
  let clouds = [];
  let mountainProfile = [];
  let decorations = [];
  let canvasRef = null;

  function init(canvas) {
    canvasRef = canvas;
    // Nubes
    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: 15 + Math.random() * 50,
        w: 30 + Math.random() * 40,
        h: 10 + Math.random() * 10
      });
    }
    // Perfil de montañas (serie de alturas)
    mountainProfile = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      mountainProfile.push({
        x: (canvas.width / segments) * i,
        h: 40 + Math.random() * 50
      });
    }
    // Decoraciones de suelo
    decorations = [];
    for (let i = 0; i < 25; i++) {
      decorations.push({
        x: Math.random() * canvas.width * 2,
        type: Math.random() > 0.5 ? 'stone' : 'grass',
        size: 1 + Math.floor(Math.random() * 2)
      });
    }
  }

  function update(gameSpeed) {
    offsets.clouds += gameSpeed * 0.1;
    offsets.mountains += gameSpeed * 0.3;
    offsets.ground += gameSpeed;

    // Mover decoraciones
    for (let d of decorations) {
      d.x -= gameSpeed;
      if (d.x < -10) d.x += canvasRef.width + Math.random() * canvasRef.width;
    }
  }

  function draw(ctx, canvas, score, weatherSystem) {
    const isNight = score >= CONFIG.CLIMA.NIGHT_THRESHOLD;
    const isStorm = score >= CONFIG.CLIMA.STORM_THRESHOLD;

    // ── 1. Cielo ──
    if (isNight || isStorm) {
      // Cielo nocturno con franjas
      for (let y = 0; y < CONFIG.CANVAS.GROUND_Y; y += 4) {
        const frac = y / CONFIG.CANVAS.GROUND_Y;
        const r = Math.floor(10 * (1 - frac));
        const g = Math.floor(10 * (1 - frac));
        const b = Math.floor(46 + 20 * frac);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, canvas.width, 4);
      }
      // Estrellas
      const wStars = weatherSystem.stars || [];
      for (let i = 0; i < wStars.length; i++) {
        const s = wStars[i];
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.001 + s.blinkOffset));
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      // Luna
      const moonX = canvas.width - 80;
      const moonY = 30;
      ctx.fillStyle = '#ffffee';
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy <= 18) {
            ctx.fillRect(moonX + dx * 2, moonY + dy * 2, 2, 2);
          }
        }
      }
    } else {
      // Cielo diurno con franjas degradadas
      for (let y = 0; y < CONFIG.CANVAS.GROUND_Y; y += 4) {
        const frac = y / CONFIG.CANVAS.GROUND_Y;
        const r = Math.floor(92 - 40 * frac);
        const g = Math.floor(148 - 20 * frac);
        const b = Math.floor(252 - 40 * frac);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, canvas.width, 4);
      }
    }

    // ── 2. Montañas (parallax 0.3x) ──
    const mColor = isNight ? '#1a2a3a' : '#2d5a27';
    ctx.fillStyle = mColor;
    const mOff = offsets.mountains % canvas.width;
    for (let i = 0; i < mountainProfile.length - 1; i++) {
      const p1 = mountainProfile[i];
      const p2 = mountainProfile[i + 1];
      const x1 = p1.x - mOff;
      const x2 = p2.x - mOff;
      // Dibujar montaña como rectángulo escalonado
      const avgH = (p1.h + p2.h) / 2;
      const drawX = ((x1 % canvas.width) + canvas.width) % canvas.width;
      ctx.fillRect(drawX, CONFIG.CANVAS.GROUND_Y - avgH, (canvas.width / mountainProfile.length) + 2, avgH);
    }

    // ── 3. Nubes (parallax 0.1x) ──
    const cloudColor = isStorm ? '#3a3a4a' : '#ffffff';
    ctx.fillStyle = cloudColor;
    ctx.globalAlpha = isStorm ? 0.8 : 0.7;
    for (let c of clouds) {
      const cx = ((c.x - offsets.clouds) % (canvas.width + c.w) + canvas.width + c.w) % (canvas.width + c.w) - c.w;
      // Nube pixel: grupo de rectángulos
      ctx.fillRect(cx + 4, c.y, c.w - 8, c.h);
      ctx.fillRect(cx, c.y + 3, c.w, c.h - 3);
      ctx.fillRect(cx + 8, c.y - 3, c.w - 16, 4);
    }
    ctx.globalAlpha = 1;

    // ── Overlay de clima ──
    const overlay = weatherSystem.getSkyOverlayColor();
    if (overlay) {
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, canvas.width, CONFIG.CANVAS.GROUND_Y);
    }

    // ── 4. Suelo ──
    // Franja de pasto
    ctx.fillStyle = CONFIG.COLORES.GRASS_GREEN;
    ctx.fillRect(0, CONFIG.CANVAS.GROUND_Y - 3, canvas.width, 3);

    // Suelo marrón con textura
    ctx.fillStyle = CONFIG.COLORES.GROUND_BROWN;
    ctx.fillRect(0, CONFIG.CANVAS.GROUND_Y, canvas.width, canvas.height - CONFIG.CANVAS.GROUND_Y);

    // Textura
    for (let x = 0; x < canvas.width; x += 8) {
      for (let y = CONFIG.CANVAS.GROUND_Y; y < canvas.height; y += 6) {
        if ((x + y) % 16 < 8) {
          ctx.fillStyle = CONFIG.COLORES.GROUND_DARK;
          ctx.fillRect(x, y, 4, 3);
        }
      }
    }

    // Decoraciones de suelo
    for (let d of decorations) {
      if (d.x < 0 || d.x > canvas.width) continue;
      if (d.type === 'stone') {
        ctx.fillStyle = '#7a6a5a';
        ctx.fillRect(d.x, CONFIG.CANVAS.GROUND_Y - 2, d.size * 3, d.size * 2);
      } else {
        ctx.fillStyle = '#5aaa4a';
        ctx.fillRect(d.x, CONFIG.CANVAS.GROUND_Y - 4, 1, 4);
        ctx.fillRect(d.x + 2, CONFIG.CANVAS.GROUND_Y - 5, 1, 5);
      }
    }
  }

  return { init, update, draw };
})();


// ═══════════════════════════════════════════
// EvolutionEffect — Flash visual de evolución
// ═══════════════════════════════════════════
window.EvolutionEffect = (function () {
  let active = false;
  let timer = 0;

  function trigger(stage, x, y) {
    active = true;
    timer = 60;
    ArcadeMessages.add('evolve', x, y, CONFIG.EVOLUCION_PERSONAJE.STAGE_NAMES[stage]);
    GameAudio.playEvolve();
  }

  function update() {
    if (active) {
      timer--;
      if (timer <= 0) active = false;
    }
  }

  function draw(ctx, canvas) {
    if (active && timer > 45) {
      ctx.fillStyle = `rgba(255,255,255,${(timer - 45) / 15 * 0.4})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { trigger, update, draw };
})();
