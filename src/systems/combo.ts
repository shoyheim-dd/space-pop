import { COMBO_WINDOW, COMBO_THRESHOLDS } from '../utils/constants';

export class ComboSystem {
  kills = 0;
  multiplier = 1;
  lastKillTime = 0;

  registerKill(now: number): number {
    if (now - this.lastKillTime > COMBO_WINDOW) {
      this.kills = 0;
    }
    this.kills++;
    this.lastKillTime = now;

    this.multiplier = 1;
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.kills >= COMBO_THRESHOLDS[i]) {
        this.multiplier = i + 2;
        break;
      }
    }

    return this.multiplier;
  }

  update(now: number): void {
    if (now - this.lastKillTime > COMBO_WINDOW) {
      this.kills = 0;
      this.multiplier = 1;
    }
  }

  get active(): boolean {
    return this.multiplier > 1;
  }
}
