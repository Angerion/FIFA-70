const fs = require('fs');
const content = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const startIndex = content.indexOf('// 5. Draw');
const endIndex = content.indexOf('animationFrameId = requestAnimationFrame(update);');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// 5. Draw
      Renderer.renderPitch(ctx, width, height);
      Renderer.renderReferee(ctx, ref, Math.atan2(ref.vel.y, ref.vel.x));

      // Players
      allPlayers.forEach(p => {
         Renderer.renderPlayer(ctx, p, p === activeHomePlayer);
      });

      Renderer.renderIndicators(ctx, passTarget, ballOwner, activeHomePlayer, mousePos.current);
      Renderer.renderBall(ctx, ball);
      Renderer.renderUI(ctx, activeHomePlayer, chargePower);

      `;
      
  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/components/GameCanvas.tsx', newContent);
  console.log('Replaced successfully');
} else {
  console.log('Not found');
}
