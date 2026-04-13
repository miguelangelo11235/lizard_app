// ═══════════════════════════════════════════════════════════════
// storage.js — Persistencia con localStorage
// Top 10, retos diarios, estadísticas globales
// ═══════════════════════════════════════════════════════════════

window.StorageManager = (function () {
  const KEY = 'lagartija_run_data';

  // ── Estructura de datos por defecto ──
  function _getDefaultData() {
    return {
      scores: [],
      dailyChallenges: [],
      stats: {
        totalGames: 0,
        totalFlies: 0,
        bestScore: 0,
        totalDistance: 0,
        totalPowerups: 0
      },
      settings: {
        audioOn: true
      }
    };
  }

  // ── Cargar datos de localStorage ──
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : _getDefaultData();
    } catch (e) {
      return _getDefaultData();
    }
  }

  // ── Guardar datos en localStorage ──
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar:', e);
    }
  }

  // ── Obtener lista de puntajes (ya ordenada) ──
  function getScores() {
    return load().scores;
  }

  // ── ¿El puntaje entra en el top 10? ──
  function isTopTen(score) {
    const scores = getScores();
    if (scores.length < CONFIG.MAX_SCORES) return true;
    return score > scores[scores.length - 1].score;
  }

  // ── Agregar puntaje al ranking ──
  function addScore(name, score, flies, distance) {
    const data = load();
    const entry = {
      name: name.toUpperCase().slice(0, 10).trim(),
      score,
      flies,
      distance,
      date: new Date().toLocaleDateString('es-CO')
    };
    data.scores.push(entry);
    data.scores.sort((a, b) => b.score - a.score);
    data.scores = data.scores.slice(0, CONFIG.MAX_SCORES);
    save(data);
    return data.scores.findIndex(s => s.name === entry.name && s.score === entry.score && s.date === entry.date) + 1;
  }

  // ── Borrar todos los puntajes ──
  function clearScores() {
    const data = load();
    data.scores = [];
    save(data);
  }

  // ── Obtener reto diario (generar si no existe) ──
  function getDailyChallenge() {
    const data = load();
    const today = new Date().toISOString().slice(0, 10);
    const existing = data.dailyChallenges.find(d => d.date === today);
    if (existing) return existing;

    // Generar reto usando fecha como semilla
    const seed = parseInt(today.replace(/-/g, '')) % 5;
    const types = ['flies', 'survive', 'speed', 'combo', 'nodamage'];
    const type = types[seed];
    const goals = {
      flies: 15 + seed * 3,
      survive: 60 + seed * 20,
      speed: 4 + seed,
      combo: 2 + seed,
      nodamage: 30 + seed * 10
    };
    const descriptions = {
      flies: `Recolecta ${goals.flies} moscas en una partida`,
      survive: `Sobrevive ${goals.survive} segundos`,
      speed: `Alcanza el nivel de velocidad ${goals.speed}`,
      combo: `Activa el combo ${goals.combo} veces`,
      nodamage: `Sobrevive ${goals.nodamage} segundos sin recibir daño`
    };

    const newChallenge = {
      date: today,
      type,
      description: descriptions[type],
      goal: goals[type],
      progress: 0,
      completed: false,
      bonusEarned: false
    };

    data.dailyChallenges.push(newChallenge);
    data.dailyChallenges = data.dailyChallenges.slice(-30);
    save(data);
    return newChallenge;
  }

  // ── Actualizar progreso del reto diario ──
  function updateDailyProgress(type, amount) {
    const data = load();
    const today = new Date().toISOString().slice(0, 10);
    const challenge = data.dailyChallenges.find(d => d.date === today);
    if (!challenge || challenge.type !== type) return false;
    if (challenge.completed) return false;

    challenge.progress += amount;
    if (challenge.progress >= challenge.goal && !challenge.completed) {
      challenge.completed = true;
      save(data);
      return true; // señal: dar bonus
    }
    save(data);
    return false;
  }

  // ── Historial de retos (últimos 7 días) ──
  function getDailyChallengeHistory() {
    const data = load();
    return data.dailyChallenges.slice(-7).reverse();
  }

  // ── Actualizar estadísticas globales ──
  function updateStats(gameData) {
    const data = load();
    data.stats.totalGames++;
    data.stats.totalFlies += gameData.flies;
    data.stats.totalDistance += gameData.distance;
    data.stats.totalPowerups += gameData.powerups;
    if (gameData.score > data.stats.bestScore) {
      data.stats.bestScore = gameData.score;
    }
    save(data);
  }

  // ── Obtener estadísticas ──
  function getStats() {
    return load().stats;
  }

  // ── Preferencia de audio ──
  function getAudioOn() {
    return load().settings.audioOn;
  }

  function setAudioOn(val) {
    const data = load();
    data.settings.audioOn = !!val;
    save(data);
  }

  // ── API pública ──
  return {
    load,
    save,
    getScores,
    isTopTen,
    addScore,
    clearScores,
    getDailyChallenge,
    updateDailyProgress,
    getDailyChallengeHistory,
    updateStats,
    getStats,
    getAudioOn,
    setAudioOn
  };
})();
