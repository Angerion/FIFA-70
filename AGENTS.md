# Agent Instructions

- **Game Specification**: Always consult `SPEC.md` before making architectural or game logic changes. Ensure that new mechanics, AI tweaks, or rendering adjustments align with the established arcade physics, staggered formations, and state management defined in the specification.
- **Modularity**: Keep the game modular by adding pure logic and math helpers in `src/components/game/` rather than bloating the main React component (`GameCanvas.tsx`).
