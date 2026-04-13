// ═══════════════════════════════════════════════════════════════
// config.js — Constantes globales y parámetros de configuración
// ═══════════════════════════════════════════════════════════════

window.CONFIG = {
  // ── Dimensiones del canvas ──
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 300,
    GROUND_Y: 242,
    SCALE: 3
  },

  // ── Velocidad y dificultad ──
  VELOCIDAD: {
    INITIAL_SPEED: 3,
    MAX_SPEED: 12,
    SPEED_INCREMENT: 0.5,
    SPEED_THRESHOLD: 500
  },

  // ── Sistema de puntuación ──
  PUNTUACION: {
    TICK_POINTS: 1,
    FLY_POINTS: 15,
    SHIELD_POINTS: 0,
    COMBO_MULTIPLIER: 1.5,
    COMBO_THRESHOLD: 3,
    DAILY_BONUS: 500
  },

  // ── Física ──
  FISICA: {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    DOUBLE_JUMP_FORCE: -10
  },

  // ── Intervalos de spawn de entidades ──
  ENTIDADES: {
    ROCK_MIN_INTERVAL: 60,
    ROCK_MAX_INTERVAL: 120,
    FLY_MIN_INTERVAL: 80,
    FLY_MAX_INTERVAL: 200,
    FLY_MIN_HEIGHT: 60,
    FLY_MAX_HEIGHT: 190,
    POWERUP_INTERVAL: 800,
    INTERVAL_REDUCTION: 0.95
  },

  // ── Powerups ──
  POWERUPS: {
    SHIELD_DURATION: 180,
    MAGNET_DURATION: 300,
    MAGNET_RADIUS: 120,
    TURBO_DURATION: 360,
    TURBO_POINTS_MULT: 2
  },

  // ── Umbrales de clima ──
  CLIMA: {
    RAIN_THRESHOLD: 1500,
    NIGHT_THRESHOLD: 2000,
    STORM_THRESHOLD: 4000
  },

  // ── Evolución del personaje ──
  EVOLUCION_PERSONAJE: {
    STAGE_NAMES: ['Lagartija bebé', 'Lagartija adulta', 'Lagartija crestada', 'Dragón dorado'],
    STAGE_THRESHOLDS: [0, 1000, 3000, 5000]
  },

  // ── Vidas e invencibilidad ──
  VIDAS: 3,
  MAX_SCORES: 10,
  INVINCIBILITY_FRAMES: 120,

  // ── Paleta de colores para sprites ──
  COLORES: {
    LIZARD_GREEN:   '#3ddc84',
    LIZARD_DARK:    '#1a7a40',
    LIZARD_EYE:     '#000000',
    ROCK_GRAY:      '#888888',
    ROCK_DARK:      '#555555',
    FLY_BODY:       '#1a1aff',
    FLY_WING:       'rgba(200,200,255,0.6)',
    GROUND_BROWN:   '#8B5E3C',
    GROUND_DARK:    '#5C3D1E',
    GRASS_GREEN:    '#4CAF50',
    SKY_DAY:        '#5C94FC',
    SKY_NIGHT:      '#0a0a2e',
    CLOUD_WHITE:    '#FFFFFF',
    SHIELD_COLOR:   '#4fc3f7',
    MAGNET_COLOR:   '#ff9800',
    TURBO_COLOR:    '#ce93d8',
    DRAGON_GOLD:    '#FFD700',
    PARTICLE_DUST:  '#a0785a',
    PARTICLE_FLY:   '#4fc3f7',
    PARTICLE_DAMAGE:'#ff3333'
  },

  // ── Fuente pixel art ──
  PIXEL_FONT: 'Press Start 2P'
};
