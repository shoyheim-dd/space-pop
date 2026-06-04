import { Player } from './entities/player';
import { Projectile } from './entities/projectile';
import { PowerUp, POWERUP_TYPES, PowerUpType } from './entities/powerup';
import { Renderer } from './renderer';
import { Input } from './input';
import { WaveSystem } from './systems/wave';
import { ComboSystem } from './systems/combo';
import { ParticleSystem } from './systems/particles';
import { checkCollisions } from './systems/collision';
import { BottleType, BOTTLES, CANVAS_WIDTH, CANVAS_HEIGHT, POWERUP_DROP_CHANCE, POWERUP_SHIELD_DURATION, POWERUP_DOUBLE_CARB_DURATION, WAVE_CLEAR_BONUS_MULTIPLIER, NO_DAMAGE_BONUS } from './utils/constants';
import { vec2, randomRange } from './utils/math';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export class Game {
  state: GameState = 'menu';
  renderer: Renderer;
  input: Input;
  player!: Player;
  playerProjectiles: Projectile[] = [];
  enemyProjectiles: Projectile[] = [];
  powerups: PowerUp[] = [];
  waves: WaveSystem;
  combo: ComboSystem;
  particles: ParticleSystem;
  score = 0;
  wave = 0;
  waveDamageTaken = false;
  selectedBottle: BottleType = 'cola';
  screenShake = 0;
  private lastTime = 0;
  private pauseDebounce = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.waves = new WaveSystem();
    this.combo = new ComboSystem();
    this.particles = new ParticleSystem();
  }

  start(): void {
    this.state = 'playing';
    this.score = 0;
    this.wave = 0;
    this.player = new Player(this.selectedBottle);
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.powerups = [];
    this.waveDamageTaken = false;
    this.waves.spawnWave(0);
    this.updateUI();
  }

  update(dt: number): void {
    if (this.state !== 'playing') return;

    // Pause handling
    if (this.input.pause) {
      if (!this.pauseDebounce) {
        this.state = 'paused';
        this.pauseDebounce = true;
      }
      return;
    }
    this.pauseDebounce = false;

    // Player movement
    let mx = 0, my = 0;
    if (this.input.moveLeft) mx -= 1;
    if (this.input.moveRight) mx += 1;
    if (this.input.moveUp) my -= 1;
    if (this.input.moveDown) my += 1;
    this.player.update(dt, mx, my);

    // Shooting
    if (this.input.shooting && this.player.canShoot()) {
      this.firePlayerWeapon();
    }

    // Special ability
    if (this.input.special && this.player.specialCharge >= 100) {
      this.fireSpecial();
    }

    // Update projectiles
    for (const p of this.playerProjectiles) p.update(dt);
    for (const p of this.enemyProjectiles) p.update(dt);
    this.playerProjectiles = this.playerProjectiles.filter(p => p.alive);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.alive);

    // Update power-ups
    for (const pu of this.powerups) pu.update(dt);
    this.powerups = this.powerups.filter(p => p.alive);

    // Update wave
    this.waves.update(dt);

    // Enemy shooting
    const shooter = this.waves.getShootingEnemy();
    if (shooter) {
      this.enemyProjectiles.push(
        new Projectile(
          { x: shooter.pos.x, y: shooter.pos.y + shooter.height / 2 },
          { x: randomRange(-30, 30), y: 200 },
          'enemy',
          false,
        )
      );
    }

    // Collisions
    checkCollisions(
      this.player,
      this.playerProjectiles,
      this.enemyProjectiles,
      this.waves.enemies,
      this.powerups,
      (enemy) => this.onEnemyKilled(enemy),
      () => this.onPlayerHit(),
      (pu) => this.onPowerUpCollected(pu),
    );

    // Combo
    this.combo.update(performance.now());

    // Particles
    this.particles.update(dt);

    // Screen shake decay
    if (this.screenShake > 0) this.screenShake *= 0.9;
    if (this.screenShake < 0.5) this.screenShake = 0;

    // Wave complete check
    if (this.waves.waveComplete) {
      this.nextWave();
    }

    this.updateUI();
  }

  private firePlayerWeapon(): void {
    this.player.shoot();
    const { x, y } = this.player.pos;
    const type = this.player.config.projectileType;

    const shootLane = (originX: number, originY: number, laneDirection = 0, speedScale = 1): void => {
      switch (type) {
        case 'cap':
          this.playerProjectiles.push(
            new Projectile(vec2(originX, originY - 30), vec2(laneDirection * 25, -400 * speedScale), 'cap', true)
          );
          break;
        case 'fizz':
          // Spread shot
          this.playerProjectiles.push(
            new Projectile(vec2(originX, originY - 30), vec2(-60 + laneDirection * 18, -380 * speedScale), 'fizz', true)
          );
          this.playerProjectiles.push(
            new Projectile(vec2(originX, originY - 30), vec2(laneDirection * 22, -400 * speedScale), 'fizz', true)
          );
          this.playerProjectiles.push(
            new Projectile(vec2(originX, originY - 30), vec2(60 + laneDirection * 18, -380 * speedScale), 'fizz', true)
          );
          break;
        case 'bubble': {
          const proj = new Projectile(
            vec2(originX, originY - 30),
            vec2(laneDirection * 20, -300 * speedScale),
            'bubble',
            true
          );
          // Find nearest enemy for homing
          const alive = this.waves.enemies.filter(e => e.alive);
          if (alive.length > 0) {
            const nearest = alive.reduce((a, b) => {
              const da = Math.abs(a.pos.x - originX) + Math.abs(a.pos.y - originY);
              const db = Math.abs(b.pos.x - originX) + Math.abs(b.pos.y - originY);
              return da < db ? a : b;
            });
            proj.target = nearest.pos;
          }
          this.playerProjectiles.push(proj);
          break;
        }
        case 'foam':
          this.playerProjectiles.push(
            new Projectile(vec2(originX, originY - 30), vec2(laneDirection * 16, -250 * speedScale), 'foam', true)
          );
          break;
      }
    };

    // Main lane
    shootLane(x, y, 0, 1);

    // Sidewinder companion lanes: each stack adds one left+right wingman pair
    if (this.player.sidewinderActive) {
      const baseOffset = this.player.width + 16;
      const ringSpacing = Math.max(10, this.player.width * 0.7);
      for (let stack = 0; stack < this.player.sidewinderStacks; stack++) {
        const sideOffset = baseOffset + stack * ringSpacing;
        const speedScale = Math.max(0.72, 0.9 - stack * 0.05);
        shootLane(x - sideOffset, y - 2, -1, speedScale);
        shootLane(x + sideOffset, y - 2, 1, speedScale);
      }
    }
  }

  private fireSpecial(): void {
    this.player.specialCharge = 0;
    this.screenShake = 8;
    this.particles.emit(this.player.pos.x, this.player.pos.y, this.player.config.color, 40, 200, 1);

    // All specials damage all enemies on screen for simplicity (MVP)
    for (const enemy of this.waves.enemies) {
      if (enemy.alive) {
        const killed = enemy.hit(2);
        this.particles.emitSpark(enemy.pos.x, enemy.pos.y, '#fff', 5);
        if (killed) {
          this.onEnemyKilled(enemy);
        }
      }
    }
  }

  private onEnemyKilled(enemy: import('./entities/enemy').Enemy): void {
    const mult = this.combo.registerKill(performance.now());
    const points = enemy.points * mult;
    this.score += points;

    // Particles
    this.particles.emit(enemy.pos.x, enemy.pos.y, enemy.color, 12, 120, 0.6);
    if (mult > 1) {
      this.particles.emitText(enemy.pos.x, enemy.pos.y - 20, `×${mult}`, '#ffeb3b');
    }
    this.particles.emitText(enemy.pos.x, enemy.pos.y, `+${points}`, '#fff');

    // Power-up drop
    if (Math.random() < POWERUP_DROP_CHANCE) {
      const sidewinderShare = 0.12;
      let type: PowerUpType;
      if (Math.random() < sidewinderShare) {
        type = 'sidewinderBottle';
      } else {
        const nonSideTypes = POWERUP_TYPES.filter(t => t !== 'sidewinderBottle');
        type = nonSideTypes[Math.floor(Math.random() * nonSideTypes.length)];
      }
      this.powerups.push(new PowerUp(type, vec2(enemy.pos.x, enemy.pos.y)));
    }
  }

  private onPlayerHit(): void {
    // Sidewinder persists until player gets hit (shield hit also counts)
    if (!this.player.invincible && this.player.sidewinderStacks > 0) {
      this.player.sidewinderStacks = 0;
      this.particles.emitText(this.player.pos.x, this.player.pos.y - 30, 'SIDEWINDER LOST', '#ff8a65');
    }

    this.waveDamageTaken = true;
    this.screenShake = 6;
    this.particles.emit(this.player.pos.x, this.player.pos.y, '#ff4444', 20, 150, 0.4);

    const dead = this.player.hit();
    if (dead) {
      this.state = 'gameover';
    }
  }

  private onPowerUpCollected(pu: PowerUp): void {
    this.particles.emitSpark(pu.pos.x, pu.pos.y, pu.color, 10);
    this.particles.emitText(pu.pos.x, pu.pos.y - 15, pu.icon, pu.color);

    switch (pu.type) {
      case 'shakeUp':
        // Screen clear
        for (const ep of this.enemyProjectiles) ep.alive = false;
        for (const enemy of this.waves.enemies) {
          if (enemy.alive) {
            enemy.hit(1);
            this.particles.emit(enemy.pos.x, enemy.pos.y, '#00e5ff', 6);
          }
        }
        this.screenShake = 10;
        break;
      case 'freshCap':
        this.player.shieldActive = true;
        this.player.shieldTimer = POWERUP_SHIELD_DURATION;
        break;
      case 'doubleCarb':
        this.player.doubleCarb = true;
        this.player.doubleCarbTimer = POWERUP_DOUBLE_CARB_DURATION;
        break;
      case 'flavorMix':
        // TODO: implement dual weapon in a later milestone
        this.player.doubleCarb = true;
        this.player.doubleCarbTimer = POWERUP_DOUBLE_CARB_DURATION;
        break;
      case 'extraLife':
        this.player.lives = Math.min(this.player.lives + 1, 5);
        break;
      case 'sidewinderBottle':
        this.player.sidewinderStacks += 1;
        this.particles.emitText(this.player.pos.x, this.player.pos.y - 36, `SIDEWINDER x${1 + this.player.sidewinderStacks * 2}`, '#ffab40');
        this.particles.emit(this.player.pos.x, this.player.pos.y, '#ffab40', 18, 140, 0.45);
        break;
    }
  }

  private nextWave(): void {
    // Wave bonus
    const waveBonus = WAVE_CLEAR_BONUS_MULTIPLIER * (this.wave + 1);
    this.score += waveBonus;
    this.particles.emitText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `WAVE ${this.wave + 1} CLEAR! +${waveBonus}`, '#00e5ff');

    if (!this.waveDamageTaken) {
      this.score += NO_DAMAGE_BONUS;
      this.particles.emitText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30, `NO DAMAGE +${NO_DAMAGE_BONUS}`, '#66bb6a');
    }

    this.wave++;
    this.waveDamageTaken = false;
    this.enemyProjectiles = [];

    // Small delay before next wave (handled visually by particles)
    this.waves.spawnWave(this.wave);
  }

  draw(): void {
    const ctx = this.renderer.ctx;

    // Screen shake offset
    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate(
        randomRange(-this.screenShake, this.screenShake),
        randomRange(-this.screenShake, this.screenShake)
      );
    }

    this.renderer.clear();
    this.renderer.updateBackground(1 / 60);

    if (this.state === 'playing' || this.state === 'paused') {
      // Draw enemies
      for (const e of this.waves.enemies) {
        if (e.alive) e.draw(ctx);
      }

      // Draw projectiles
      for (const p of this.playerProjectiles) p.draw(ctx);
      for (const p of this.enemyProjectiles) p.draw(ctx);

      // Draw power-ups
      for (const pu of this.powerups) pu.draw(ctx);

      // Draw player
      this.player.draw(ctx);

      // Draw particles
      this.particles.draw(ctx);

      // Combo display
      if (this.combo.active) {
        this.renderer.drawText(`COMBO ×${this.combo.multiplier}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, 24, '#ffeb3b');
      }

      // Pause overlay
      if (this.state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.renderer.drawText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 48, '#fff');
        this.renderer.drawText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40, 18, '#aaa');
      }
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.renderer.drawText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 56, '#ff4444');
      this.renderer.drawText(`Final Score: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20, 28, '#fff');
      this.renderer.drawText(`Wave: ${this.wave + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55, 20, '#aaa');
      this.renderer.drawText('Click to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100, 18, '#00e5ff');
    }

    ctx.restore();
  }

  private updateUI(): void {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;

    const carbFill = document.getElementById('carbonation-fill');
    if (carbFill) {
      carbFill.style.width = `${this.player?.carbonation ?? 0}%`;
      if (this.player?.isFlat) {
        carbFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
      } else {
        carbFill.style.background = 'linear-gradient(90deg, #00e5ff, #ff6f00)';
      }
    }

    const livesEl = document.getElementById('lives');
    if (livesEl && this.player) {
      livesEl.textContent = '🧢'.repeat(this.player.lives);
    }
  }

  handleMenuPause(): void {
    if (this.state === 'paused' && this.input.pause) {
      if (!this.pauseDebounce) {
        this.state = 'playing';
        this.pauseDebounce = true;
      }
    } else if (this.state === 'paused') {
      this.pauseDebounce = false;
    }
  }
}
