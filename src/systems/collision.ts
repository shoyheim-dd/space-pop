import { Player } from '../entities/player';
import { Projectile } from '../entities/projectile';
import { Enemy } from '../entities/enemy';
import { PowerUp } from '../entities/powerup';
import { distance } from '../utils/math';

export function checkCollisions(
  player: Player,
  playerProjectiles: Projectile[],
  enemyProjectiles: Projectile[],
  enemies: Enemy[],
  powerups: PowerUp[],
  onEnemyKilled: (enemy: Enemy) => void,
  onPlayerHit: () => void,
  onPowerUpCollected: (powerup: PowerUp) => void,
): void {
  // Player projectiles vs enemies
  for (const proj of playerProjectiles) {
    if (!proj.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = proj.pos.x - enemy.pos.x;
      const dy = proj.pos.y - enemy.pos.y;
      if (Math.abs(dx) < enemy.width / 2 + proj.radius &&
          Math.abs(dy) < enemy.height / 2 + proj.radius) {
        proj.alive = false;
        if (enemy.hit(proj.damage)) {
          onEnemyKilled(enemy);
        }
        break;
      }
    }
  }

  // Enemy projectiles vs player
  for (const proj of enemyProjectiles) {
    if (!proj.alive) continue;
    const dx = proj.pos.x - player.pos.x;
    const dy = proj.pos.y - player.pos.y;
    if (Math.abs(dx) < player.width / 2 + proj.radius &&
        Math.abs(dy) < player.height / 2 + proj.radius) {
      proj.alive = false;
      onPlayerHit();
    }
  }

  // Player vs power-ups
  for (const pu of powerups) {
    if (!pu.alive) continue;
    const d = distance(player.pos, pu.pos);
    if (d < player.width / 2 + pu.radius) {
      pu.alive = false;
      onPowerUpCollected(pu);
    }
  }
}
