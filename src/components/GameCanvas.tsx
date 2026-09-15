import React, { useRef, useEffect, useState } from 'react';
import { TEAMS_1970 } from '../data/teams';
import { PLAYERS_1970 } from '../data/players';
import { Player as PlayerData } from '../types';
import { audio } from '../utils/audio';

interface GameCanvasProps {
  homeTeamId: string;
  awayTeamId: string;
  bannedPlayerIds?: string[];
  onQuit: () => void;
  onMatchEnd: (stats: any) => void;
}

class Vec2 {
  constructor(public x: number, public y: number) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm() { const m = this.mag(); return m === 0 ? new Vec2(0,0) : new Vec2(this.x/m, this.y/m); }
}

class PlayerEntity {
  pos: Vec2;
  vel: Vec2 = new Vec2(0,0);
  moveVel: Vec2 = new Vec2(0,0);
  facing: Vec2 = new Vec2(1,0);
  radius: number = 7.6;
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

export const GameCanvas: React.FC<GameCanvasProps> = ({ homeTeamId, awayTeamId, bannedPlayerIds, onQuit, onMatchEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRetroMode, setIsRetroMode] = useState(false);
  const [matchTactic, setMatchTactic] = useState<'neutral' | 'aggressive' | 'defensive'>('neutral');
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });
  const [matchPhaseStatus, setMatchPhaseStatus] = useState<'Intro1st' | '1st' | 'Intro2nd' | '2nd' | 'HT' | 'FT' | 'Goal' | 'Paused' | 'FoulScene' | 'YellowCard' | 'RedCard'>('Intro1st');
  const timerRef = useRef<HTMLSpanElement>(null);
  const mousePos = useRef<Vec2>(new Vec2(0,0));
  const isPausedRef = useRef(false);
  
  // Expose current tactics via ref so loop can read it immediately
  const tacticsRef = useRef(matchTactic);
  useEffect(() => { tacticsRef.current = matchTactic; }, [matchTactic]);

  useEffect(() => {
    const handleInteraction = () => audio.init();
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);
    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      audio.stopCrowd();
    };
  }, []);

  useEffect(() => {
     if (matchPhaseStatus === '1st' || matchPhaseStatus === '2nd') {
        audio.playWhistle();
     } else if (matchPhaseStatus === 'HT' || matchPhaseStatus === 'FT') {
        audio.playWhistle();
        setTimeout(() => audio.playWhistle(), 600); // double whistle
     } else if (matchPhaseStatus === 'YellowCard' || matchPhaseStatus === 'RedCard') {
        audio.playWhistle();
     }
  }, [matchPhaseStatus]);

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      const k = e.key.toLowerCase();
      keys.current[k] = true; 
      if (k === 'q') setMatchTactic('aggressive');
      if (k === 'e') setMatchTactic('defensive');
      if (k === 'p' || k === 'escape') {
         isPausedRef.current = !isPausedRef.current;
         setMatchPhaseStatus(isPausedRef.current ? 'Paused' : '1st'); // Will fix actual phase text later
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cw = 800;
      const ch = 500;
      const scale = Math.min(rect.width / cw, rect.height / ch);
      const offsetX = (rect.width - cw * scale) / 2;
      const offsetY = (rect.height - ch * scale) / 2;

      mousePos.current.x = (e.clientX - rect.left - offsetX) / scale;
      mousePos.current.y = (e.clientY - rect.top - offsetY) / scale;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) keys.current['lmb'] = true;
      if (e.button === 2) keys.current['rmb'] = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) keys.current['lmb'] = false;
      if (e.button === 2) keys.current['rmb'] = false;
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = 800;
    const height = 500;

    // Load Teams
    const homeTeamColor = TEAMS_1970.find(t => t.id === homeTeamId)?.colorPrimary || '#fff';
    const homeTeamSec = TEAMS_1970.find(t => t.id === homeTeamId)?.colorSecondary || '#000';
    const awayTeamColor = TEAMS_1970.find(t => t.id === awayTeamId)?.colorPrimary || '#000';
    const awayTeamSec = TEAMS_1970.find(t => t.id === awayTeamId)?.colorSecondary || '#fff';

    const getSquad = (tid: string) => PLAYERS_1970
      .filter(p => p.country === tid && !(bannedPlayerIds && bannedPlayerIds.includes(p.id)))
      .sort((a,b) => b.price - a.price)
      .slice(0, 11);
    const hSquad = getSquad(homeTeamId);
    const aSquad = getSquad(awayTeamId);

    const getFormation = (team: 'home'|'away') => {
      const dir = team === 'home' ? 1 : -1;
      const bx = team === 'home' ? 0 : width;
      return [
        { x: bx + dir * 40, y: height/2, isGK: true },
        { x: bx + dir * 120, y: 100, isGK: false }, { x: bx + dir * 120, y: 200, isGK: false },
        { x: bx + dir * 120, y: 300, isGK: false }, { x: bx + dir * 120, y: 400, isGK: false },
        { x: bx + dir * 220, y: 150, isGK: false }, { x: bx + dir * 220, y: 250, isGK: false }, { x: bx + dir * 220, y: 350, isGK: false },
        { x: bx + dir * 320, y: 150, isGK: false }, { x: bx + dir * 320, y: 250, isGK: false }, { x: bx + dir * 320, y: 350, isGK: false },
      ];
    };

    const hForm = getFormation('home');
    const aForm = getFormation('away');

    const allPlayers: PlayerEntity[] = [
      ...hSquad.map((p, i) => new PlayerEntity(p, 'home', homeTeamColor, homeTeamSec, hForm[i].x, hForm[i].y, hForm[i].isGK)),
      ...aSquad.map((p, i) => new PlayerEntity(p, 'away', awayTeamColor, awayTeamSec, aForm[i].x, aForm[i].y, aForm[i].isGK))
    ];

    const ball = { pos: new Vec2(width/2, height/2), vel: new Vec2(0,0), radius: 5, z: 0, vz: 0 };
    let ballOwner: PlayerEntity | null = null;
    let activeHomePlayer = allPlayers[0];
    let chargePower = 0;
    let passCharge = 0;
    let passTarget: PlayerEntity | null = null;
    let score = { home: 0, away: 0 };
    let lastBallOwner: PlayerEntity | null = null;

    // Referee
    const ref = { pos: new Vec2(width/2, height/2 - 50), vel: new Vec2(0,0), radius: 7.6 };

    let lastTime = performance.now();
    let gameClockMs = 0;
    const TIME_SCALE = 7.5; // 12 real mins = 90 game mins
    let matchPhase = 'Intro1st';
    let kickoffTeam: 'home' | 'away' = Math.random() > 0.5 ? 'home' : 'away';

    const resetPlay = (kickoff?: 'home' | 'away') => {
      ball.pos = new Vec2(width/2, height/2);
      ball.vel = new Vec2(0,0);
      ball.z = 0;
      ball.vz = 0;
      ballOwner = null;
      chargePower = 0;
      passCharge = 0;
      passTarget = null;
      allPlayers.forEach(p => {
        if (p.hasRedCard) return; // keep red carded player off
        p.pos = new Vec2(p.basePos.x, p.basePos.y);
        p.vel = new Vec2(0,0);
        p.moveVel = new Vec2(0,0);
        p.cooldown = 0;
        p.celebrationPhase = 0;
        p.isScorer = false;
      });
      ref.pos = new Vec2(width/2, height/2 - 50);

      if (kickoff) {
         const centerPlayer = allPlayers.find(p => p.team === kickoff && p.basePos.sub(new Vec2(width/2, height/2)).mag() < 100);
         if (centerPlayer) {
            ballOwner = centerPlayer;
            ball.pos = centerPlayer.pos.add(new Vec2(kickoff === 'home' ? 5 : -5, 0));
            lastBallOwner = centerPlayer;
         }
      }
    };
    
    const handleUnstuck = () => {
       resetPlay(kickoffTeam);
       isPausedRef.current = false;
       setMatchPhaseStatus(matchPhase as any);
    };
    window.addEventListener('unstuck', handleUnstuck);
    
    // Initial setup
    resetPlay(kickoffTeam);
    setTimeout(() => {
       matchPhase = '1st';
       setMatchPhaseStatus('1st');
       lastTime = performance.now();
    }, 2000);

    const getBestPlayer = (team: 'home'|'away') => {
      if (ballOwner && ballOwner.team === team) return ballOwner;
      let best = allPlayers.find(p => p.team === team)!;
      let minDist = Infinity;
      allPlayers.forEach(p => {
        if (p.team === team && !p.isGK) { // Prefer not to control GK manually unless necessary
          const d = p.pos.sub(ball.pos).mag();
          if (d < minDist) { minDist = d; best = p; }
        }
      });
      return best;
    };

    const update = () => {
      const isGameplayPhase = matchPhase === '1st' || matchPhase === '2nd' || matchPhase === 'Goal';
      
      if (!isPausedRef.current && isGameplayPhase) {
        // 1. Determine Active Home Player
      if (ballOwner && ballOwner.team === 'home') {
        activeHomePlayer = ballOwner;
      } else if (!ballOwner || ballOwner.team === 'away') {
        activeHomePlayer = getBestPlayer('home');
      }

      // 1.5 Determine Pass Target
      passTarget = null;
      if (ballOwner && ballOwner === activeHomePlayer) {
        let bestScore = -Infinity;
        allPlayers.forEach(p => {
          if (p.team === 'home' && p !== activeHomePlayer) {
            const dir = p.pos.sub(ballOwner!.pos);
            const dist = dir.mag();
            if (dist > 20 && dist < 300) { 
              const dirNorm = dir.norm();
              const dot = dirNorm.x * ballOwner!.facing.x + dirNorm.y * ballOwner!.facing.y;
              if (dot > 0.5) { // Roughly within 60 degrees
                 const angle = Math.acos(dot);
                 const score = -angle * 50 - dist * 0.1;
                 if (score > bestScore) {
                   bestScore = score;
                   passTarget = p;
                 }
              }
            }
          }
        });
      }

      // 2. Loose Ball Collisions (Possession)
      if (!ballOwner && ball.z < 15) {
        let snapped = false;
        
        // Human player "magnetic snap" if close and uncontested
        if (activeHomePlayer && activeHomePlayer.cooldown <= 0 && !activeHomePlayer.isJumping) {
           const distToBall = activeHomePlayer.pos.sub(ball.pos).mag();
           const snapRadius = activeHomePlayer.radius + ball.radius + 20; // 20px extra reach
           if (distToBall < snapRadius) {
              const isContested = allPlayers.some(p => p.team === 'away' && p.pos.sub(ball.pos).mag() < 50);
              if (!isContested) {
                 ballOwner = activeHomePlayer;
                 lastBallOwner = activeHomePlayer;
                 ball.vel = new Vec2(0,0);
                 audio.playBounce();
                 snapped = true;
              }
           }
        }

        if (!snapped) {
          for (let p of allPlayers) {
            if ((p.cooldown <= 0 || p.isJumping) && p.pos.sub(ball.pos).mag() < p.radius + ball.radius) {
              if (p.isJumping) {
                 if (p.jumpDistance > 30) {
                    // Deflect
                    ball.vel = ball.vel.mul(-0.5).add(p.vel.mul(0.5));
                    ball.z += 2;
                    audio.playBounce();
                    p.isJumping = false;
                    break;
                 } else {
                    // Catch
                    p.isJumping = false;
                    ballOwner = p;
                    lastBallOwner = p;
                    ball.vel = new Vec2(0,0);
                    audio.playBounce();
                    break;
                 }
              } else {
                 ballOwner = p;
                 lastBallOwner = p;
                 ball.vel = new Vec2(0,0);
                 audio.playBounce();
                 break;
              }
            }
          }
        }
      }

      // 3. Player Movement & AI
      const activeAwayPlayer = getBestPlayer('away');

      allPlayers.forEach(p => {
        if (p.cooldown > 0) p.cooldown--;
        
        let targetVel = new Vec2(0,0);
        const speedStat = Math.max(30, p.data.stats.speed);
        // Reduce global speed by 15% (previously * 1.15, now * 0.85)
        let maxSpeed = (speedStat / 80) * 0.85; 

        // Stamina Recovery/Drain logic
        if (p === activeHomePlayer && keys.current['shift'] && p.stamina > 0 && p.cooldown <= 0) {
          maxSpeed *= 1.3;
          p.stamina = Math.max(0, p.stamina - 0.33); // 3x duration
          p.staminaDelay = 30; // half a second at 60fps before replenishing
        } else {
          if (p.staminaDelay > 0) {
             p.staminaDelay--;
          } else {
             p.stamina = Math.min(100, p.stamina + 0.3);
          }
        }

        if (p.cooldown <= 0) {
          if (p === activeHomePlayer) {
            // Human Control Movement
            if (keys.current['w']) targetVel.y -= 1;
            if (keys.current['s']) targetVel.y += 1;
            if (keys.current['a']) targetVel.x -= 1;
            if (keys.current['d']) targetVel.x += 1;

            if (targetVel.mag() > 0) {
              const targetDir = targetVel.norm();
              if (ballOwner === p) {
                 // Turning inertia when holding ball
                 p.facing = p.facing.mul(0.85).add(targetDir.mul(0.15)).norm();
                 targetVel = p.facing.mul(maxSpeed * 0.9); // slightly slower when dribbling
              } else {
                 p.facing = targetDir;
                 targetVel = targetDir.mul(maxSpeed);
              }
            }

            // Shooting / Passing / Tackling
            if (ballOwner === p) {
              if (keys.current[' '] || keys.current['rmb']) {
                chargePower = Math.min(100, chargePower + 3);
              } else if (chargePower > 0) {
                // Release shot
                ballOwner = null;
                audio.playKick();
                const powerMod = (p.data.stats.shooting / 50);
                
                // OP Aimbot: Find cleanest path
                const targetGoalX = p.team === 'home' ? width : 0;
                let baseDir = new Vec2(targetGoalX, height/2).sub(p.pos).norm();
                
                // Override with mouse aim if using RMB
                if (mousePos.current.x > 0 || mousePos.current.y > 0) {
                   baseDir = mousePos.current.sub(p.pos).norm();
                }

                let bestAim = baseDir;
                let bestClearance = -Infinity;
                
                // Test 5 angles
                for (let angleOffset of [-0.2, -0.1, 0, 0.1, 0.2]) {
                   const cosA = Math.cos(angleOffset);
                   const sinA = Math.sin(angleOffset);
                   const testDir = new Vec2(baseDir.x * cosA - baseDir.y * sinA, baseDir.x * sinA + baseDir.y * cosA);
                   
                   // find closest enemy to this ray
                   let minEnemyDist = Infinity;
                   allPlayers.forEach(ep => {
                     if (ep.team !== p.team) {
                        const toEnemy = ep.pos.sub(p.pos);
                        const dot = toEnemy.x * testDir.x + toEnemy.y * testDir.y;
                        if (dot > 0 && dot < 250) { // enemy in front
                           const proj = testDir.mul(dot);
                           const distToRay = toEnemy.sub(proj).mag();
                           if (distToRay < minEnemyDist) minEnemyDist = distToRay;
                        }
                     }
                   });
                   
                   if (minEnemyDist > bestClearance) {
                      bestClearance = minEnemyDist;
                      bestAim = testDir;
                   }
                }
                
                // Blend 40% facing direction, 60% aimbot
                const aimDir = p.facing.mul(0.4).add(bestAim.mul(0.6)).norm();
                
                ball.vel = aimDir.mul((chargePower * 0.1) * powerMod);
                if (chargePower > 85) {
                   ball.vz = 8; // High shot
                }
                p.cooldown = 20; 
                chargePower = 0;
              }

              if (keys.current['f'] || keys.current['lmb']) {
                passCharge = Math.min(100, passCharge + 3);
              } else if (passCharge > 0) {
                // Release pass
                ballOwner = null;
                audio.playKick();
                
                let passDir = p.facing;
                if (mousePos.current.x > 0 || mousePos.current.y > 0) {
                   passDir = mousePos.current.sub(p.pos).norm();
                } else if (passTarget) {
                   passDir = passTarget.pos.sub(p.pos).norm();
                }
                
                ball.vel = passDir.mul(6);
                if (passCharge > 45) { // 0.75s hold approx
                   ball.vz = 6; // Lob pass
                   ball.vel = passDir.mul(5); 
                }
                
                p.cooldown = 15;
                passCharge = 0;
              }
            } else {
              if (keys.current[' '] || keys.current['rmb']) {
                chargePower = Math.min(100, chargePower + 3);
              } else if (chargePower > 0) {
                // Release tackle
                if (ballOwner && ballOwner.team === 'away' && p.pos.sub(ballOwner.pos).mag() < p.radius * 3.5) {
                   const isFoul = Math.random() < (chargePower > 80 ? 0.6 : 0.05);
                   if (isFoul) {
                      const isRed = chargePower > 95 && Math.random() < 0.3;
                      if (isRed) {
                         p.hasRedCard = true;
                         p.pos = new Vec2(-1000, -1000);
                         setMatchPhaseStatus('RedCard');
                      } else {
                         p.hasYellowCard = true;
                         setMatchPhaseStatus('YellowCard');
                      }
                      
                      // Injure opponent briefly
                      const fouledPlayer = ballOwner;
                      fouledPlayer.cooldown = 150; 
                      
                      // Referee moves to foul
                      ref.pos = new Vec2(p.pos.x, p.pos.y - 30);

                      let prevPhase = matchPhase;
                      matchPhase = 'FoulScene';
                      setTimeout(() => {
                         matchPhase = prevPhase;
                         setMatchPhaseStatus(prevPhase as any);
                      }, 3000);
                   } else if (Math.random() < (p.data.stats.tackling / 150) + (chargePower/200)) {
                      ballOwner.cooldown = 90; 
                      ballOwner.vel = ballOwner.pos.sub(p.pos).norm().mul(4 + chargePower/25); 
                      ballOwner = p;
                      lastBallOwner = p;
                      p.cooldown = 10;
                   }
                }
                
                // Add slide velocity
                p.vel = p.facing.mul(2 + chargePower/20);
                p.cooldown = 30; // Slide tackle recovery
                chargePower = 0;
              }
            }
          } else {
            // AI Control
            let dest = new Vec2(p.basePos.x, p.basePos.y);

            let aiMaxSpeed = maxSpeed;
            if (p.isGK) aiMaxSpeed *= 0.5; // Goalkeepers move much slower when positioning

            if (p.isGK) {
              const isHome = p.team === 'home';
              const goalX = isHome ? 40 : width - 40;
              const penaltyBoxX = isHome ? 120 : width - 120;
              const ballInBox = isHome ? ball.pos.x < penaltyBoxX : ball.pos.x > penaltyBoxX;
              
              if (ballInBox) {
                 const targetX = Math.max(isHome ? 40 : width - 120, Math.min(isHome ? 120 : width - 40, ball.pos.x));
                 const targetY = Math.max(height/2 - 70, Math.min(height/2 + 70, ball.pos.y));
                 dest = new Vec2(targetX, targetY);
              } else {
                 const targetY = Math.max(height/2 - 50, Math.min(height/2 + 50, ball.pos.y));
                 dest = new Vec2(goalX, targetY);
              }
              // GK always faces the ball
              p.facing = ball.pos.sub(p.pos).norm();

              // Jump (Dive) Logic
              if (!p.isJumping && p.cooldown <= 0 && ball.vel.mag() > 3) {
                 const toBall = ball.pos.sub(p.pos);
                 if (toBall.mag() > 15 && toBall.mag() < 120) {
                    const movingToGoal = p.team === 'home' ? ball.vel.x < 0 : ball.vel.x > 0;
                    if (movingToGoal) {
                       p.isJumping = true;
                       p.jumpDistance = 0;
                       p.cooldown = 45; // time to get up
                       p.vel = toBall.norm().mul(12); // explosive dive
                       audio.playKick(); // dive swoosh
                    }
                 }
              }
            } else if (p === activeAwayPlayer && (!ballOwner || ballOwner.team === 'home')) {
              // Chase ball or tackle
              dest = ballOwner ? ballOwner.pos : ball.pos;
              if (ballOwner && p.pos.sub(ballOwner.pos).mag() < p.radius * 2.5) {
                 if (Math.random() < (p.data.stats.tackling / 1000)) {
                   ballOwner.cooldown = 90; // Stun the human for 1.5s
                   ballOwner.vel = ballOwner.pos.sub(p.pos).norm().mul(4); // Knockback
                   ballOwner = p;
                   p.cooldown = 10;
                 }
              }
            } else if (ballOwner === p) {
              // AI has ball, drive to goal
              dest = new Vec2(p.team === 'home' ? width : 0, height/2);
              // AI Shoot logic
              const distToGoal = Math.abs(p.pos.x - (p.team === 'home' ? width : 0));
              if (distToGoal < 200 && Math.random() < 0.05) {
                 ballOwner = null;
                 audio.playKick();
                 const targetGoal = new Vec2(p.team === 'home' ? width : 0, height/2 + (Math.random()*40-20));
                 ball.vel = targetGoal.sub(p.pos).norm().mul(12 * (p.data.stats.shooting/60));
                 p.cooldown = 20;
              }
            } else {
              // Base tactical position
              let tacticShift = 0;
              if (p.team === 'home') {
                if (tacticsRef.current === 'aggressive') tacticShift = 60;
                if (tacticsRef.current === 'defensive') tacticShift = -60;
              }
              const shiftX = (ball.pos.x - width/2) * 0.3 + tacticShift;
              let baseDest = new Vec2(p.basePos.x + shiftX, p.basePos.y);

              // Smart Positioning (Marking vs Finding Space)
              const teamHasBall = ballOwner && ballOwner.team === p.team;
              let smartOffset = new Vec2(0, 0);

              let nearestOpp = null;
              let minBaseDist = Infinity;
              for (let opp of allPlayers) {
                 if (opp.team !== p.team) {
                    const d = opp.pos.sub(baseDest).mag();
                    if (d < minBaseDist) {
                       minBaseDist = d;
                       nearestOpp = opp;
                    }
                 }
              }

              if (nearestOpp) {
                 const toOpp = nearestOpp.pos.sub(baseDest);
                 if (teamHasBall) {
                    // Find open space (move away from nearest opponent)
                    if (minBaseDist < 80 && minBaseDist > 0) {
                       smartOffset = toOpp.norm().mul(-50); 
                    } else {
                       // Push forward slightly when attacking
                       smartOffset = new Vec2(p.team === 'home' ? 30 : -30, 0);
                    }
                 } else {
                    // Mark opponent (move towards nearest opponent in zone)
                    if (minBaseDist < 120) {
                       smartOffset = toOpp.mul(0.7);
                    }
                 }
              }
              
              const timeSec = performance.now() / 1000;
              const jitterX = Math.sin(timeSec * 2 + p.data.id) * 15;
              const jitterY = Math.cos(timeSec * 1.5 + p.data.id) * 15;
              dest = new Vec2(baseDest.x + smartOffset.x + jitterX, baseDest.y + smartOffset.y + jitterY);
            }

            const dir = dest.sub(p.pos);
            if (dir.mag() > 5) {
              const targetDir = dir.norm();
              if (ballOwner === p) {
                 p.facing = p.facing.mul(0.85).add(targetDir.mul(0.15)).norm();
                 targetVel = p.facing.mul(aiMaxSpeed * 0.9);
              } else {
                 p.facing = targetDir;
                 targetVel = targetDir.mul(aiMaxSpeed * (p === activeAwayPlayer ? 0.75 : 0.5));
              }
            }
          }
        } // end if cooldown <= 0

        if (matchPhase === 'Goal' && p.team === (ball.pos.x > width/2 ? 'home' : 'away')) {
           let isCelebrating = false;
           if (p === lastBallOwner) isCelebrating = true;
           else if (lastBallOwner && p.pos.sub(lastBallOwner.pos).mag() < 50) isCelebrating = true;
           else if (Math.random() < 0.01) isCelebrating = true; // 1% unison

           if (isCelebrating) {
              p.celebrationPhase += 0.15;
              if (p.team === 'away' || keys.current['e']) {
                 p.pos.y += Math.sin(p.celebrationPhase)*2;
              }
              targetVel = new Vec2(0,0);
              p.distanceTraveled += 0.5; // Jog while celebrating
           } else if (lastBallOwner) {
              targetVel = lastBallOwner.pos.sub(p.pos).norm().mul(maxSpeed * 0.8);
              p.facing = targetVel.norm();
              p.distanceTraveled += targetVel.mag();
           }
        } else {
           // If stationary, add a small amount so they jog in place
           const moveAmt = targetVel.mag();
           if (moveAmt < 0.1 && p.cooldown <= 0) {
              p.distanceTraveled += 0.5; // Jog in place
           } else {
              p.distanceTraveled += moveAmt;
           }
        }

        p.pos = p.pos.add(targetVel).add(p.vel);
        p.vel = p.vel.mul(0.85); // Damping for knockback velocity
        
        if (p.isJumping) {
           p.jumpDistance += p.vel.mag();
           if (p.vel.mag() < 1.5) p.isJumping = false;
        }

        // Pitch bounds
        p.pos.x = Math.max(p.radius, Math.min(width - p.radius, p.pos.x));
        p.pos.y = Math.max(p.radius, Math.min(height - p.radius, p.pos.y));
      });

      // 3.5 Referee Logic
      if (matchPhase !== 'FoulScene') {
         const refTarget = ball.pos.add(new Vec2(0, -60));
         const refDir = refTarget.sub(ref.pos);
         if (refDir.mag() > 10) {
            ref.vel = refDir.norm().mul(1.5);
         } else {
            ref.vel = ref.vel.mul(0.8);
         }
      } else {
         ref.vel = new Vec2(0,0);
      }
      ref.pos = ref.pos.add(ref.vel);

      // 4. Ball Physics
      if (ballOwner) {
        ball.pos = ballOwner.pos.add(ballOwner.facing.mul(ballOwner.radius + ball.radius + 2));
        ball.vel = new Vec2(0,0);
        ball.z = 0;
        ball.vz = 0;
      } else {
        ball.pos = ball.pos.add(ball.vel);
        ball.vel = ball.vel.mul(0.97); // friction
        
        ball.z += ball.vz;
        if (ball.z > 0) {
           ball.vz -= 0.5; // gravity
        } else {
           ball.z = 0;
           ball.vz = 0;
        }

        // Wall collisions
        if (ball.pos.y <= ball.radius || ball.pos.y >= height - ball.radius) {
           ball.vel.y *= -1;
           if (Math.abs(ball.vel.y) > 1) audio.playBounce();
        }
        
        if (ball.pos.x <= ball.radius || ball.pos.x >= width - ball.radius) {
          // Goal detection (Goal y: height/2 - 60 to height/2 + 60)
          if (ball.pos.y > height/2 - 60 && ball.pos.y < height/2 + 60) {
             if (matchPhase !== 'Goal') {
               const scoringTeam = ball.pos.x <= ball.radius ? 'away' : 'home';
               if (scoringTeam === 'away') { score.away++; }
               else { score.home++; }
               let previousPhase = matchPhase;
               matchPhase = 'Goal';
               audio.playCheer();
               setMatchScore({ ...score });
               setMatchPhaseStatus('Goal');
               setTimeout(() => {
                 const newKickoffTeam = scoringTeam === 'away' ? 'home' : 'away';
                 resetPlay(newKickoffTeam);
                 
                 if (gameClockMs >= 90 * 60000) {
                    matchPhase = 'FT';
                 } else if (gameClockMs >= 45 * 60000 && previousPhase === '1st') {
                    matchPhase = 'HT';
                 } else {
                    matchPhase = gameClockMs >= 45 * 60000 ? '2nd' : '1st';
                 }
                 setMatchPhaseStatus(matchPhase as any);
                 lastTime = performance.now();
               }, 3000);
             }
          } else {
            ball.vel.x *= -1; // Bounce off back wall
            if (Math.abs(ball.pos.y - (height/2 - 60)) < 15 || Math.abs(ball.pos.y - (height/2 + 60)) < 15) {
               audio.playPostHit();
            } else if (Math.abs(ball.vel.x) > 5) {
               audio.playMiss();
            } else if (Math.abs(ball.vel.x) > 1) {
               audio.playBounce();
            }
          }
        }
      } // Close ballOwner else block
      } // Close isGameplayPhase block

      // Time Management
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      if (!isPausedRef.current && (matchPhase === '1st' || matchPhase === '2nd')) {
        gameClockMs += dt * TIME_SCALE;
        
        const gameMinutes = Math.floor(gameClockMs / 60000);
        
        if (matchPhase === '1st' && gameMinutes >= 45) {
           gameClockMs = 45 * 60000;
           matchPhase = 'HT';
           setMatchPhaseStatus('HT');
           setTimeout(() => {
             matchPhase = 'Intro2nd';
             setMatchPhaseStatus('Intro2nd');
             // Switch kickoff team
             kickoffTeam = kickoffTeam === 'home' ? 'away' : 'home';
             resetPlay(kickoffTeam);
             setTimeout(() => {
                matchPhase = '2nd';
                setMatchPhaseStatus('2nd');
                lastTime = performance.now();
             }, 2000);
           }, 3000);
        } else if (matchPhase === '2nd' && gameMinutes >= 90) {
           gameClockMs = 90 * 60000;
           matchPhase = 'FT';
           setMatchPhaseStatus('FT');
           setTimeout(() => {
             const result = score.home > score.away ? 'win' : (score.home < score.away ? 'loss' : 'draw');
             const reds = allPlayers.filter(p => p.team === 'home' && p.hasRedCard).map(p => p.data.id);
             onMatchEnd({ result, goals: score.home, reds });
           }, 3000);
        }
      }
      
      // Update Timer UI
      if (timerRef.current) {
         const displayMins = Math.floor(gameClockMs / 60000).toString().padStart(2, '0');
         const displaySecs = Math.floor((gameClockMs % 60000) / 1000).toString().padStart(2, '0');
         timerRef.current.innerText = `${displayMins}:${displaySecs}`;
      }

      // 5. Draw
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, 0, width, height);

      // Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      
      // Center line
      ctx.beginPath();
      ctx.moveTo(width/2, 0); 
      ctx.lineTo(width/2, height);
      ctx.stroke();
      
      // Center circle
      ctx.beginPath();
      ctx.arc(width/2, height/2, 60, 0, Math.PI*2);
      ctx.stroke();

      // Boxes
      ctx.strokeRect(0, height/2 - 80, 60, 160); // Home Box
      ctx.strokeRect(width-60, height/2 - 80, 60, 160); // Away Box

      // Goal nets
      ctx.fillStyle = 'rgba(200,200,200,0.2)';
      ctx.fillRect(0, height/2 - 60, 20, 120);
      ctx.fillRect(width-20, height/2 - 60, 20, 120);

      // Referee
      ctx.save();
      ctx.translate(ref.pos.x, ref.pos.y);
      const refAngle = Math.atan2(ref.vel.y, ref.vel.x);
      ctx.rotate(refAngle);
      // Body
      ctx.fillStyle = '#000'; // Black shirt
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-ref.radius*0.6, -ref.radius*1.4, ref.radius*1.4, ref.radius*2.8, 6);
      else ctx.rect(-ref.radius*0.6, -ref.radius*1.4, ref.radius*1.4, ref.radius*2.8);
      ctx.fill();
      ctx.stroke();
      // Head
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(0, 0, ref.radius * 0.7, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Players
      allPlayers.forEach(p => {
        // Active indicator
        if (p === activeHomePlayer) {
          const bounce = Math.sin(performance.now() / 150) * 4;
          
          // Outer highlight ring
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, p.radius * 2, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
          ctx.lineWidth = 4;
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
        ctx.arc(-p.radius*0.4 + swing, -p.radius*0.8, p.radius*0.35, 0, Math.PI*2);
        ctx.arc(-p.radius*0.4 - swing, p.radius*0.8, p.radius*0.35, 0, Math.PI*2);
        ctx.fill();

        // Body (Shoulders)
        ctx.fillStyle = p.isGK ? '#1f2937' : p.colorPrimary; // Dark gray for GK
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-p.radius*0.6, -p.radius*1.4, p.radius*1.4, p.radius*2.8, 6);
        } else {
            ctx.rect(-p.radius*0.6, -p.radius*1.4, p.radius*1.4, p.radius*2.8);
        }
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Hands
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        
        let lHandX = p.radius*0.2 - swing;
        let rHandX = p.radius*0.2 + swing;
        let lHandY = -p.radius*1.4;
        let rHandY = p.radius*1.4;

        if (p.celebrationPhase > 0) {
           // Arms out
           lHandY = -p.radius*2.2;
           rHandY = p.radius*2.2;
           lHandX = p.radius*0.5;
           rHandX = p.radius*0.5;
        }

        ctx.arc(lHandX, lHandY, p.radius*0.4, 0, Math.PI*2);
        ctx.arc(rHandX, rHandY, p.radius*0.4, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.7, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      // Pass Assist Target Indicator
      if (passTarget && ballOwner === activeHomePlayer && mousePos.current.x === 0 && mousePos.current.y === 0) {
         ctx.beginPath();
         ctx.arc(passTarget.pos.x, passTarget.pos.y - passTarget.radius - 10, 4, 0, Math.PI*2);
         ctx.fillStyle = '#60a5fa'; // Blue dot for pass
         ctx.fill();
         ctx.stroke();
      }

      // Mouse Aim Indicator
      if (mousePos.current.x > 0 || mousePos.current.y > 0) {
         ctx.beginPath();
         ctx.arc(mousePos.current.x, mousePos.current.y, 6, 0, Math.PI*2);
         ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
         ctx.lineWidth = 2;
         ctx.stroke();
         ctx.beginPath();
         ctx.moveTo(mousePos.current.x - 10, mousePos.current.y);
         ctx.lineTo(mousePos.current.x + 10, mousePos.current.y);
         ctx.moveTo(mousePos.current.x, mousePos.current.y - 10);
         ctx.lineTo(mousePos.current.x, mousePos.current.y + 10);
         ctx.stroke();
      }

      // Ball Shadow
      if (ball.z > 0) {
         ctx.beginPath();
         ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 0.8, 0, Math.PI*2);
         ctx.fillStyle = 'rgba(0,0,0,0.3)';
         ctx.fill();
      }

      // Ball
      const renderScale = 1 + (ball.z / 100);
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y - ball.z, ball.radius * renderScale, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      ctx.stroke();

      // Power Bar
      if (chargePower > 0) {
        ctx.fillStyle = 'red';
        ctx.fillRect(activeHomePlayer.pos.x - 15, activeHomePlayer.pos.y - 15, 30 * (chargePower/100), 4);
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

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => {
       window.removeEventListener('unstuck', handleUnstuck);
       cancelAnimationFrame(animationFrameId);
    };
  }, [homeTeamId, awayTeamId, onMatchEnd]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center bg-black cursor-none">
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-auto">
        <button onClick={onQuit} className="bg-red-600 text-white px-4 py-2 border-2 border-white font-['Press_Start_2P'] text-xs uppercase hover:bg-red-500 cursor-pointer">Quit</button>
        <button onClick={toggleFullscreen} className="bg-gray-600 text-white px-4 py-2 border-2 border-white font-['Press_Start_2P'] text-xs uppercase hover:bg-gray-500 cursor-pointer">
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <button onClick={() => setIsRetroMode(!isRetroMode)} className="bg-yellow-600 text-white px-4 py-2 border-2 border-white font-['Press_Start_2P'] text-xs uppercase hover:bg-yellow-500 cursor-pointer">
          {isRetroMode ? 'B&W TV: ON' : 'B&W TV: OFF'}
        </button>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-6 bg-black/60 px-6 py-3 border-2 border-white rounded font-['Press_Start_2P'] text-white">
          <div className="flex items-center gap-3">
             <img src={`https://flagcdn.com/w40/${TEAMS_1970.find(t=>t.id===homeTeamId)?.iso2}.png`} className="w-8 h-6 object-cover border border-white" style={{ imageRendering: 'pixelated' }} />
             <span className="text-xl">{matchScore.home}</span>
          </div>
          <span className="text-gray-400">-</span>
          <div className="flex items-center gap-3">
             <span className="text-xl">{matchScore.away}</span>
             <img src={`https://flagcdn.com/w40/${TEAMS_1970.find(t=>t.id===awayTeamId)?.iso2}.png`} className="w-8 h-6 object-cover border border-white" style={{ imageRendering: 'pixelated' }} />
          </div>
        </div>
        <div className="bg-black/60 px-4 py-2 border-2 border-white text-white font-['Press_Start_2P'] text-sm flex gap-4">
           <span>{matchPhaseStatus}</span>
           <span ref={timerRef}>00:00</span>
        </div>
      </div>

      {/* Cinematic Overlays */}
      {matchPhaseStatus === 'Intro1st' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <h2 className="text-6xl text-white font-['Press_Start_2P'] drop-shadow-lg animate-pulse text-center leading-relaxed">1ST HALF<br/><span className="text-2xl mt-4 block">KICK-OFF</span></h2>
        </div>
      )}
      {matchPhaseStatus === 'Intro2nd' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <h2 className="text-6xl text-white font-['Press_Start_2P'] drop-shadow-lg animate-pulse text-center leading-relaxed">2ND HALF<br/><span className="text-2xl mt-4 block">KICK-OFF</span></h2>
        </div>
      )}
      {matchPhaseStatus === 'HT' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <h2 className="text-6xl text-white font-['Press_Start_2P'] drop-shadow-lg animate-pulse">HALF TIME</h2>
        </div>
      )}
      {matchPhaseStatus === 'FT' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <h2 className="text-6xl text-white font-['Press_Start_2P'] drop-shadow-lg animate-pulse">FULL TIME</h2>
        </div>
      )}
      {matchPhaseStatus === 'Paused' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-black/50 backdrop-blur-sm pointer-events-auto">
           <h2 className="text-6xl text-white font-['Press_Start_2P'] drop-shadow-lg animate-pulse">PAUSED</h2>
           <button 
             onClick={() => window.dispatchEvent(new Event('unstuck'))}
             className="bg-yellow-600 text-white px-6 py-4 border-4 border-white font-['Press_Start_2P'] text-xl uppercase hover:bg-yellow-500 cursor-pointer"
           >
             Unstuck Game
           </button>
           <p className="text-white text-sm font-['Press_Start_2P'] opacity-70">If players or ball get stuck out of bounds, use this.</p>
        </div>
      )}
      {matchPhaseStatus === 'YellowCard' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <div className="w-24 h-32 bg-yellow-400 border-4 border-white mb-4 animate-bounce rotate-12" />
           <h2 className="text-4xl text-white font-['Press_Start_2P'] drop-shadow-lg uppercase text-center leading-relaxed">FOUL!<br/>YELLOW CARD</h2>
        </div>
      )}
      {matchPhaseStatus === 'RedCard' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
           <div className="w-24 h-32 bg-red-600 border-4 border-white mb-4 animate-bounce -rotate-12" />
           <h2 className="text-4xl text-red-500 font-['Press_Start_2P'] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] uppercase text-center leading-relaxed">BRUTAL FOUL!<br/>RED CARD</h2>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay opacity-20 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px]" />
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        className={`w-full h-full max-h-[80vh] object-contain shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all duration-700 ${isRetroMode ? 'grayscale sepia-[.3] contrast-125' : 'contrast-125 saturate-110'}`} 
      />
      <div className="absolute bottom-4 right-4 z-30 text-white text-[10px] font-['Press_Start_2P'] opacity-50 flex flex-col items-end gap-2 text-right">
        <span>WASD: Move</span>
        <span>SHIFT: Sprint</span>
        <span>SPACE: Shoot / Tackle</span>
        <span>CTRL: Pass</span>
        <span className="text-yellow-400">Q/E: AI Tactics / Celebrate</span>
      </div>
    </div>
  );
};
