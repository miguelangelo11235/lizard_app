// ═══════════════════════════════════════════════════════════════
// game.js — Game loop principal, colisiones, dificultad
// Archivo principal que orquesta todos los módulos del juego.
// ═══════════════════════════════════════════════════════════════

(function () {
  // ── Variables privadas del módulo ──
  let canvas, ctx;
  let lizard;
  let rocks = [], flies = [], powerups = [], particles = [];
  let gameState;
  let animFrameId;
  let isDailyMode = false;

  // ── Estado del juego ──
  function createGameState() {
    return {
      running: false,
      paused: false,
      gameOver: false,
      score: 0,
      speed: CONFIG.VELOCIDAD.INITIAL_SPEED,
      level: 1,
      frameCount: 0,
      fliesCollected: 0,
      distance: 0,
      powerupsUsed: 0,
      comboCount: 0,
      comboActive: false,
      comboMultiplier: 1,
      lastRockFrame: 0,
      lastFlyFrame: 0,
      lastPowerupFrame: 0,
      lastEvolutionStage: 0,
      nodamageStreak: 0,
      currentDailyChallenge: null,
      dailyBonusEarned: false
    };
  }

  // ── Inicializar partida ──
  function initGame(dailyMode) {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    isDailyMode = !!dailyMode;
    lizard = new Lizard(80, CONFIG.CANVAS.GROUND_Y - 12 * CONFIG.CANVAS.SCALE);
    rocks = [];
    flies = [];
    powerups = [];
    particles = [];
    gameState = createGameState();

    ParallaxBackground.init(canvas);
    WeatherSystem.init(canvas);
    gameState.currentDailyChallenge = StorageManager.getDailyChallenge();

    if (StorageManager.getAudioOn()) GameAudio.playMusic();

    // Ocultar overlay de pausa
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');

    gameState.running = true;
    gameLoop();
  }

  // ── Bucle principal del juego ──
  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);

    if (!gameState.running || gameState.gameOver) return;

    // Si pausado, solo redibujar
    if (gameState.paused) {
      render();
      return;
    }

    // ════════ UPDATE ════════
    gameState.frameCount++;
    const turboMult = lizard.isTurbo ? CONFIG.POWERUPS.TURBO_POINTS_MULT : 1;
    gameState.score += CONFIG.PUNTUACION.TICK_POINTS * gameState.comboMultiplier * turboMult;
    gameState.distance++;
    gameState.nodamageStreak++;

    // ── Velocidad y nivel ──
    const newLevel = Math.floor(gameState.score / CONFIG.VELOCIDAD.SPEED_THRESHOLD) + 1;
    if (newLevel > gameState.level) {
      gameState.level = newLevel;
      gameState.speed = Math.min(
        CONFIG.VELOCIDAD.MAX_SPEED,
        CONFIG.VELOCIDAD.INITIAL_SPEED + (newLevel - 1) * CONFIG.VELOCIDAD.SPEED_INCREMENT
      );
      GameAudio.updateMusicTempo(newLevel);
      ArcadeMessages.add('level', canvas.width / 2, 40, 'VEL x' + gameState.speed.toFixed(1));
    }

    // ── Spawning de entidades ──
    spawnRock();
    spawnFly();
    spawnPowerUp();

    // ── Actualizar entidades ──
    lizard.update(gameState.score);
    rocks.forEach(r => r.update());
    flies.forEach(f => f.update());
    powerups.forEach(p => p.update());
    particles.forEach(p => p.update());

    // ── Efecto imán ──
    if (lizard.hasMagnet) {
      for (let fly of flies) {
        if (fly.collected) continue;
        const dx = (lizard.x + lizard.width / 2) - (fly.x + fly.width / 2);
        const dy = (lizard.y + lizard.height / 2) - (fly.y + fly.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.POWERUPS.MAGNET_RADIUS) {
          fly.x += dx * 0.08;
          fly.y += dy * 0.08;
        }
      }
    }

    // ── Colisiones ──
    checkCollisions();

    // ── Limpieza de entidades fuera de pantalla ──
    rocks = rocks.filter(r => !r.isOffScreen());
    flies = flies.filter(f => !f.isOffScreen() && !f.collected);
    powerups = powerups.filter(p => !p.isOffScreen() && !p.collected);
    particles = particles.filter(p => !p.isDead());

    // ── Actualizar sistemas ──
    WeatherSystem.update(gameState.score, canvas);
    ArcadeMessages.update();
    ParallaxBackground.update(gameState.speed);
    CRTEffect.update();
    EvolutionEffect.update();

    // ── Progreso de reto diario ──
    updateDailyProgress();

    // ── Check game over ──
    if (lizard.isDead) triggerGameOver();

    // ════════ RENDER ════════
    render();

    // ════════ HUD ════════
    const activePU = lizard.isShielded ? 'shield' :
      lizard.hasMagnet ? 'magnet' :
        lizard.isTurbo ? 'turbo' : null;
    UI.updateHUD(
      Math.floor(gameState.score),
      lizard.lives,
      gameState.speed,
      gameState.level,
      gameState.comboActive,
      gameState.comboMultiplier,
      activePU
    );
  }

  // ── Renderizado ──
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo con parallax
    ParallaxBackground.draw(ctx, canvas, gameState.score, WeatherSystem);

    // Efectos climáticos
    WeatherSystem.drawWeatherEffects(ctx, canvas);

    // Entidades
    rocks.forEach(r => r.draw(ctx));
    flies.forEach(f => f.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    particles.forEach(p => p.draw(ctx));

    // Protagonista
    lizard.draw(ctx);

    // Efecto de evolución
    EvolutionEffect.draw(ctx, canvas);

    // Overlay de pausa
    if (gameState.paused) drawPauseOverlay();

    // CRT sobre el canvas
    CRTEffect.draw(ctx, canvas);

    // Mensajes arcade encima de todo
    ArcadeMessages.draw(ctx);
  }

  // ── Overlay de pausa ──
  function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px '" + CONFIG.PIXEL_FONT + "'";
    ctx.fillStyle = '#ffe600';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSA', canvas.width / 2, canvas.height / 2);
    ctx.font = "7px '" + CONFIG.PIXEL_FONT + "'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('Presiona P o ESC para continuar', canvas.width / 2, canvas.height / 2 + 25);
  }

  // ── Spawn de piedras (con clusters aleatorios) ──
  function spawnRock() {
    const interval = Math.max(
      CONFIG.ENTIDADES.ROCK_MIN_INTERVAL,
      CONFIG.ENTIDADES.ROCK_MAX_INTERVAL * Math.pow(CONFIG.ENTIDADES.INTERVAL_REDUCTION, gameState.level - 1)
    );
    if (gameState.frameCount - gameState.lastRockFrame > interval + Math.random() * interval * 0.4) {
      // Probabilidad de cluster: 25% en nivel 3+, escalando con nivel
      const clusterChance = gameState.level >= 3 ? 0.15 + gameState.level * 0.02 : 0;
      if (Math.random() < clusterChance) {
        // Cluster: 2-3 piedras juntas con separación pequeña
        const clusterSize = Math.random() > 0.5 ? 3 : 2;
        let offset = 0;
        for (let i = 0; i < clusterSize; i++) {
          const r = new Rock(canvas.width + offset, gameState.speed, gameState.level);
          rocks.push(r);
          offset += r.width + Math.random() * 8; // pequeña separación
        }
      } else {
        rocks.push(new Rock(canvas.width, gameState.speed, gameState.level));
      }
      gameState.lastRockFrame = gameState.frameCount;
    }
  }

  // ── Spawn de moscas ──
  function spawnFly() {
    const interval = Math.max(
      CONFIG.ENTIDADES.FLY_MIN_INTERVAL,
      CONFIG.ENTIDADES.FLY_MAX_INTERVAL * Math.pow(CONFIG.ENTIDADES.INTERVAL_REDUCTION, gameState.level - 1)
    );
    if (gameState.frameCount - gameState.lastFlyFrame > interval + Math.random() * interval * 0.5) {
      flies.push(new Fly(canvas.width, gameState.speed));
      gameState.lastFlyFrame = gameState.frameCount;
    }
  }

  // ── Spawn de power-ups ──
  function spawnPowerUp() {
    if (gameState.frameCount - gameState.lastPowerupFrame > CONFIG.ENTIDADES.POWERUP_INTERVAL + Math.random() * 200) {
      powerups.push(new PowerUp(canvas.width, gameState.speed));
      gameState.lastPowerupFrame = gameState.frameCount;
    }
  }

  // ── Detección de colisiones AABB ──
  function AABB(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function checkCollisions() {
    const lHit = lizard.getHitbox();

    // Lagartija vs Piedras
    for (let rock of rocks) {
      const rHit = rock.getHitbox();
      if (AABB(lHit, rHit)) {
        if (lizard.takeDamage()) {
          particles.push(...createDamageParticles(lizard.x, lizard.y));
          GameAudio.playHurt();
          gameState.comboCount = 0;
          gameState.comboActive = false;
          gameState.comboMultiplier = 1;
          gameState.nodamageStreak = 0;
          // Vibrar HUD
          const hud = document.getElementById('hud');
          if (hud) {
            hud.style.animation = 'shake 0.3s ease';
            setTimeout(() => hud.style.animation = '', 300);
          }
        }
        break; // solo 1 colisión por frame
      }
    }

    // Lagartija vs Moscas
    for (let fly of flies) {
      if (fly.collected) continue;
      if (AABB(lHit, fly.getHitbox())) {
        fly.collected = true;
        gameState.fliesCollected++;
        gameState.score += CONFIG.PUNTUACION.FLY_POINTS * gameState.comboMultiplier;
        gameState.comboCount++;
        particles.push(...createFlyCollectParticles(fly.x, fly.y));
        GameAudio.playCollect();
        ArcadeMessages.add('fly', fly.x + fly.width / 2, fly.y, null);

        // Combo
        if (gameState.comboCount >= CONFIG.PUNTUACION.COMBO_THRESHOLD && !gameState.comboActive) {
          gameState.comboActive = true;
          gameState.comboMultiplier = CONFIG.PUNTUACION.COMBO_MULTIPLIER;
          GameAudio.playCombo();
          ArcadeMessages.add('combo', canvas.width / 2, 60, 'x' + gameState.comboMultiplier);
        }

        // Reto diario moscas
        if (StorageManager.updateDailyProgress('flies', 1)) {
          handleDailyCompleted();
        }

        // Mejor puntaje
        const stats = StorageManager.getStats();
        if (gameState.score > stats.bestScore) {
          ArcadeMessages.add('record', canvas.width / 2, 50, null);
        }
      }
    }

    // Lagartija vs PowerUps
    for (let pu of powerups) {
      if (pu.collected) continue;
      if (AABB(lHit, { x: pu.x, y: pu.y, w: pu.size, h: pu.size })) {
        pu.collected = true;
        pu.applyTo(lizard);
        gameState.powerupsUsed++;
        GameAudio.playPowerUp();
        ArcadeMessages.add('powerup', canvas.width / 2, 70, pu.type);
      }
    }

    // Evolución
    const thresholds = CONFIG.EVOLUCION_PERSONAJE.STAGE_THRESHOLDS;
    const stage = thresholds.reduce((acc, t, i) => (gameState.score >= t ? i : acc), 0);
    if (stage > gameState.lastEvolutionStage) {
      gameState.lastEvolutionStage = stage;
      particles.push(...createEvolveParticles(lizard.x, lizard.y));
      EvolutionEffect.trigger(stage, lizard.x, lizard.y);
    }
  }

  // ── Progreso de reto diario ──
  function updateDailyProgress() {
    if (!isDailyMode || !gameState.currentDailyChallenge) return;
    const ch = gameState.currentDailyChallenge;

    switch (ch.type) {
      case 'survive':
        if (gameState.frameCount % 60 === 0) {
          if (StorageManager.updateDailyProgress('survive', 1)) handleDailyCompleted();
        }
        break;
      case 'speed':
        if (gameState.frameCount % 60 === 0 && gameState.level > ch.progress) {
          if (StorageManager.updateDailyProgress('speed', gameState.level - ch.progress)) handleDailyCompleted();
        }
        break;
      case 'nodamage':
        if (gameState.frameCount % 60 === 0 && gameState.nodamageStreak > 0) {
          if (StorageManager.updateDailyProgress('nodamage', 1)) handleDailyCompleted();
        }
        break;
      case 'combo':
        // Se actualiza desde checkCollisions
        break;
    }
  }

  // ── Reto diario completado ──
  function handleDailyCompleted() {
    if (gameState.dailyBonusEarned) return;
    gameState.dailyBonusEarned = true;
    gameState.score += CONFIG.PUNTUACION.DAILY_BONUS;
    ArcadeMessages.add('daily', canvas.width / 2, canvas.height / 2, null);
  }

  // ── Game Over ──
  function triggerGameOver() {
    gameState.running = false;
    gameState.gameOver = true;
    GameAudio.stopMusic();
    GameAudio.playGameOver();

    StorageManager.updateStats({
      score: Math.floor(gameState.score),
      flies: gameState.fliesCollected,
      distance: gameState.distance,
      powerups: gameState.powerupsUsed
    });

    setTimeout(() => {
      UI.showGameOver(
        Math.floor(gameState.score),
        gameState.fliesCollected,
        gameState.distance,
        gameState.powerupsUsed,
        isDailyMode,
        gameState.dailyBonusEarned
      );
    }, 1500);
  }

  // ── Pausa ──
  function togglePause() {
    if (!gameState.running || gameState.gameOver) return;
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
      GameAudio.pauseMusic();
    } else {
      if (StorageManager.getAudioOn()) GameAudio.resumeMusic();
    }
  }

  // ── Controles de teclado ──
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState && !gameState.paused && !gameState.gameOver && gameState.running) {
        lizard.jump();
      }
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gameState && gameState.running) togglePause();
    }
  });

  // ── Controles táctiles ──
  document.addEventListener('DOMContentLoaded', function () {
    const c = document.getElementById('gameCanvas');
    if (c) {
      c.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (gameState && !gameState.paused && !gameState.gameOver && gameState.running) {
          lizard.jump();
        }
      }, { passive: false });
    }

    // Inicializar UI
    UI.init();
    UI.generateStars(document.getElementById('stars-container'));
  });

  // ── API pública ──
  window.game = {
    initGame,
    togglePause
  };
})();
