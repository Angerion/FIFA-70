# 2D Arcade Football Game Specification

## Overview
A top-down 2D arcade-style football (soccer) game built using React and HTML5 Canvas. The game emphasizes fluid movement, tactical AI positioning, and accessible arcade controls.

## Architecture
- **Component Entry**: `src/components/GameCanvas.tsx` houses the main game loop (`requestAnimationFrame`), input handling, physics updates, and coordinates rendering.
- **Entities & Types**: `src/components/game/types.ts` defines `PlayerEntity`, `Vec2` (custom math vector class), and underlying player stats.
- **Rendering System**: `src/components/game/renderers.ts` isolates all `CanvasRenderingContext2D` drawing logic (pitch, players, ball, UI).

## Core Mechanics
- **Controls**:
  - `WASD`: Move active player
  - `SHIFT`: Sprint (consumes stamina, increases speed by 30%)
  - `SPACE`: Shoot (when possessing ball) or Tackle (when defending)
  - `CTRL`: Pass (tap to pass to nearest, hold to charge distance)
  - `Q/E`: Adjust AI Tactics / Trigger Celebration
- **Stamina & Cooldowns**:
  - Sprinting drains stamina quickly.
  - Tackling and being tackled apply stun cooldowns (frames) to players.

## AI & Tactical Logic
- **Formations**: Teams spawn in a staggered `4-3-3` formation to avoid rigid lines.
- **Team Possession State**: The attacking shape is maintained not only when a player explicitly holds the ball, but also while the ball is traveling during a pass.
- **Attacking Movement**:
  - Wide players (wingers/fullbacks) actively move vertically toward the touchlines to create space.
  - Attackers push high up the pitch and generally avoid dropping back into their own defensive half.
  - Players possess individual "random seeds" to create organic, non-uniform pacing and jitter in their tracking.
- **AI Passing**:
  - Passing logic strongly prioritizes forward passes (high positive score) and heavily penalizes backwards passes (negative score).
  - A hidden `aiPassCooldown` of ~0.7 seconds (42 frames) triggers upon an AI player receiving the ball to prevent instant "ping-pong" tiki-taka chains.
- **AI Shooting**:
  - AI will dynamically evaluate shooting from up to 380 units away, increasing shot frequency as they get closer to the goal.
