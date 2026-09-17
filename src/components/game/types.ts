import { Vec2 } from '../../lib/math';
import { Player as PlayerData } from '../../types';

export class PlayerEntity {
  pos: Vec2;
  vel: Vec2 = new Vec2(0,0);
  moveVel: Vec2 = new Vec2(0,0);
  facing: Vec2 = new Vec2(1,0);
  radius: number = 7.22; // 5% smaller
  basePos: Vec2;
  cooldown: number = 0;
  stamina: number = 100;
  staminaDelay: number = 0;
  isGK: boolean;
  distanceTraveled: number = 0;
  celebrationPhase: number = 0;
  isScorer: boolean = false;
  hasRedCard: boolean = false;
  hasYellowCard: boolean = false;
  isJumping: boolean = false;
  jumpDistance: number = 0;
  calloutTimer: number = 0;
  randomSeed: number = Math.random() * 1000;

  constructor(
    public data: PlayerData,
    public team: 'home' | 'away',
    public colorPrimary: string,
    public colorSecondary: string,
    startX: number,
    startY: number,
    isGK: boolean
  ) {
    this.pos = new Vec2(startX, startY);
    this.basePos = new Vec2(startX, startY);
    this.isGK = isGK;
    this.facing = team === 'home' ? new Vec2(1,0) : new Vec2(-1,0);
  }
}
