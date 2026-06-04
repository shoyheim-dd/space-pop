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
  topScore = 0;
  bottleDronesEnabled = false;
  droneShootTimer = 0;
  cheatShieldUntilWave = -1;
  private lastTime = 0;
  private pauseDebounce = false;
  private kDebounce = false;
  private audioCtx?: AudioContext;
  private backgroundMusicId?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.waves = new WaveSystem();
    this.combo = new ComboSystem();
    this.particles = new ParticleSystem();
    this.loadTopScore();
  }

  private loadTopScore(): void {
    try {
      const stored = localStorage.getItem('space-pop-top-score');
      this.topScore = stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      this.topScore = 0;
    }
  }

  private saveTopScore(): void {
    try {
      localStorage.setItem('space-pop-top-score', String(this.topScore));
    } catch {
      // ignore storage failures
    }
  }

  private updateTopScore(): void {
    if (this.score > this.topScore) {
      this.topScore = this.score;
      this.saveTopScore();
    }
  }

  private ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playActionSound(): void {
    const ctx = this.ensureAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  private playShootSound(): void {
    const ctx = this.ensureAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  private playEnemyKillSound(): void {
    const ctx = this.ensureAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  private playPlayerHitSound(): void {
    const ctx = this.ensureAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  private playBackgroundNote(frequency: number, duration: number): void {
    const ctx = this.ensureAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private startBackgroundMusic(): void {
    if (this.backgroundMusicId != null) return;
    const theme = [
      { freq: 330, dur: 0.18 },
      { freq: 392, dur: 0.18 },
      { freq: 440, dur: 0.18 },
      { freq: 523, dur: 0.24 },
      { freq: 494, dur: 0.18 },
      { freq: 440, dur: 0.18 },
      { freq: 392, dur: 0.18 },
      { freq: 330, dur: 0.24 },
      { freq: 262, dur: 0.12 },
      { freq: 330, dur: 0.18 },
      { freq: 392, dur: 0.18 },
      { freq: 440, dur: 0.24 },
      { freq: 494, dur: 0.18 },
      { freq: 523, dur: 0.18 },
      { freq: 587, dur: 0.24 },
      { freq: 494, dur: 0.24 },
    ];
    let step = 0;

    const playNext = () => {
      if (this.backgroundMusicId == null) return;
      const note = theme[step % theme.length];
      this.playBackgroundNote(note.freq, note.dur);
      step += 1;
      this.backgroundMusicId = window.setTimeout(playNext, note.dur * 1000);
    };

    this.backgroundMusicId = window.setTimeout(playNext, 0);
  }

  private stopBackgroundMusic(): void {
    if (this.backgroundMusicId != null) {
      window.clearTimeout(this.backgroundMusicId);
      this.backgroundMusicId = undefined;
    }
  }

  start(): void {
    this.state = 'playing';
    this.score = 0;
    this.wave = 0;
    this.cheatShieldUntilWave = -1;
    this.bottleDronesEnabled = false;
    this.droneShootTimer = 0;
    this.kDebounce = false;
    this.player = new Player(this.selectedBottle);
    this.ensureAudioContext();
    this.playActionSound();
    this.startBackgroundMusic();
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.powerups = [];
    this.waveDamageTaken = false;
    this.waves.spawnWave(0, this.selectedBottle);
    this.updateUI();
  }

  update(dt: number): void {
    if (this.state !== 'playing') {
      this.stopBackgroundMusic();
      return;
    }

    this.startBackgroundMusic();

    // Cheat shield activation
    if (this.input.isDown('h') && this.cheatShieldUntilWave < 0) {
      this.cheatShieldUntilWave = 100;
      this.player.cheatShield = true;
    }
    if (this.cheatShieldUntilWave >= 0 && this.wave >= this.cheatShieldUntilWave) {
      this.cheatShieldUntilWave = -1;
      this.player.cheatShield = false;
    }

    // Bottle drone activation
    if (this.input.isDown('k')) {
      if (!this.kDebounce) {
        this.bottleDronesEnabled = true;
        this.kDebounce = true;
      }
    } else {
      this.kDebounce = false;
    }

    if (this.bottleDronesEnabled) {
      this.droneShootTimer -= dt;
      if (this.droneShootTimer <= 0) {
        this.droneShootTimer = 0.25;
        this.fireBottleDrones();
      }
    }

    // Pause handling
    if (this.input.pause) {
      if (!this.pauseDebounce) {
        this.state = 'paused';
        this.pauseDebounce = true;
        this.stopBackgroundMusic();
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
    this.playShootSound();
    const { x, y } = this.player.pos;
    const type = this.player.config.projectileType;

    const addProjectile = (proj: Projectile) => {
      this.playerProjectiles.push(proj);
      if (this.player.doubleCharacter) {
        const duplicate = new Projectile(vec2(proj.pos.x + 24, proj.pos.y), vec2(proj.vel.x, proj.vel.y), proj.type, true);
        if (proj.target) duplicate.target = proj.target;
        this.playerProjectiles.push(duplicate);
      }
    };

    switch (type) {
      case 'cap':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -400), 'cap', true));
        break;
      case 'fizz':
        // Spread shot
        addProjectile(new Projectile(vec2(x, y - 30), vec2(-60, -380), 'fizz', true));
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -400), 'fizz', true));
        addProjectile(new Projectile(vec2(x, y - 30), vec2(60, -380), 'fizz', true));
        break;
      case 'bubble': {
        const proj = new Projectile(vec2(x, y - 30), vec2(0, -300), 'bubble', true);
        // Find nearest enemy for homing
        const alive = this.waves.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const nearest = alive.reduce((a, b) => {
            const da = Math.abs(a.pos.x - x) + Math.abs(a.pos.y - y);
            const db = Math.abs(b.pos.x - x) + Math.abs(b.pos.y - y);
            return da < db ? a : b;
          });
          proj.target = nearest.pos;
        }
        addProjectile(proj);
        break;
      }
      case 'water':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -420), 'water', true));
        break;
      case 'foam':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -250), 'foam', true));
        break;
      case 'candy':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -420), 'candy', true));
        break;
      case 'chip':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -420), 'chip', true));
        break;
      case 'bensin':
        addProjectile(new Projectile(vec2(x, y - 30), vec2(0, -440), 'bensin', true));
        break;
    }
  }

  private fireSpecial(): void {
    this.player.specialCharge = 0;
    this.player.shieldActive = true;
    this.player.shieldTimer = POWERUP_SHIELD_DURATION;
    this.screenShake = 8;
    this.particles.emit(this.player.pos.x, this.player.pos.y, this.player.config.color, 40, 200, 1);

    // Shield effect on special
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
    this.playEnemyKillSound();

    // Power-up drop
    if (Math.random() < POWERUP_DROP_CHANCE) {
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.powerups.push(new PowerUp(type, vec2(enemy.pos.x, enemy.pos.y)));
    }
  }

  private onPlayerHit(): void {
    this.waveDamageTaken = true;
    this.screenShake = 6;
    this.particles.emit(this.player.pos.x, this.player.pos.y, '#ff4444', 20, 150, 0.4);

    const dead = this.player.hit();
    this.playPlayerHitSound();
    if (dead) {
      this.updateTopScore();
      this.state = 'gameover';
      this.stopBackgroundMusic();
    }
  }

  private onPowerUpCollected(pu: PowerUp): void {
    this.particles.emitSpark(pu.pos.x, pu.pos.y, pu.color, 10);
    this.particles.emitText(pu.pos.x, pu.pos.y - 15, pu.icon, pu.color);

    switch (pu.type) {
      case 'doubleCharacter':
        this.player.doubleCharacter = true;
        this.player.doubleCharacterTimer = POWERUP_DOUBLE_CARB_DURATION;
        break;
      case 'doubleAmmo':
        this.player.doubleCarb = true;
        this.player.doubleCarbTimer = POWERUP_DOUBLE_CARB_DURATION;
        break;
      case 'extraLife':
        this.player.lives = Math.min(this.player.lives + 1, 5);
        break;
    }
  }

  private fireBottleDrones(): void {
    const { x, y } = this.player.pos;
    const type = this.player.config.projectileType;
    const positions = [
      vec2(x - 34, y - 6),
      vec2(x + 34, y - 6),
    ];

    for (const pos of positions) {
      const proj = new Projectile(pos, vec2(0, -440), type, true);
      if (type === 'bubble') {
        const alive = this.waves.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const nearest = alive.reduce((a, b) => {
            const da = Math.abs(a.pos.x - x) + Math.abs(a.pos.y - y);
            const db = Math.abs(b.pos.x - x) + Math.abs(b.pos.y - y);
            return da < db ? a : b;
          });
          proj.target = nearest.pos;
        }
      }
      this.playerProjectiles.push(proj);
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
    this.waves.spawnWave(this.wave, this.selectedBottle);
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

      if (this.bottleDronesEnabled) {
        this.drawBottleDrones(ctx);
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
      this.renderer.drawText(`Top Score: ${this.topScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55, 24, '#ffd700');
      this.renderer.drawText(`Wave: ${this.wave + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85, 20, '#aaa');
      this.renderer.drawText('Click to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120, 18, '#00e5ff');
    }

    ctx.restore();
  }

  private drawBottleDrones(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.player.pos;
    const dronePositions = [
      { x: x - 40, y: y - 8 },
      { x: x + 40, y: y - 8 },
    ];

    for (const pos of dronePositions) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.fillStyle = '#fefefe';
      ctx.beginPath();
      ctx.roundRect(-6, -16, 12, 32, 6);
      ctx.fill();
      ctx.fillStyle = this.player.config.color;
      ctx.beginPath();
      ctx.roundRect(-5, -14, 10, 24, 5);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(-5, -18, 10, 4);
      ctx.restore();
    }
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
        this.startBackgroundMusic();
        this.pauseDebounce = true;
      }
    } else if (this.state === 'paused') {
      this.pauseDebounce = false;
    }
  }
}
