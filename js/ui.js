// ═══════════════════════════════════════════════════════════════
// ui.js — HUD, transiciones entre pantallas, formularios
// ═══════════════════════════════════════════════════════════════

window.UI = (function () {
  let currentFinalScore = 0;
  let currentFlies = 0;
  let currentDistance = 0;
  let currentPowerups = 0;

  // ── Mostrar pantalla por ID ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.remove('hidden');
      screen.style.animation = 'none';
      screen.offsetHeight; // forzar reflow
      screen.style.animation = 'fadeIn 0.3s ease';
    }
  }

  // ── Inicializar todos los event listeners ──
  function init() {
    // Botón INICIAR
    document.getElementById('btn-start').addEventListener('click', function () {
      GameAudio.getCtx(); // desbloquear AudioContext
      const audioOn = document.getElementById('toggle-audio').checked;
      StorageManager.setAudioOn(audioOn);
      if (audioOn) GameAudio.playMusic();
      game.initGame(false);
      showScreen('screen-game');
    });

    // Botón MEJORES PUNTAJES
    document.getElementById('btn-leaderboard').addEventListener('click', function () {
      showLeaderboard();
      showScreen('screen-leaderboard');
    });

    // Botón RETO DEL DÍA
    document.getElementById('btn-daily').addEventListener('click', function () {
      showDailyChallenge();
      showScreen('screen-daily');
    });

    // Botones VOLVER
    document.getElementById('btn-back-intro').addEventListener('click', function () {
      showScreen('screen-intro');
    });
    document.getElementById('btn-back-from-daily').addEventListener('click', function () {
      showScreen('screen-intro');
    });

    // Botón JUGAR DE NUEVO
    document.getElementById('btn-retry').addEventListener('click', function () {
      game.initGame(false);
      showScreen('screen-game');
    });

    // Botón VER PUNTAJES
    document.getElementById('btn-see-scores').addEventListener('click', function () {
      showLeaderboard();
      showScreen('screen-leaderboard');
    });

    // Botón GUARDAR PUNTAJE
    document.getElementById('btn-save-score').addEventListener('click', function () {
      const nameInput = document.getElementById('input-player-name');
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.style.borderColor = '#ff3333';
        nameInput.style.animation = 'shake 0.4s ease';
        setTimeout(() => {
          nameInput.style.animation = '';
        }, 400);
        return;
      }
      const pos = StorageManager.addScore(name, currentFinalScore, currentFlies, currentDistance);
      showSavedMessage(pos);
      document.getElementById('save-score-section').style.display = 'none';
      document.getElementById('already-saved').style.display = 'block';
    });

    // Botón BORRAR REGISTROS
    document.getElementById('btn-clear-scores').addEventListener('click', function () {
      if (confirm('¿Borrar todos los registros? Esta acción no se puede deshacer.')) {
        StorageManager.clearScores();
        showLeaderboard();
      }
    });

    // Botón JUGAR RETO DIARIO
    document.getElementById('btn-play-daily').addEventListener('click', function () {
      GameAudio.getCtx();
      const audioOn = document.getElementById('toggle-audio').checked;
      StorageManager.setAudioOn(audioOn);
      if (audioOn) GameAudio.playMusic();
      game.initGame(true);
      showScreen('screen-game');
    });

    // Toggle de audio
    document.getElementById('toggle-audio').addEventListener('change', function () {
      StorageManager.setAudioOn(this.checked);
      if (this.checked) {
        GameAudio.getCtx();
        GameAudio.resumeMusic();
      } else {
        GameAudio.pauseMusic();
      }
    });

    // Botón PAUSA
    document.getElementById('btn-pause').addEventListener('click', function () {
      game.togglePause();
    });

    // Cargar preferencia de audio
    document.getElementById('toggle-audio').checked = StorageManager.getAudioOn();
  }

  // ── Actualizar HUD durante el juego ──
  function updateHUD(score, lives, speed, level, comboActive, comboMult, powerupType) {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = 'PUNTOS: ' + String(score).padStart(5, '0');

    // Corazones
    const hearts = document.querySelectorAll('#hearts-display .heart');
    hearts.forEach((h, i) => {
      h.classList.toggle('empty', i >= lives);
    });

    const speedEl = document.getElementById('speed-display');
    if (speedEl) speedEl.textContent = 'VEL x' + speed.toFixed(1);

    const levelEl = document.getElementById('level-display');
    if (levelEl) levelEl.textContent = 'NIV ' + level;

    // Combo
    const comboEl = document.getElementById('combo-display');
    if (comboEl) {
      comboEl.style.display = comboActive ? 'block' : 'none';
      if (comboActive) comboEl.textContent = 'COMBO x' + comboMult;
    }

    // Powerup activo
    const puEl = document.getElementById('powerup-display');
    if (puEl) {
      if (powerupType) {
        puEl.style.display = 'block';
        const icons = { shield: '🛡️', magnet: '🧲', turbo: '⚡' };
        puEl.textContent = icons[powerupType] || '';
      } else {
        puEl.style.display = 'none';
      }
    }
  }

  // ── Mostrar pantalla de Game Over ──
  function showGameOver(score, flies, distance, powerups, isDailyMode, dailyCompleted) {
    currentFinalScore = score;
    currentFlies = flies;
    currentDistance = distance;
    currentPowerups = powerups;

    document.getElementById('final-score-display').textContent =
      'PUNTAJE: ' + String(score).padStart(5, '0');
    document.getElementById('stat-flies').textContent = 'Moscas: ' + flies;
    document.getElementById('stat-distance').textContent = 'Distancia: ' + distance + 'm';
    document.getElementById('stat-powerups').textContent = 'Power-ups: ' + powerups;

    // Banner de reto diario
    let dailyBanner = document.getElementById('daily-complete-banner');
    if (!dailyBanner) {
      dailyBanner = document.createElement('div');
      dailyBanner.id = 'daily-complete-banner';
      dailyBanner.style.cssText = 'color:#ffd700;font-size:0.5rem;margin:0.5rem 0;display:none;';
      document.getElementById('game-stats').after(dailyBanner);
    }
    if (isDailyMode && dailyCompleted) {
      dailyBanner.textContent = '🏆 ¡Reto del día completado! +500 puntos';
      dailyBanner.style.display = 'block';
    } else {
      dailyBanner.style.display = 'none';
    }

    // Verificar top 10
    const saveSection = document.getElementById('save-score-section');
    const alreadySaved = document.getElementById('already-saved');
    alreadySaved.style.display = 'none';

    if (StorageManager.isTopTen(score)) {
      saveSection.style.display = 'block';
      const input = document.getElementById('input-player-name');
      input.value = '';
      input.style.borderColor = '';
      setTimeout(() => input.focus(), 300);
    } else {
      saveSection.style.display = 'none';
    }

    showScreen('screen-gameover');
  }

  // ── Renderizar tabla de leaderboard ──
  function showLeaderboard() {
    const scores = StorageManager.getScores();
    const tbody = document.querySelector('#table-scores tbody');
    const noScores = document.getElementById('no-scores');
    tbody.innerHTML = '';

    if (scores.length === 0) {
      noScores.style.display = 'block';
    } else {
      noScores.style.display = 'none';
      scores.forEach((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
        const tr = document.createElement('tr');
        tr.style.animationDelay = (i * 80) + 'ms';
        tr.style.animation = 'slideUp 0.4s ease forwards';
        tr.style.opacity = '0';
        tr.innerHTML = `
          <td>${medal}</td>
          <td>${s.name}</td>
          <td>${s.score}</td>
          <td>${s.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Estadísticas globales
    const stats = StorageManager.getStats();
    const statsEl = document.getElementById('leaderboard-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span>Partidas jugadas: ${stats.totalGames}</span>
        <span>Total de moscas: ${stats.totalFlies}</span>
        <span>Mejor puntaje: ${stats.bestScore}</span>
      `;
    }
  }

  // ── Pantalla de reto diario ──
  function showDailyChallenge() {
    const challenge = StorageManager.getDailyChallenge();

    const typeLabels = {
      flies: 'Recolector de moscas 🪰',
      survive: 'Superviviente 💪',
      speed: 'Velocista 🏃',
      combo: 'Rey del combo 👑',
      nodamage: 'Sin rasguños 🛡️'
    };

    document.getElementById('daily-type').textContent = typeLabels[challenge.type] || challenge.type;
    document.getElementById('daily-description').textContent = challenge.description;

    const pct = Math.min(100, (challenge.progress / challenge.goal) * 100);
    document.getElementById('daily-progress-fill').style.width = pct + '%';
    document.getElementById('daily-progress-text').textContent =
      challenge.progress + ' / ' + challenge.goal;
    document.getElementById('daily-reward').textContent = 'Recompensa: +500 puntos bonus';

    const statusEl = document.getElementById('daily-status');
    if (challenge.completed) {
      statusEl.textContent = '¡Completado! ✓';
      statusEl.classList.add('completed');
    } else {
      statusEl.textContent = 'Pendiente';
      statusEl.classList.remove('completed');
    }

    // Historial
    const history = StorageManager.getDailyChallengeHistory();
    const historyEl = document.getElementById('daily-history');
    historyEl.innerHTML = '<h3 style="font-size:0.4rem;margin-bottom:0.5rem;color:#aaa;">Últimos 7 días:</h3>';
    history.forEach(h => {
      const div = document.createElement('div');
      div.textContent = `${h.date}: ${h.completed ? '✅' : '❌'} ${h.description}`;
      historyEl.appendChild(div);
    });
  }

  // ── Mensaje de puntaje guardado ──
  function showSavedMessage(position) {
    const el = document.getElementById('already-saved');
    el.textContent = '✓ ¡Guardado! Posición #' + position;
    el.style.display = 'block';
  }

  // ── Generar estrellas CSS animadas ──
  function generateStars(container) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = (1 + Math.random() * 2) + 'px';
      star.style.height = star.style.width;
      star.style.animationDuration = (1 + Math.random() * 3) + 's';
      star.style.animationDelay = (Math.random() * 2) + 's';
      container.appendChild(star);
    }
  }

  // ── API pública ──
  return {
    showScreen,
    init,
    updateHUD,
    showGameOver,
    showLeaderboard,
    showDailyChallenge,
    showSavedMessage,
    generateStars
  };
})();
