import { Vec2 } from '../../lib/math';
import { PlayerEntity } from './types'; // We will create this

export function renderPitch(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Background
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 0, width, height);

  // Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;

  // Center line
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
  ctx.stroke();

  // Penalty areas
  ctx.strokeRect(0, height / 2 - 100, 120, 200);
  ctx.strokeRect(width - 120, height / 2 - 100, 120, 200);
  // Goal areas
  ctx.strokeRect(0, height / 2 - 40, 40, 80);
  ctx.strokeRect(width - 40, height / 2 - 40, 40, 80);

  // Goal nets
  ctx.fillStyle = 'rgba(200,200,200,0.2)';
  ctx.fillRect(0, height / 2 - 60, 20, 120);
  ctx.fillRect(width - 20, height / 2 - 60, 20, 120);
}

export function renderReferee(ctx: CanvasRenderingContext2D, ref: { pos: Vec2; radius: number }, refAngle: number) {
  ctx.save();
  ctx.translate(ref.pos.x, ref.pos.y);
  ctx.rotate(refAngle);
  // Body
  ctx.fillStyle = '#000'; // Black shirt
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-ref.radius * 0.6, -ref.radius * 1.4, ref.radius * 1.4, ref.radius * 2.8, 6);
  else ctx.rect(-ref.radius * 0.6, -ref.radius * 1.4, ref.radius * 1.4, ref.radius * 2.8);
  ctx.fill();
  ctx.stroke();
  // Head
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(0, 0, ref.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function renderPlayer(ctx: CanvasRenderingContext2D, p: PlayerEntity, isActive: boolean, isBallOwner: boolean = false) {
  // Callout visual (Hey!)
  if (p.calloutTimer > 0) {
    ctx.beginPath();
    ctx.arc(p.pos.x + p.radius + 8, p.pos.y - p.radius - 8, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // Red bubble
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', p.pos.x + p.radius + 8, p.pos.y - p.radius - 7);
  }

  // Active indicator
  if (isActive) {
    const bounce = Math.sin(performance.now() / 150) * 4;

    // Outer highlight ring
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius * (isBallOwner ? 2.5 : 2), 0, Math.PI * 2);
    ctx.strokeStyle = isBallOwner ? 'rgba(250, 204, 21, 0.8)' : 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = isBallOwner ? 6 : 4;
    ctx.stroke();

    // Yellow Arrow
    ctx.beginPath();
    ctx.moveTo(p.pos.x, p.pos.y - p.radius - 12 + bounce);
    ctx.lineTo(p.pos.x - 8, p.pos.y - p.radius - 24 + bounce);
    ctx.lineTo(p.pos.x + 8, p.pos.y - p.radius - 24 + bounce);
    ctx.fillStyle = '#facc15'; // yellow arrow
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }

  // Top-Down Player Shape
  const angle = Math.atan2(p.facing.y, p.facing.x);
  ctx.save();
  ctx.translate(p.pos.x, p.pos.y);

  // Celebration logic override for drawing
  if (p.celebrationPhase > 0) {
    ctx.rotate(angle + p.celebrationPhase); // spin
  } else if (p.isJumping) {
    ctx.rotate(angle);
    ctx.scale(1.5, 0.8); // stretch out to look like a dive
  } else {
    ctx.rotate(angle);
  }

  const swing = Math.sin(p.distanceTraveled * 0.15) * p.radius * 0.8;

  // Feet (Boots)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-p.radius * 0.4 + swing, -p.radius * 0.8, p.radius * 0.35, 0, Math.PI * 2);
  ctx.arc(-p.radius * 0.4 - swing, p.radius * 0.8, p.radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Body (Shoulders)
  ctx.fillStyle = p.isGK ? '#1f2937' : p.colorPrimary; // Dark gray for GK
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-p.radius * 0.6, -p.radius * 1.4, p.radius * 1.4, p.radius * 2.8, 6);
  } else {
    ctx.rect(-p.radius * 0.6, -p.radius * 1.4, p.radius * 1.4, p.radius * 2.8);
  }
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  ctx.stroke();

  // Hands
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();

  let lHandX = p.radius * 0.2 - swing;
  let rHandX = p.radius * 0.2 + swing;
  let lHandY = -p.radius * 1.4;
  let rHandY = p.radius * 1.4;

  if (p.isGK && p.isJumping) {
    lHandX = p.radius * 1.2;
    rHandX = p.radius * 1.2;
    lHandY = -p.radius * 0.8;
    rHandY = p.radius * 0.8;
  }

  ctx.arc(lHandX, lHandY, p.radius * 0.4, 0, Math.PI * 2);
  ctx.arc(rHandX, rHandY, p.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

export function renderIndicators(ctx: CanvasRenderingContext2D, passTarget: PlayerEntity | null, ballOwner: PlayerEntity | null, activeHomePlayer: PlayerEntity, mousePos: Vec2) {
  // Pass Assist Target Indicator
  if (passTarget && ballOwner === activeHomePlayer && mousePos.x === 0 && mousePos.y === 0) {
    ctx.beginPath();
    ctx.arc(passTarget.pos.x, passTarget.pos.y - passTarget.radius - 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa'; // Blue dot for pass
    ctx.fill();
    ctx.stroke();
  }

  // Mouse Aim Indicator
  if (mousePos.x > 0 || mousePos.y > 0) {
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 10, mousePos.y);
    ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10);
    ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();
  }
}

export function renderBall(ctx: CanvasRenderingContext2D, ball: { pos: Vec2, radius: number, z: number }) {
  // Ball Shadow
  if (ball.z > 0) {
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  }

  // Ball
  const renderScale = 1 + (ball.z / 100);
  ctx.beginPath();
  ctx.arc(ball.pos.x, ball.pos.y - ball.z, ball.radius * renderScale, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

export function renderUI(ctx: CanvasRenderingContext2D, activeHomePlayer: PlayerEntity, chargePower: number) {
  // Power Bar
  if (chargePower > 0) {
    ctx.fillStyle = 'red';
    ctx.fillRect(activeHomePlayer.pos.x - 15, activeHomePlayer.pos.y - 15, 30 * (chargePower / 100), 4);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(activeHomePlayer.pos.x - 15, activeHomePlayer.pos.y - 15, 30, 4);
  }

  // Stamina Bar
  ctx.fillStyle = '#000';
  ctx.fillRect(18, 18, 104, 14);
  ctx.fillStyle = activeHomePlayer.stamina > 20 ? '#10b981' : '#ef4444';
  ctx.fillRect(20, 20, activeHomePlayer.stamina, 10);

  // Active Player Name
  ctx.fillStyle = 'white';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText(activeHomePlayer.data.name, 20, 45);
}
