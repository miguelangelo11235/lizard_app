// ═══════════════════════════════════════════════════════════════
// entities.js — Clases de entidades del juego
// Lizard, Rock, Fly, PowerUp, Particle y fábricas de partículas
// ═══════════════════════════════════════════════════════════════

const S = CONFIG.CANVAS.SCALE;

// ═══════════════════════════════════════════
// Clase Lizard — Protagonista del juego
// ═══════════════════════════════════════════
class Lizard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10 * S;
    this.height = 12 * S;
    this.velocityY = 0;
    this.isOnGround = true;
    this.jumpsLeft = 2;
    this.lives = CONFIG.VIDAS;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.isShielded = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.isTurbo = false;
    this.turboTimer = 0;
    this.stage = 0;
    this.currentFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 8;
    this.isDead = false;
    this.isJumping = false;
  }

  // ── Salto (simple o doble) ──
  jump() {
    if (this.jumpsLeft > 0) {
      const wasFirst = this.jumpsLeft === 2;
      this.velocityY = wasFirst
        ? CONFIG.FISICA.JUMP_FORCE
        : CONFIG.FISICA.DOUBLE_JUMP_FORCE;
      this.jumpsLeft--;
      this.isOnGround = false;
      this.isJumping = true;
      if (wasFirst) {
        GameAudio.playJump();
      } else {
        GameAudio.playDoubleJump();
      }
      return true;
    }
    return false;
  }

  // ── Actualización por frame ──
  update(score) {
    // Gravedad
    this.velocityY += CONFIG.FISICA.GRAVITY;
    this.y += this.velocityY;

    // Límite del suelo
    const groundLimit = CONFIG.CANVAS.GROUND_Y - this.height;
    if (this.y >= groundLimit) {
      this.y = groundLimit;
      this.velocityY = 0;
      this.isOnGround = true;
      this.jumpsLeft = 2;
      this.isJumping = false;
    }

    // Animación de caminata
    if (this.isJumping) {
      this.currentFrame = 2;
    } else {
      this.animTimer++;
      if (this.animTimer >= this.animSpeed) {
        this.currentFrame = 1 - this.currentFrame;
        this.animTimer = 0;
      }
    }

    // Timer de invencibilidad
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    // Timers de powerups
    if (this.isShielded) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) this.isShielded = false;
    }
    if (this.hasMagnet) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) this.hasMagnet = false;
    }
    if (this.isTurbo) {
      this.turboTimer--;
      if (this.turboTimer <= 0) this.isTurbo = false;
    }

    // Evolución según puntaje
    const thresholds = CONFIG.EVOLUCION_PERSONAJE.STAGE_THRESHOLDS;
    this.stage = thresholds.reduce((acc, t, i) => (score >= t ? i : acc), 0);
  }

  // ── Recibir daño ──
  takeDamage() {
    if (this.isInvincible) return false;
    if (this.isShielded) {
      this.isShielded = false;
      this.shieldTimer = 0;
      return false;
    }
    this.lives--;
    this.isInvincible = true;
    this.invincibleTimer = CONFIG.INVINCIBILITY_FRAMES;
    if (this.lives <= 0) this.isDead = true;
    return true;
  }

  activateShield() {
    this.isShielded = true;
    this.shieldTimer = CONFIG.POWERUPS.SHIELD_DURATION;
  }

  activateMagnet() {
    this.hasMagnet = true;
    this.magnetTimer = CONFIG.POWERUPS.MAGNET_DURATION;
  }

  activateTurbo() {
    this.isTurbo = true;
    this.turboTimer = CONFIG.POWERUPS.TURBO_DURATION;
  }

  draw(ctx) {
    Sprites.drawLizard(ctx, this);
  }

  // Hitbox reducida para tolerancia de colisión
  getHitbox() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      w: this.width - 8,
      h: this.height - 8
    };
  }
}


// ═══════════════════════════════════════════
// Clase Rock — Obstáculos (6 tipos + clusters)
// 1-3: clásicos | 4: columna alta | 5: muro ancho | 6: pila doble
// ═══════════════════════════════════════════
class Rock {
  /**
   * @param {number} canvasWidth
   * @param {number} speed
   * @param {number} [level=1] — nivel actual, afecta qué tipos aparecen
   * @param {number} [forceType] — forzar un tipo específico (usado por clusters)
   */
  constructor(canvasWidth, speed, level, forceType) {
    this.type = forceType || Rock.pickType(level || 1);
    this.speed = speed;
    switch (this.type) {
      case 1: this.width =  6 * S; this.height =  5 * S; break; // pequeña
      case 2: this.width =  8 * S; this.height =  7 * S; break; // mediana
      case 3: this.width = 10 * S; this.height =  9 * S; break; // grande
      case 4: this.width =  6 * S; this.height = 14 * S; break; // columna alta
      case 5: this.width = 16 * S; this.height =  8 * S; break; // muro ancho
      case 6: this.width = 12 * S; this.height = 12 * S; break; // pila doble
    }
    this.x = canvasWidth;
    this.y = CONFIG.CANVAS.GROUND_Y - this.height;
  }

