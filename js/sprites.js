// ═══════════════════════════════════════════════════════════════
// sprites.js — Renderizado pixel art de personajes y fondos
// Todos los dibujos usan ctx.fillRect() con píxeles escalados.
// ═══════════════════════════════════════════════════════════════

window.Sprites = (function () {
  const S = CONFIG.CANVAS.SCALE;
  const C = CONFIG.COLORES;

  // ── Función auxiliar: dibujar píxel escalado ──
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * S, y * S, w * S, h * S);
  }

  // ═══════════════════════════════════════════
  // Lagartija — 4 etapas de evolución
  // ═══════════════════════════════════════════
  function drawLizard(ctx, lizard) {
    // Parpadeo de invencibilidad (no dibujar en frames pares)
    if (lizard.isInvincible && lizard.invincibleTimer % 4 < 2) return;

    ctx.save();
    ctx.translate(lizard.x, lizard.y);

    switch (lizard.stage) {
      case 0: drawLizardBaby(ctx, lizard.currentFrame); break;
      case 1: drawLizardAdult(ctx, lizard.currentFrame); break;
      case 2: drawLizardCrested(ctx, lizard.currentFrame); break;
      case 3: drawLizardDragon(ctx, lizard.currentFrame); break;
      default: drawLizardBaby(ctx, lizard.currentFrame);
    }

    // Burbuja de escudo
    if (lizard.isShielded) {
      drawShieldBubble(ctx, lizard);
    }

    ctx.restore();
  }

  // ── Stage 0: Lagartija bebé (~8×10 px lógicos) ──
  function drawLizardBaby(ctx, frame) {
    const g = C.LIZARD_GREEN;
    const d = C.LIZARD_DARK;
    const e = C.LIZARD_EYE;

    // Cabeza
    px(ctx, 5, 0, 3, 1, g);
    px(ctx, 4, 1, 4, 2, g);
    // Ojos
    px(ctx, 7, 1, 1, 1, e);
    // Cuerpo
    px(ctx, 2, 3, 5, 3, g);
    px(ctx, 1, 4, 1, 2, g);
    // Vientre
    px(ctx, 3, 4, 3, 2, d);
    // Cola
    px(ctx, 0, 5, 2, 1, g);
    px(ctx, 0, 6, 1, 1, d);

    // Patas según frame de animación
    if (frame === 0) {
      px(ctx, 2, 6, 1, 2, g);  // trasera abajo
      px(ctx, 6, 5, 1, 1, g);  // delantera arriba
    } else if (frame === 1) {
      px(ctx, 2, 5, 1, 1, g);  // trasera arriba
      px(ctx, 6, 6, 1, 2, g);  // delantera abajo
    } else {
      // Frame de salto
      px(ctx, 3, 6, 1, 2, g);
      px(ctx, 5, 6, 1, 2, g);
    }
  }

  // ── Stage 1: Lagartija adulta (~10×12 px lógicos) ──
  function drawLizardAdult(ctx, frame) {
    const g = C.LIZARD_GREEN;
    const d = C.LIZARD_DARK;
    const e = C.LIZARD_EYE;

    // Cabeza
    px(ctx, 6, 0, 4, 2, g);
    px(ctx, 5, 2, 5, 2, g);
    px(ctx, 9, 1, 1, 1, e);
    // Cuerpo
    px(ctx, 2, 4, 7, 3, g);
    px(ctx, 1, 5, 1, 2, g);
    px(ctx, 3, 5, 5, 2, d);
    // Cola
    px(ctx, 0, 6, 2, 1, g);
    px(ctx, 0, 7, 1, 1, d);

    if (frame === 0) {
      px(ctx, 3, 7, 1, 2, g);
      px(ctx, 7, 6, 1, 1, g);
    } else if (frame === 1) {
      px(ctx, 3, 6, 1, 1, g);
      px(ctx, 7, 7, 1, 2, g);
    } else {
      px(ctx, 4, 7, 1, 2, g);
      px(ctx, 6, 7, 1, 2, g);
    }
  }

  // ── Stage 2: Lagartija crestada (~11×13 px lógicos) ──
  function drawLizardCrested(ctx, frame) {
    const g = C.LIZARD_GREEN;
    const d = C.LIZARD_DARK;
    const e = C.LIZARD_EYE;
    const cr = '#e05555'; // cresta

    // Cresta
    px(ctx, 6, 0, 1, 1, cr);
    px(ctx, 7, 0, 1, 1, cr);
    px(ctx, 8, 0, 1, 1, cr);
    // Cabeza
    px(ctx, 6, 1, 5, 2, g);
    px(ctx, 5, 3, 6, 2, g);
    px(ctx, 10, 2, 1, 1, e);
    // Cuerpo
    px(ctx, 2, 5, 8, 3, g);
    px(ctx, 1, 6, 1, 2, g);
    px(ctx, 3, 6, 6, 2, d);
    // Cola
    px(ctx, 0, 7, 2, 1, g);
    px(ctx, 0, 8, 1, 1, d);

    if (frame === 0) {
      px(ctx, 3, 8, 1, 2, g);
      px(ctx, 8, 7, 1, 1, g);
    } else if (frame === 1) {
      px(ctx, 3, 7, 1, 1, g);
      px(ctx, 8, 8, 1, 2, g);
    } else {
      px(ctx, 4, 8, 1, 2, g);
      px(ctx, 7, 8, 1, 2, g);
    }
  }

  // ── Stage 3: Dragón dorado (~12×14 px lógicos) ──
  function drawLizardDragon(ctx, frame) {
    const gold = C.DRAGON_GOLD;
    const darkGold = '#B8860B';
    const e = C.LIZARD_EYE;
    const cr = '#FF4500';
    // Brillo animado
    const sparkle = (Date.now() % 400 < 200) ? '#FFFACD' : gold;

    // Cresta prominente
    px(ctx, 6, 0, 1, 1, cr);
    px(ctx, 7, 0, 2, 1, cr);
    px(ctx, 9, 0, 1, 1, cr);
    // Cabeza
    px(ctx, 6, 1, 6, 2, gold);
    px(ctx, 5, 3, 7, 2, gold);
    px(ctx, 11, 2, 1, 1, e);
    // Alas
    px(ctx, 3, 2, 2, 1, darkGold);
    px(ctx, 2, 3, 3, 1, darkGold);
    px(ctx, 1, 4, 2, 1, darkGold);
    // Cuerpo
    px(ctx, 2, 5, 9, 3, gold);
    px(ctx, 1, 6, 1, 2, gold);
    px(ctx, 3, 6, 7, 2, darkGold);
    // Brillo
    px(ctx, 6, 6, 1, 1, sparkle);
    // Cola
    px(ctx, 0, 7, 2, 1, gold);
    px(ctx, 0, 8, 1, 1, darkGold);

    if (frame === 0) {
      px(ctx, 3, 8, 1, 2, gold);
      px(ctx, 9, 7, 1, 1, gold);
    } else if (frame === 1) {
      px(ctx, 3, 7, 1, 1, gold);
      px(ctx, 9, 8, 1, 2, gold);
    } else {
      px(ctx, 4, 8, 1, 2, gold);
      px(ctx, 8, 8, 1, 2, gold);
    }
  }

  // ── Burbuja de escudo ──
  function drawShieldBubble(ctx, lizard) {
    ctx.strokeStyle = C.SHIELD_COLOR;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.01) * 0.2;
    const cx = lizard.width / 2;
    const cy = lizard.height / 2;
    const r = Math.max(lizard.width, lizard.height) * 0.65;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ═══════════════════════════════════════════
  // Piedra — 6 tipos (3 clásicos + 3 avanzados)
  // ═══════════════════════════════════════════
  function drawRock(ctx, rock) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    const g = C.ROCK_GRAY;
    const d = C.ROCK_DARK;
    const l = '#aaaaaa';
    const dl = '#666666';

    switch (rock.type) {
      case 1: // Pequeña ~6×5
        px(ctx, 1, 0, 4, 1, g);
        px(ctx, 0, 1, 6, 3, g);
        px(ctx, 1, 1, 2, 1, l);
        px(ctx, 1, 4, 4, 1, d);
        px(ctx, 0, 5, 6, 1, 'rgba(0,0,0,0.2)');
        break;

      case 2: // Mediana ~8×7
        px(ctx, 2, 0, 4, 1, g);
        px(ctx, 1, 1, 6, 2, g);
        px(ctx, 0, 3, 8, 3, g);
        px(ctx, 2, 1, 2, 2, l);
        px(ctx, 4, 2, 1, 1, d);
        px(ctx, 5, 3, 1, 1, d);
        px(ctx, 6, 4, 1, 1, d);
        px(ctx, 1, 6, 6, 1, d);
        px(ctx, 0, 7, 8, 1, 'rgba(0,0,0,0.2)');
        break;

      case 3: // Grande ~10×9
        px(ctx, 3, 0, 4, 1, g);
        px(ctx, 2, 1, 6, 2, g);
        px(ctx, 1, 3, 8, 2, g);
        px(ctx, 0, 5, 10, 3, g);
        px(ctx, 3, 1, 3, 2, l);
        px(ctx, 1, 5, 2, 1, l);
        px(ctx, 5, 3, 1, 1, d);
        px(ctx, 6, 4, 1, 1, d);
        px(ctx, 7, 5, 1, 1, d);
        px(ctx, 1, 8, 8, 1, d);
        px(ctx, 0, 9, 10, 1, 'rgba(0,0,0,0.25)');
        break;

      case 4: // Columna alta ~6×14 (requiere doble salto)
        // Tapa superior rugosa
        px(ctx, 1, 0, 4, 1, l);
        px(ctx, 0, 1, 6, 2, g);
        px(ctx, 1, 1, 2, 1, l);
        // Pilar central
        px(ctx, 0, 3, 6, 8, g);
        px(ctx, 1, 3, 1, 8, l);    // reflejo izquierdo
        px(ctx, 4, 4, 1, 6, d);    // sombra derecha
        // Grietas verticales
        px(ctx, 3, 5, 1, 1, d);
        px(ctx, 3, 7, 1, 1, d);
        px(ctx, 2, 9, 1, 1, d);
        // Base ancha
        px(ctx, 0, 11, 6, 2, g);
        px(ctx, 0, 13, 6, 1, d);
        px(ctx, 0, 14, 6, 1, 'rgba(0,0,0,0.25)');
        break;

      case 5: // Muro ancho ~16×8 (salto largo o timing preciso)
        // Cuerpo principal
        px(ctx, 0, 2, 16, 5, g);
        // Silueta superior irregular
        px(ctx, 1, 0, 3, 2, g);
        px(ctx, 5, 1, 4, 1, g);
        px(ctx, 10, 0, 4, 2, g);
        // Reflejos
        px(ctx, 1, 2, 3, 1, l);
        px(ctx, 6, 2, 2, 1, l);
        px(ctx, 11, 2, 2, 1, l);
        // Grietas
        px(ctx, 4, 3, 1, 1, d);
        px(ctx, 5, 4, 1, 1, d);
        px(ctx, 9, 3, 1, 1, dl);
        px(ctx, 13, 4, 1, 1, d);
        // Base oscura
        px(ctx, 0, 7, 16, 1, d);
        px(ctx, 0, 8, 16, 1, 'rgba(0,0,0,0.2)');
        break;

      case 6: // Pila doble ~12×12 (piedras apiladas, alto y ancho)
        // Piedra superior (más pequeña, desplazada)
        px(ctx, 3, 0, 4, 1, l);
        px(ctx, 2, 1, 6, 2, g);
        px(ctx, 3, 1, 2, 1, l);
        px(ctx, 1, 3, 8, 2, g);
        px(ctx, 5, 3, 1, 1, d);
        // Piedra inferior (más grande)
        px(ctx, 1, 5, 10, 1, dl);   // línea de unión
        px(ctx, 0, 6, 12, 4, g);
        px(ctx, 1, 6, 3, 2, l);
        px(ctx, 7, 7, 1, 1, d);
        px(ctx, 8, 8, 1, 1, d);
        px(ctx, 9, 7, 1, 1, d);
        px(ctx, 0, 10, 12, 1, g);
        px(ctx, 1, 11, 10, 1, d);
        px(ctx, 0, 12, 12, 1, 'rgba(0,0,0,0.25)');
        break;
    }
    ctx.restore();
  }

  // ═══════════════════════════════════════════
  // Mosca — 2 frames de animación
  // ═══════════════════════════════════════════
  function drawFly(ctx, fly) {
    ctx.save();
    ctx.translate(fly.x, fly.y);
    const b = C.FLY_BODY;
    const w = C.FLY_WING;

    // Cuerpo 2×2
    px(ctx, 2, 1, 2, 2, b);
    // Ojos
    px(ctx, 4, 1, 1, 1, '#ff0000');
    // Antenas
    px(ctx, 3, 0, 1, 1, '#333');
    px(ctx, 4, 0, 1, 1, '#333');

    if (fly.currentFrame === 0) {
      // Alas extendidas
      px(ctx, 0, 1, 2, 1, w);
      px(ctx, 4, 1, 2, 1, w);
    } else {
      // Alas inclinadas
      px(ctx, 1, 0, 1, 1, w);
      px(ctx, 4, 0, 1, 1, w);
    }
    ctx.restore();
  }

  // ═══════════════════════════════════════════
  // Power-Ups — 3 tipos con flotación
  // ═══════════════════════════════════════════
  function drawPowerUp(ctx, powerup) {
    ctx.save();
    ctx.translate(powerup.x, powerup.y);

    switch (powerup.type) {
      case 'shield':
        drawShieldPowerUp(ctx);
        break;
      case 'magnet':
        drawMagnetPowerUp(ctx);
        break;
      case 'turbo':
        drawTurboPowerUp(ctx);
        break;
    }
    ctx.restore();
  }

  function drawShieldPowerUp(ctx) {
    const c = C.SHIELD_COLOR;
    const d = '#2196F3';
    // Escudo ~8×10
    px(ctx, 1, 0, 6, 1, c);
    px(ctx, 0, 1, 8, 4, c);
    px(ctx, 1, 5, 6, 2, c);
    px(ctx, 2, 7, 4, 2, c);
    px(ctx, 3, 9, 2, 1, c);
    // Detalle interior
    px(ctx, 2, 2, 4, 2, d);
    px(ctx, 3, 4, 2, 2, d);
  }

  function drawMagnetPowerUp(ctx) {
    const c = C.MAGNET_COLOR;
    // Imán en U ~8×8
    px(ctx, 0, 0, 2, 5, '#ff0000');  // polo rojo
    px(ctx, 6, 0, 2, 5, '#4444ff');  // polo azul
    px(ctx, 0, 5, 8, 2, c);
    px(ctx, 2, 3, 4, 2, c);
    px(ctx, 0, 7, 2, 1, c);
    px(ctx, 6, 7, 2, 1, c);
  }

  function drawTurboPowerUp(ctx) {
    const c = C.TURBO_COLOR;
    const d = '#9C27B0';
    // Rayo ~6×10
    px(ctx, 3, 0, 2, 1, c);
    px(ctx, 2, 1, 3, 2, c);
    px(ctx, 1, 3, 4, 1, c);
    px(ctx, 2, 4, 3, 1, c);
    px(ctx, 3, 5, 2, 2, c);
    px(ctx, 2, 7, 3, 1, c);
    px(ctx, 1, 8, 2, 1, c);
    px(ctx, 0, 9, 2, 1, d);
  }

  // ═══════════════════════════════════════════
  // Corazón pixel art ~8×7
  // ═══════════════════════════════════════════
  function drawHeart(ctx, x, y, filled) {
    ctx.save();
    const color = filled ? '#ff3333' : '#444444';
    ctx.translate(x, y);
    px(ctx, 1, 0, 2, 1, color);
    px(ctx, 5, 0, 2, 1, color);
    px(ctx, 0, 1, 4, 2, color);
    px(ctx, 4, 1, 4, 2, color);
    px(ctx, 0, 3, 8, 1, color);
    px(ctx, 1, 4, 6, 1, color);
    px(ctx, 2, 5, 4, 1, color);
    px(ctx, 3, 6, 2, 1, color);
    ctx.restore();
  }

  // ═══════════════════════════════════════════
  // Ícono de power-up para HUD (4×4 mini)
  // ═══════════════════════════════════════════
  function drawPowerUpIcon(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);
    switch (type) {
      case 'shield':
        px(ctx, 0, 0, 4, 1, C.SHIELD_COLOR);
        px(ctx, 0, 1, 4, 2, C.SHIELD_COLOR);
        px(ctx, 1, 3, 2, 1, C.SHIELD_COLOR);
        break;
      case 'magnet':
        px(ctx, 0, 0, 1, 3, C.MAGNET_COLOR);
        px(ctx, 3, 0, 1, 3, C.MAGNET_COLOR);
        px(ctx, 0, 3, 4, 1, C.MAGNET_COLOR);
        break;
      case 'turbo':
        px(ctx, 2, 0, 2, 1, C.TURBO_COLOR);
        px(ctx, 1, 1, 2, 1, C.TURBO_COLOR);
        px(ctx, 0, 2, 2, 1, C.TURBO_COLOR);
        px(ctx, 1, 3, 2, 1, C.TURBO_COLOR);
        break;
    }
    ctx.restore();
  }

  // ── API pública ──
  return {
    drawLizard,
    drawRock,
    drawFly,
    drawPowerUp,
    drawHeart,
    drawPowerUpIcon
  };
})();
