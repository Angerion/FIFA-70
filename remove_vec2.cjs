const fs = require('fs');
let content = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const classVec2 = `class Vec2 {
  constructor(public x: number, public y: number) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x*this.x + this.y*this.y); }
  norm() { const m = this.mag(); return m === 0 ? new Vec2(0,0) : new Vec2(this.x/m, this.y/m); }
}`;

content = content.replace(classVec2, "import { Vec2 } from '../lib/math';");
fs.writeFileSync('src/components/GameCanvas.tsx', content);
console.log('Vec2 removed');
