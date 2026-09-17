export class Vec2 {
  constructor(public x: number, public y: number) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x*this.x + this.y*this.y); }
  norm() { const m = this.mag(); return m === 0 ? new Vec2(0,0) : new Vec2(this.x/m, this.y/m); }
}
