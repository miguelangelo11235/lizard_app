// ═══════════════════════════════════════════════════════════════
// audio.js — Web Audio API: música y efectos de sonido procedurales
// Todos los sonidos son generados sin archivos externos.
// ═══════════════════════════════════════════════════════════════

window.GameAudio = (function () {
  let audioCtx = null;
  let musicPlaying = false;
  let musicTempo = 120;
  let musicTimeout = null;

  // ── Obtener/crear AudioContext bajo demanda ──
  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ── Función auxiliar: generar tono simple ──
  function tone(freq, type, duration, gainVal, startTime) {
    try {
      const ctx = getCtx();
      const t = startTime || ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(gainVal, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
      return { osc, gainNode };
    } catch (e) {
      return null;
    }
  }

  // ─────────────────────────────────────
  // Efectos de sonido
  // ─────────────────────────────────────

  // Salto — tono ascendente rápido
  function playJump() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // Doble salto — tono más agudo
  function playDoubleJump() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Recolectar mosca — jingle 3 notas Do-Mi-Sol
  function playCollect() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      tone(523, 'triangle', 0.08, 0.3, t);
      tone(659, 'triangle', 0.08, 0.3, t + 0.09);
      tone(784, 'triangle', 0.12, 0.4, t + 0.18);
    } catch (e) {}
  }

  // Combo activado — 4 notas ascendentes
  function playCombo() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => tone(freq, 'square', 0.07, 0.25, t + i * 0.07));
    } catch (e) {}
  }

  // Recibir daño — tono descendente distorsionado
  function playHurt() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch (e) {}
  }

  // Game Over — melodía descendente triste
  function playGameOver() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const notes = [392, 330, 262, 220, 175];
      notes.forEach((freq, i) => {
        tone(freq, 'sine', 0.25, 0.5, t + i * 0.22);
        tone(freq * 0.5, 'sine', 0.15, 0.3, t + i * 0.22);
      });
    } catch (e) {}
  }

  // Recoger Power-Up — tono ascendente brillante
  function playPowerUp() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.51);
    } catch (e) {}
  }

  // Evolución — fanfare de 6 notas ascendentes
  function playEvolve() {
    if (!StorageManager.getAudioOn()) return;
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const notes = [262, 330, 392, 523, 659, 784];
      notes.forEach((freq, i) => {
        tone(freq, 'square', 0.15, 0.4, t + i * 0.1);
        tone(freq, 'sine', 0.1, 0.15, t + i * 0.1);
      });
    } catch (e) {}
  }

  // ─────────────────────────────────────
  // Música de fondo adaptativa
  // ─────────────────────────────────────

  function playMusic() {
    if (!StorageManager.getAudioOn() || musicPlaying) return;
    musicPlaying = true;

    const melody = [523, 659, 784, 659, 523, 392, 523, 523];
    const bass = [131, 165, 196, 131, 131, 98, 131, 131];

    function playLoop() {
      if (!musicPlaying) return;
      try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const beatDuration = 60 / musicTempo;

        melody.forEach((freq, i) =>
          tone(freq, 'triangle', beatDuration * 0.8, 0.15, t + i * beatDuration)
        );
        bass.forEach((freq, i) =>
          tone(freq, 'sine', beatDuration * 1.8, 0.1, t + i * beatDuration)
        );

        musicTimeout = setTimeout(playLoop, melody.length * beatDuration * 1000);
      } catch (e) {}
    }

    playLoop();
  }

  function pauseMusic() {
    musicPlaying = false;
    if (musicTimeout) clearTimeout(musicTimeout);
  }

  function resumeMusic() {
    if (!musicPlaying) playMusic();
  }

  function stopMusic() {
    pauseMusic();
  }

  function setTempo(bpm) {
    musicTempo = bpm;
    if (musicPlaying) {
      pauseMusic();
      playMusic();
    }
  }

  function updateMusicTempo(level) {
    setTempo(120 + (level - 1) * 5);
  }

  // ── API pública ──
  return {
    getCtx,
    playJump,
    playDoubleJump,
    playCollect,
    playCombo,
    playHurt,
    playGameOver,
    playPowerUp,
    playEvolve,
    playMusic,
    pauseMusic,
    resumeMusic,
    stopMusic,
    setTempo,
    updateMusicTempo
  };
})();
