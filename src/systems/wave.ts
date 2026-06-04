import { Enemy, EnemyType } from '../entities/enemy';
import { CANVAS_WIDTH } from '../utils/constants';
import { vec2 } from '../utils/math';

interface WaveDef {
  rows: { type: EnemyType; count: number }[];
  speed: number;
  isBoss?: boolean;
}

const WAVE_DEFS: WaveDef[] = [
  // Wave 1: Simple mentos
  { rows: [{ type: 'mentos', count: 8 }], speed: 40 },
  // Wave 2: Mentos + sugar cubes
  { rows: [{ type: 'mentos', count: 8 }, { type: 'sugarCube', count: 10 }], speed: 45 },
  // Wave 3: More mentos
  { rows: [{ type: 'mentos', count: 10 }, { type: 'mentos', count: 10 }], speed: 50 },
  // Wave 4: Sugar cube swarm
  { rows: [{ type: 'sugarCube', count: 12 }, { type: 'mentos', count: 8 }, { type: 'sugarCube', count: 12 }], speed: 55 },
  // Wave 5: Mid-boss (TODO: real boss)
  { rows: [{ type: 'cupLid', count: 6 }, { type: 'iceCube', count: 8 }], speed: 35, isBoss: false },
  // Wave 6: Straws + ice
  { rows: [{ type: 'straw', count: 10 }, { type: 'iceCube', count: 6 }], speed: 55 },
  // Wave 7: Mixed
  { rows: [{ type: 'cupLid', count: 5 }, { type: 'straw', count: 8 }, { type: 'mentos', count: 10 }], speed: 50 },
  // Wave 8: Heavy
  { rows: [{ type: 'iceCube', count: 8 }, { type: 'cupLid', count: 6 }, { type: 'straw', count: 10 }], speed: 45 },
  // Wave 9: All types
  { rows: [{ type: 'cupLid', count: 4 }, { type: 'iceCube', count: 6 }, { type: 'straw', count: 8 }, { type: 'mentos', count: 10 }], speed: 55 },
  // Wave 10: Mid-boss 2
  { rows: [{ type: 'cupLid', count: 8 }, { type: 'iceCube', count: 10 }], speed: 40, isBoss: false },
];

export class WaveSystem {
  currentWave = 0;
  enemies: Enemy[] = [];
  waveDirection = 1; // 1 = right, -1 = left
  waveSpeed = 40;
  waveComplete = false;
  private dropDistance = 20;
  private edgePadding = 30;

  spawnWave(waveIndex: number): void {
    this.currentWave = waveIndex;
    this.enemies = [];
    this.waveComplete = false;
    this.waveDirection = 1;

    const def = waveIndex < WAVE_DEFS.length
      ? WAVE_DEFS[waveIndex]
      : this.generateEndlessWave(waveIndex);

    this.waveSpeed = def.speed;

    let rowY = 50;
    for (const row of def.rows) {
      const spacing = (CANVAS_WIDTH - 2 * this.edgePadding) / (row.count + 1);
      for (let i = 0; i < row.count; i++) {
        const x = this.edgePadding + spacing * (i + 1);
        const enemy = new Enemy(row.type, vec2(x, rowY));
        enemy.gridX = i;
        enemy.gridY = this.enemies.length;
        this.enemies.push(enemy);
      }
      rowY += 40;
    }
  }

  private generateEndlessWave(waveIndex: number): WaveDef {
    const types: EnemyType[] = ['mentos', 'iceCube', 'straw', 'cupLid', 'sugarCube'];
    const rows: { type: EnemyType; count: number }[] = [];
    const numRows = Math.min(3 + Math.floor(waveIndex / 5), 6);
    for (let r = 0; r < numRows; r++) {
      rows.push({
        type: types[Math.floor(Math.random() * types.length)],
        count: 6 + Math.floor(Math.random() * 6),
      });
    }
    return { rows, speed: 40 + waveIndex * 3 };
  }

  update(dt: number): void {
    const liveEnemies = this.enemies.filter(e => e.alive);
    if (liveEnemies.length === 0) {
      this.waveComplete = true;
      return;
    }

    // Move formation
    let hitEdge = false;
    for (const e of liveEnemies) {
      e.vel.x = this.waveDirection * this.waveSpeed;
      e.update(dt);

      if (e.pos.x > CANVAS_WIDTH - this.edgePadding || e.pos.x < this.edgePadding) {
        hitEdge = true;
      }
    }

    if (hitEdge) {
      this.waveDirection *= -1;
      for (const e of liveEnemies) {
        e.pos.y += this.dropDistance;
      }
    }
  }

  getShootingEnemy(): Enemy | null {
    const alive = this.enemies.filter(e => e.alive);
    if (alive.length === 0) return null;

    for (const e of alive) {
      if (Math.random() < e.shootChance / 60) { // per frame at ~60fps
        return e;
      }
    }
    return null;
  }
}