  /** Selección de tipo ponderada por nivel */
  static pickType(level) {
    // Niveles bajos (1-2): solo tipos 1-3
    // Niveles 3+: tipos 1-6 con peso creciente para los difíciles
    if (level <= 2) {
      return Math.floor(Math.random() * 3) + 1;
    }
    // Pesos: tipo más difícil → más probable en niveles altos
    const weights = [
      10,                         // tipo 1
      10,                         // tipo 2
      12,                         // tipo 3
      6 + (level - 2) * 2,       // tipo 4 (columna)   — crece con nivel
      5 + (level - 2) * 2,       // tipo 5 (muro)      — crece con nivel
      4 + (level - 2) * 2        // tipo 6 (pila)      — crece con nivel
    ];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i + 1;
    }
    return 1;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    Sprites.drawRock(ctx, this);
  }

  getHitbox() {
    return {
      x: this.x + 2,
      y: this.y + 2,
      w: this.width - 4,
      h: this.height - 4
    };
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }
}


// ═══════════════════════════════════════════
// Clase Fly — Coleccionable con mov. senoidal
// ═══════════════════════════════════════════
class Fly {
  constructor(canvasWidth, speed) {
    this.speed = speed;
    this.width = 5 * S;
    this.height = 4 * S;
    this.x = canvasWidth;
    const relHeight = CONFIG.ENTIDADES.FLY_MIN_HEIGHT +
      Math.random() * (CONFIG.ENTIDADES.FLY_MAX_HEIGHT - CONFIG.ENTIDADES.FLY_MIN_HEIGHT);
    this.baseY = CONFIG.CANVAS.GROUND_Y - relHeight;
    this.y = this.baseY;
    this.amplitude = 10 + Math.random() * 15;
    this.phase = Math.random() * Math.PI * 2;
    this.currentFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 6;
    this.collected = false;
  }

  update() {
    this.x -= this.speed;
    this.phase += 0.08;
    this.y = this.baseY + Math.sin(this.phase) * this.amplitude;
    this.animTimer++;
    if (this.animTimer >= this.animSpeed) {
      this.currentFrame = 1 - this.currentFrame;
      this.animTimer = 0;
    }
  }

  draw(ctx) {
    Sprites.drawFly(ctx, this);
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }
}


// ═══════════════════════════════════════════
// Clase PowerUp — Escudo, Imán o Turbo
// ═══════════════════════════════════════════
class PowerUp {
  constructor(canvasWidth, speed) {
    const types = ['shield', 'magnet', 'turbo'];
    this.type = types[Math.floor(Math.random() * 3)];
    this.speed = speed * 0.8;
    this.size = 8 * S;
    this.x = canvasWidth;
    this.y = CONFIG.CANVAS.GROUND_Y - this.size - (40 + Math.random() * 80);
    this.floatPhase = 0;
    this.baseY = this.y;
    this.collected = false;
  }

  update() {
    this.x -= this.speed;
    this.floatPhase += 0.05;
    this.y = this.baseY + Math.sin(this.floatPhase) * 8;
  }

  draw(ctx) {
    Sprites.drawPowerUp(ctx, this);
  }

  applyTo(lizard) {
    switch (this.type) {
      case 'shield': lizard.activateShield(); break;
      case 'magnet': lizard.activateMagnet(); break;
      case 'turbo':  lizard.activateTurbo();  break;
    }
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.size, h: this.size };
  }

  isOffScreen() {
    return this.x + this.size < 0;
  }
}


// ═══════════════════════════════════════════
// Clase Particle — Partícula individual
// ═══════════════════════════════════════════
class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;   // gravedad leve
    this.vx *= 0.98;  // fricción
    this.life--;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.life <= 0;
  }
}


// ═══════════════════════════════════════════
// Fábricas de partículas
// ═══════════════════════════════════════════

function createDustParticles(x, y) {
  const particles = [];
  const count = 6 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(
      x + (Math.random() - 0.5) * 10,
      y,
      (Math.random() - 0.5) * 2,
      -Math.random() * 2,
      Math.random() > 0.5 ? CONFIG.COLORES.PARTICLE_DUST : '#c4a882',
      2 + Math.random() * 2,
      20 + Math.random() * 15
    ));
  }
  return particles;
}

function createFlyCollectParticles(x, y) {
  const particles = [];
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 1.5;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      CONFIG.COLORES.PARTICLE_FLY,
      2 + Math.random(),
      25 + Math.random() * 15
    ));
  }
  return particles;
}

function createDamageParticles(x, y) {
  const particles = [];
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(
      x, y,
      (Math.random() - 0.5) * 6,
      -Math.random() * 4 - 1,
      CONFIG.COLORES.PARTICLE_DAMAGE,
      3 + Math.random() * 2,
      20 + Math.random() * 10
    ));
  }
  return particles;
}

function createEvolveParticles(x, y) {
  const particles = [];
  const colors = [CONFIG.COLORES.DRAGON_GOLD, CONFIG.COLORES.LIZARD_GREEN, '#ffffff'];
  const count = 15 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      colors[Math.floor(Math.random() * colors.length)],
      3 + Math.random() * 3,
      40 + Math.random() * 20
    ));
  }
  return particles;
}
