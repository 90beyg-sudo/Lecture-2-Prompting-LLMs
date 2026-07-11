/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Direction, Position, FoodItem, RivalSnake, CampaignLevel, GameTheme, GameMutation, CommentState } from "../types";
import { Play, Pause, RotateCcw, Shield, Zap, Snowflake, Trophy, Flame, Coins, ShieldAlert, Cpu, Volume2, VolumeX } from "lucide-react";
import { audioManager } from "../utils/audio";

interface GameBoardProps {
  currentMode: "classic" | "campaign" | "rival";
  activeLevelId: number;
  activeLevelObj: CampaignLevel | null;
  activeMutation: GameMutation;
  selectedSkinClassName: string;
  selectedSkinTrailClassName?: string;
  selectedSkinId: string;
  selectedTheme: GameTheme;
  playerCoins: number;
  onUpdateCoins: (amount: number) => void;
  onLevelComplete: (levelId: number, rewardCoins: number) => void;
  onPostComment: (eventType: string, score: number, customText?: string) => void;
  onDied: (score: number) => void;
  wrapAround: boolean;
  difficulty?: "easy" | "medium" | "hard";
  onDifficultyChange?: (diff: "easy" | "medium" | "hard") => void;
}

export default function GameBoard({
  currentMode,
  activeLevelId,
  activeLevelObj,
  activeMutation,
  selectedSkinClassName,
  selectedSkinTrailClassName,
  selectedSkinId,
  selectedTheme,
  playerCoins,
  onUpdateCoins,
  onLevelComplete,
  onPostComment,
  onDied,
  wrapAround,
  difficulty = "medium",
  onDifficultyChange
}: GameBoardProps) {
  const isCampaign = currentMode === "campaign";
  const GRID_SIZE = isCampaign ? 22 : (difficulty === "easy" ? 28 : difficulty === "hard" ? 15 : 22);

  const [snake, setSnake] = useState<Position[]>(() => {
    const startGrid = currentMode === "campaign" ? 22 : (difficulty === "easy" ? 28 : difficulty === "hard" ? 15 : 22);
    const startCenter = Math.floor(startGrid / 2);
    return [
      { x: startCenter, y: startCenter },
      { x: startCenter, y: startCenter + 1 },
      { x: startCenter, y: startCenter + 2 }
    ];
  });
  const [direction, setDirection] = useState<Direction>("UP");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [isMuted, setIsMuted] = useState(() => audioManager.getMutedState());
  const [food, setFood] = useState<FoodItem>(() => {
    const startGrid = currentMode === "campaign" ? 22 : (difficulty === "easy" ? 28 : difficulty === "hard" ? 15 : 22);
    const startCenter = Math.floor(startGrid / 2);
    return {
      position: { x: startCenter - 4 > 0 ? startCenter - 4 : 2, y: startCenter - 4 > 0 ? startCenter - 4 : 2 },
      type: "standard",
      colorClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
      pointValue: 1
    };
  });

  // Dual/Rival snake configuration state
  const [rival, setRival] = useState<RivalSnake>(() => {
    const rivalX = difficulty === "hard" ? 2 : 3;
    return {
      body: [
        { x: rivalX, y: 3 },
        { x: rivalX, y: 4 },
        { x: rivalX, y: 5 }
      ],
      direction: "RIGHT",
      alive: true,
      colorClass: "bg-fuchsia-600 shadow-[0_0_8px_rgba(217,70,239,0.8)] border border-fuchsia-300",
      respawnTimer: 0
    };
  });

  // Power Ups timer status
  const [shieldDurationLeft, setShieldDurationLeft] = useState(0); // Player Shield
  const [freezeDurationLeft, setFreezeDurationLeft] = useState(0); // Freeze AI
  const [levelTimer, setLevelTimer] = useState<number | null>(null);

  // FX Shockwave and triggers
  const [eatRipple, setEatRipple] = useState<Position | null>(null);

  const directionRef = useRef<Direction>("UP");
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gravityTickCount = useRef(0);

  // Set active direction cleanly
  const changeDirection = useCallback((newDir: Direction) => {
    let finalDir = newDir;
    // Handle reversed controls mutation
    if (activeMutation.active && activeMutation.invertControls) {
      if (newDir === "UP") finalDir = "DOWN";
      else if (newDir === "DOWN") finalDir = "UP";
      else if (newDir === "LEFT") finalDir = "RIGHT";
      else if (newDir === "RIGHT") finalDir = "LEFT";
    }

    const currentDir = directionRef.current;
    if (finalDir === "UP" && currentDir === "DOWN") return;
    if (finalDir === "DOWN" && currentDir === "UP") return;
    if (finalDir === "LEFT" && currentDir === "RIGHT") return;
    if (finalDir === "RIGHT" && currentDir === "LEFT") return;

    directionRef.current = finalDir;
    setDirection(finalDir);
  }, [activeMutation]);

  // Handle keyboard captures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          changeDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          changeDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          changeDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          changeDirection("RIGHT");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection, gameOver]);

  // Generate random fruit coordinates off of walls and snake bodies
  const generateNewFood = useCallback((
    currentSnake: Position[], 
    obstacles: Position[], 
    rivalBody: Position[]
  ): FoodItem => {
    let position = { x: 0, y: 0 };
    let intersects = true;

    while (intersects) {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };

      // Check crash matches
      const onPlayer = currentSnake.some((s) => s.x === position.x && s.y === position.y);
      const onWall = obstacles.some((o) => o.x === position.x && o.y === position.y);
      const onRival = rivalBody.some((r) => r.x === position.x && r.y === position.y);

      if (!onPlayer && !onWall && !onRival) {
        intersects = false;
      }
    }

    // Determine specialty item probabilities
    const roll = Math.random();
    let type: FoodItem["type"] = "standard";
    let colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-300";
    let pointValue = 1;

    // Apply mutation food rain if applicable
    if (activeMutation.active && activeMutation.foodRainType === "golden") {
      type = "gold";
      colorClass = "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] border border-amber-200 animate-pulse";
      pointValue = 4;
    } else if (roll < 0.12) {
      type = "gold";
      colorClass = "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] border border-amber-200 animate-pulse";
      pointValue = 3;
    } else if (roll >= 0.12 && roll < 0.20 && (currentMode === "rival" || (activeLevelObj?.rivalActive))) {
      type = "freeze";
      colorClass = "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)] border border-sky-200";
      pointValue = 1;
    } else if (roll >= 0.20 && roll < 0.28) {
      type = "shield";
      colorClass = "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,1)] border border-fuchsia-200";
      pointValue = 1;
    } else if (roll >= 0.28 && roll < 0.35) {
      type = "speed";
      colorClass = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] border border-emerald-200 animate-bounce";
      pointValue = 2;
    }

    return { position, type, colorClass, pointValue };
  }, [currentMode, activeLevelObj, activeMutation, GRID_SIZE]);

  // Handle Level Timers in Campaign Adventure
  useEffect(() => {
    if (!gameStarted || gameOver || currentMode !== "campaign" || !activeLevelObj?.timeLimit) return;
    
    setLevelTimer(activeLevelObj.timeLimit);

    const timerInterval = setInterval(() => {
      setLevelTimer((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerInterval);
          setGameOver(true);
          audioManager.playCrash();
          onPostComment("died", score, "Time ran out before achieving the stage target score! Tough luck, slowpoke.");
          onDied(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameStarted, gameOver, currentMode, activeLevelObj, score, onPostComment, onDied]);

  // Power Up timers countdown tick
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      setShieldDurationLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setFreezeDurationLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Restart clean state
  const resetGame = useCallback(() => {
    const center = Math.floor(GRID_SIZE / 2);
    setSnake([
      { x: center, y: center },
      { x: center, y: center + 1 },
      { x: center, y: center + 2 }
    ]);
    directionRef.current = "UP";
    setDirection("UP");
    setGameOver(false);
    setScore(0);
    setSessionCoins(0);
    setShieldDurationLeft(0);
    setFreezeDurationLeft(0);
    setEatRipple(null);
    gravityTickCount.current = 0;

    const obstacleList = currentMode === "campaign" && activeLevelObj ? activeLevelObj.presetObstacles : [];
    
    const rivalX = difficulty === "hard" ? 2 : 3;
    setRival({
      body: [
        { x: rivalX, y: 3 },
        { x: rivalX, y: 4 },
        { x: rivalX, y: 5 }
      ],
      direction: "RIGHT",
      alive: true,
      colorClass: "bg-fuchsia-600 shadow-[0_0_8px_rgba(217,70,239,0.8)] border border-fuchsia-300",
      respawnTimer: 0
    });

    setFood(generateNewFood([
      { x: center, y: center },
      { x: center, y: center + 1 },
      { x: center, y: center + 2 }
    ], obstacleList, [
      { x: rivalX, y: 3 },
      { x: rivalX, y: 4 },
      { x: rivalX, y: 5 }
    ]));

    if (currentMode === "campaign" && activeLevelObj) {
      setLevelTimer(activeLevelObj.timeLimit || null);
    } else {
      setLevelTimer(null);
    }

    setGameStarted(false);
  }, [currentMode, activeLevelObj, generateNewFood, GRID_SIZE, difficulty]);

  // Reset when campaign levels, modes, or difficulty change
  useEffect(() => {
    resetGame();
  }, [currentMode, activeLevelId, difficulty, resetGame]);

  // Automatic BGM loop triggers
  useEffect(() => {
    if (gameStarted && !gameOver) {
      audioManager.startBGM();
    } else {
      audioManager.stopBGM();
    }
    return () => {
      audioManager.stopBGM();
    };
  }, [gameStarted, gameOver]);

  // Primary Snake Step Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Determine movement tick rate (base is 130ms, scales with level difficulty, speed buffs and client mod hacks)
    let baseSpeed = 130;
    if (currentMode === "campaign") {
      if (activeLevelId > 2) {
        baseSpeed = 110;
      }
    } else {
      if (difficulty === "easy") {
        baseSpeed = 175;
      } else if (difficulty === "hard") {
        baseSpeed = 85;
      }
    }
    
    // Apply speed modifiers
    let speedFactor = 1.0;
    if (activeMutation.active) {
      speedFactor = activeMutation.speedMultiplier;
    }

    const finalInterval = baseSpeed / speedFactor;

    gameLoopRef.current = setInterval(() => {
      // 1. Compute obstacles list
      const obstacles = currentMode === "campaign" && activeLevelObj ? activeLevelObj.presetObstacles : [];

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        let currentDir = directionRef.current;

        // Apply gravitational physical drift (e.g. falls downward slightly)
        if (activeMutation.active && activeMutation.gravityActive) {
          gravityTickCount.current += 1;
          if (gravityTickCount.current >= 4) { // Every 4 ticks drift down
            gravityTickCount.current = 0;
            currentDir = "DOWN";
          }
        }

        // Steer coordinate
        switch (currentDir) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        // Wrap or Crash Walls
        const isPortal = wrapAround || (currentMode === "campaign" && !activeLevelObj?.hasWalls);
        if (isPortal) {
          if (head.x < 0) head.x = GRID_SIZE - 1;
          else if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          else if (head.y >= GRID_SIZE) head.y = 0;
        } else {
          // Strict rigid walls
          if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            setGameOver(true);
            audioManager.playCrash();
            const crashSfx = ["Hit a boundary screen!", "Died in structural walls."];
            onPostComment("died", score, `Hit a rigid border boundary! Unfortunate! Final score: ${score}`);
            onDied(score);
            return prevSnake;
          }
        }

        // Check self tail collision
        const bitOwnTail = prevSnake.some((segment, idx) => idx > 0 && segment.x === head.x && segment.y === head.y);
        if (bitOwnTail && shieldDurationLeft === 0) {
          setGameOver(true);
          audioManager.playCrash();
          onPostComment("died", score, `Ate your own tail segment! High-dimensional digital ouroboros failed. Final score: ${score}`);
          onDied(score);
          return prevSnake;
        }

        // Obstacles collision
        const hitObstacle = obstacles.some((o) => o.x === head.x && o.y === head.y);
        if (hitObstacle && shieldDurationLeft === 0) {
          setGameOver(true);
          audioManager.playCrash();
          onPostComment("died", score, `Slammed head-first into a fixed security obstacle grid. Game over!`);
          onDied(score);
          return prevSnake;
        }

        // AI Rival collision
        const activeRival = currentMode === "rival" || (activeLevelObj?.rivalActive);
        if (activeRival && rival.alive) {
          const hitRivalSegment = rival.body.some((rSeg) => rSeg.x === head.x && rSeg.y === head.y);
          if (hitRivalSegment && shieldDurationLeft === 0) {
            setGameOver(true);
            audioManager.playCrash();
            onPostComment("died", score, `Crashed into the body of your rival competitor snake! Watch out!`);
            onDied(score);
            return prevSnake;
          }
        }

        // 2. Evaluate if Food is absorbable
        const ateFoodNow = head.x === food.position.x && head.y === food.position.y;
        let newSnake = [head, ...prevSnake];

        if (ateFoodNow) {
          audioManager.playEat();
          // Play point multiplier increment
          const pointsEarned = food.pointValue * (activeMutation?.active ? activeMutation.scoreMultiplier : 1.0);
          const incrementalCoins = food.pointValue; // Keep coins proportional to fruit type

          setScore((s) => {
            const upScore = s + pointsEarned;
            
            // Check campaign criteria
            if (currentMode === "campaign" && activeLevelObj && upScore >= activeLevelObj.targetScore) {
              setGameOver(true);
              setGameStarted(false);
              onLevelComplete(activeLevelObj.id, activeLevelObj.rewardCoins);
            }
            return upScore;
          });

          // Trigger screen ripples
          setEatRipple({ ...food.position });
          setTimeout(() => setEatRipple(null), 1000);

          onUpdateCoins(incrementalCoins);
          setSessionCoins((sc) => sc + incrementalCoins);

          // Handle Custom Fruits modifiers
          if (food.type === "shield") {
            setShieldDurationLeft(6); // 6s shield
          } else if (food.type === "freeze") {
            setFreezeDurationLeft(5); // 5s freeze AI opponent
          }

          // Trigger commentary on random boundaries
          const triggerRoll = Math.random();
          if (triggerRoll < 0.35) {
            onPostComment("food_eaten", score + pointsEarned);
          }

          // Spawn new food coordinate
          const currentRivalBody = activeRival ? rival.body : [];
          setFood(generateNewFood(newSnake, obstacles, currentRivalBody));
        } else {
          newSnake.pop(); // Remove standard tail end
        }

        return newSnake;
      });

      // 3. Move the autonomous AI Rival Snake
      const hasRivalSnake = currentMode === "rival" || (activeLevelObj?.rivalActive);
      if (hasRivalSnake) {
        setRival((prevRival) => {
          if (!prevRival.alive) {
            if (prevRival.respawnTimer <= 1) {
              // Respawn AI Snake on standard empty grid corner
              return {
                ...prevRival,
                body: [
                  { x: 1, y: 1 },
                  { x: 1, y: 2 },
                  { x: 1, y: 3 }
                ],
                alive: true,
                respawnTimer: 0
              };
            } else {
              return { ...prevRival, respawnTimer: prevRival.respawnTimer - 1 };
            }
          }

          // If freeze power-up is active, AI freezes solid!
          if (freezeDurationLeft > 0) {
            return prevRival;
          }

          // Competetive routing: Rival snake calculates coordinate direction toward food
          let head = { ...prevRival.body[0] };
          const target = food.position;

          // Simple greedy distance routing
          let nextDir: Direction = prevRival.direction;
          const diffX = target.x - head.x;
          const diffY = target.y - head.y;

          // Avoid immediate self collision or backing into neck
          const isValidMove = (dir: Direction): boolean => {
            let nextPos = { ...head };
            if (dir === "UP") nextPos.y -= 1;
            else if (dir === "DOWN") nextPos.y += 1;
            else if (dir === "LEFT") nextPos.x -= 1;
            else if (dir === "RIGHT") nextPos.x += 1;

            // Boundaries
            if (nextPos.x < 0 || nextPos.x >= GRID_SIZE || nextPos.y < 0 || nextPos.y >= GRID_SIZE) return false;
            
            // Self segment collision
            const collideSelf = prevRival.body.some(b => b.x === nextPos.x && b.y === nextPos.y);
            // Obstacles preset
            const hitWall = obstacles.some(ws => ws.x === nextPos.x && ws.y === nextPos.y);
            
            return !collideSelf && !hitWall;
          };

          // Find optimal steer direction
          const options: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
          let bestOption = prevRival.direction;
          let minDistance = 9999;

          options.forEach((dir) => {
            // Prevent backward illegal turns
            if (dir === "UP" && prevRival.direction === "DOWN") return;
            if (dir === "DOWN" && prevRival.direction === "UP") return;
            if (dir === "LEFT" && prevRival.direction === "RIGHT") return;
            if (dir === "RIGHT" && prevRival.direction === "LEFT") return;

            if (isValidMove(dir)) {
              let candidate = { ...head };
              if (dir === "UP") candidate.y -= 1;
              if (dir === "DOWN") candidate.y += 1;
              if (dir === "LEFT") candidate.x -= 1;
              if (dir === "RIGHT") candidate.x += 1;

              const dist = Math.abs(target.x - candidate.x) + Math.abs(target.y - candidate.y);
              if (dist < minDistance) {
                minDistance = dist;
                bestOption = dir;
              }
            }
          });

          // Compute head coordinate
          let newRivalHead = { ...head };
          switch (bestOption) {
            case "UP":
              newRivalHead.y -= 1;
              break;
            case "DOWN":
              newRivalHead.y += 1;
              break;
            case "LEFT":
              newRivalHead.x -= 1;
              break;
            case "RIGHT":
              newRivalHead.x += 1;
              break;
          }

          // Execute move step
          let newRivalBody = [newRivalHead, ...prevRival.body];
          
          // Check if AI Rival hit the Player snake body (If player has shield active, AI dies on player body!)
          const mainSnakeSegments = snake; // current state
          const hitPlayer = mainSnakeSegments.some((ms) => ms.x === newRivalHead.x && ms.y === newRivalHead.y);

          if (hitPlayer) {
            if (shieldDurationLeft > 0) {
              // AI Rival dies/crashes!
              onPostComment("rival_killed", score, "SPLAT! You trapped the rival snake with your energy shield active! Elite moves!");
              setScore((s) => s + 5); // Bonus 5 pts
              return {
                ...prevRival,
                alive: false,
                respawnTimer: 5 // Respawn in 5s
              };
            } else {
              // Head on impact
              setGameOver(true);
              onPostComment("died", score, "Impact collision! You collided head-on with your AI Rival. Watch coordinates!");
              onDied(score);
              return prevRival;
            }
          }

          // Check if AI ate the food coordinate!
          const aiAteFood = newRivalHead.x === food.position.x && newRivalHead.y === food.position.y;
          if (aiAteFood) {
            onPostComment("food_eaten", score, "Aww! The AI rival snake stole your golden cherries right from under your snout!");
            setFood(generateNewFood(mainSnakeSegments, obstacles, newRivalBody));
          } else {
            newRivalBody.pop();
          }

          // Check AI boundaries/self hits as a failsafe
          const crashedWall = newRivalHead.x < 0 || newRivalHead.x >= GRID_SIZE || newRivalHead.y < 0 || newRivalHead.y >= GRID_SIZE;
          const crashedSelf = prevRival.body.some(b => b.x === newRivalHead.x && b.y === newRivalHead.y);

          if (crashedWall || crashedSelf) {
            return {
              ...prevRival,
              alive: false,
              respawnTimer: 4
            };
          }

          return {
            ...prevRival,
            body: newRivalBody,
            direction: bestOption
          };
        });
      }

    }, finalInterval);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, food, currentMode, activeLevelId, activeLevelObj, wrapAround, activeMutation, shieldDurationLeft, freezeDurationLeft, generateNewFood, onDied, onLevelComplete, onPostComment, onUpdateCoins, score, snake, rival.alive, rival.body, rival.direction]);

  const handleStartStop = () => {
    if (!gameStarted) {
      setGameStarted(true);
      onPostComment("game_started", score);
    } else {
      setGameStarted(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[580px] lg:max-w-[650px] px-1 sm:px-0 mx-auto">
      
      {/* Visual Stats Indicators Bar */}
      <div className="w-full flex justify-between items-center bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg mb-4 text-xs font-mono select-none shadow-md">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 uppercase">SCORE:</span>
            <span className="text-emerald-400 font-bold text-sm tracking-wider glow-text">{score}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 border-l border-[#1e293b] pl-4">
            <Coins className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-400 uppercase">EARNED:</span>
            <span className="text-emerald-400 font-bold">+{sessionCoins}</span>
          </div>
        </div>

        {/* Timers list / Active powers */}
        <div id="active-timers" className="flex items-center gap-4">
          {levelTimer !== null && (
            <div className={`flex items-center gap-1 border border-[#1e293b] bg-[#020617] px-2 py-0.5 rounded text-[11px] ${
              levelTimer < 10 ? "text-red-400 border-red-500/40 animate-ping" : "text-slate-300"
            }`}>
              TIMER: <span className="font-bold">{levelTimer}s</span>
            </div>
          )}

          {shieldDurationLeft > 0 && (
            <div className="flex items-center gap-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold animate-pulse">
              <Shield className="w-3" /> Shield {shieldDurationLeft}s
            </div>
          )}

          {freezeDurationLeft > 0 && (
            <div className="flex items-center gap-1 bg-sky-950/40 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold animate-pulse">
              <Snowflake className="w-3" /> Frozen {freezeDurationLeft}s
            </div>
          )}
          
          {/* Mute/Volume Toggle Button */}
          <button
            onClick={() => {
              const nextVal = audioManager.toggleMute();
              setIsMuted(nextVal);
            }}
            className="p-1 px-1.5 border border-[#1e293b] hover:border-[#334155]/80 bg-[#020617] rounded text-slate-350 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono tracking-wider ml-1"
            title={isMuted ? "Unmute sound effects and music" : "Mute audio system"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-500 font-bold">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">SFX BGM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Grid Graphic Visual Field */}
      <div 
        id="arcade-stage-container"
        className="relative border-4 border-[#1e293b] bg-black rounded-lg overflow-hidden select-none shadow-[0_0_45px_rgba(0,0,0,0.7)] transition-colors duration-300 w-full"
        style={{
          aspectRatio: "1"
        }}
      >
        {/* Dynamic theme board color styling overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${selectedTheme.boardBg} opacity-80 pointer-events-none`}></div>
        
        {/* Background Digital Retro Scroller Grid */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse_at_center, rgba(16, 185, 129, 0.05) 0%, rgba(2, 6, 23, 0.95) 100%)`,
            backgroundSize: "cover"
          }}
        ></div>

        {/* Grid Cells plotting */}
        <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);

            // 1. Check if Snake Segment
            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const snakeSegmentIdx = snake.findIndex((s) => s.x === x && s.y === y);
            const isSnake = snakeSegmentIdx !== -1;

            // 2. Check if food coordinates match
            const isFood = food.position.x === x && food.position.y === y;

            // 3. Check Obstacles
            const isObstacle = currentMode === "campaign" && activeLevelObj
              ? activeLevelObj.presetObstacles.some((o) => o.x === x && o.y === y)
              : false;

            // 4. Check if AI Rival snake
            const showRival = currentMode === "rival" || (activeLevelObj?.rivalActive);
            const isRivalHead = showRival && rival.alive && rival.body[0]?.x === x && rival.body[0]?.y === y;
            const rivalIdx = showRival && rival.alive ? rival.body.findIndex((r) => r.x === x && r.y === y) : -1;
            const isRival = rivalIdx !== -1;

            return (
              <div 
                key={i} 
                className={`relative flex items-center justify-center border-[0.5px] transition-all duration-200 ${
                  selectedTheme.gridColor
                }`}
              >
                {/* 1. Draw Player Snake */}
                {isSnake && (
                  <div 
                    className={`absolute inset-[1px] rounded transition-all duration-300 ${
                      isHead 
                        ? `${selectedSkinClassName} rounded-md border border-slate-100 z-30` 
                        : `${selectedSkinTrailClassName || selectedSkinClassName} opacity-85 z-20`
                    }`}
                  >
                    {isHead && (
                      <div className="flex justify-around items-center h-full px-0.5 pointer-events-none">
                        <div className="w-[28%] h-[28%] min-w-[3px] min-h-[3px] rounded-full bg-slate-950"></div>
                        <div className="w-[28%] h-[28%] min-w-[3px] min-h-[3px] rounded-full bg-slate-950"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Draw Food target */}
                {isFood && (
                  <div className={`absolute w-[70%] h-[70%] min-w-[10px] min-h-[10px] rounded-full z-10 transition-transform ${food.colorClass}`}>
                    <div className="w-[30%] h-[40%] bg-green-500 rounded-full ml-[35%] -mt-[25%] transform rotate-12"></div>
                  </div>
                )}

                {/* 3. Draw Level Obstacles */}
                {isObstacle && (
                  <div className="absolute inset-0 bg-slate-750 border-2 border-slate-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] z-20 font-mono text-[9px] text-slate-400 font-extrabold flex items-center justify-center">
                    #
                  </div>
                )}

                {/* 4. Draw competing AI Snake */}
                {isRival && (
                  <div 
                    className={`absolute inset-[1.5px] rounded-md transition-all duration-300 z-20 ${
                      isRivalHead ? `${rival.colorClass} border-slate-100` : "bg-fuchsia-750/80 border border-fuchsia-800/40"
                    }`}
                  >
                    {isRivalHead && (
                      <div className="flex justify-around items-center h-full px-0.5 pointer-events-none">
                        <div className="w-[28%] h-[28%] min-w-[3px] min-h-[3px] rounded-full bg-slate-950"></div>
                        <div className="w-[28%] h-[28%] min-w-[3px] min-h-[3px] rounded-full bg-slate-950"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Visual Ripple explosion upon absorption of cherry */}
                {eatRipple && Math.abs(x - eatRipple.x) <= 2 && Math.abs(y - eatRipple.y) <= 2 && (
                  <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none z-10 animate-ping"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5. Game Over / Victory Overlay Panel popup */}
        {gameOver && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-40 animate-fade-in select-text">
            <ShieldAlert className="w-14 h-14 text-emerald-450 mb-2 animate-bounce" />
            <h4 className="text-xl font-bold font-sans text-white uppercase tracking-wider glow-text">
              {score >= (activeLevelObj?.targetScore || 99999) && currentMode === "campaign" 
                ? "🏆 STAGE COMPLETED!" 
                : "💥 GRID CRASHED!"
              }
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              {score >= (activeLevelObj?.targetScore || 99999) && currentMode === "campaign"
                ? `Masterful steering. Earned +${activeLevelObj?.rewardCoins} bonus grid coins!`
                : "You lost grip of your snake's tail segment, hit walls, or timed out."
              }
            </p>

            <div className="mt-4 flex gap-3 text-xs">
              <div className="bg-[#1e293b] border border-[#334155] p-2 rounded">
                <span className="block text-[9px] text-slate-450">FINAL SCORE</span>
                <span className="text-white font-mono font-bold text-sm">{score}</span>
              </div>
              <div className="bg-[#1e293b] border border-[#334155] p-2 rounded">
                <span className="block text-[9px] text-slate-450">COINS EARNED</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">+{sessionCoins}</span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="mt-6 flex items-center gap-1.5 bg-emerald-650 hover:bg-emerald-500 border border-emerald-400 text-slate-950 px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-Initialize Grid / Try Again
            </button>
          </div>
        )}

        {/* 6. Awaiting Initialization Overlay banner */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40 select-none">
            {currentMode === "campaign" && activeLevelObj ? (
              <div className="text-center max-w-[300px] mb-4">
                <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider glow-text">
                  MISSION STAGE {activeLevelObj.id}
                </span>
                <h4 className="text-lg font-bold text-white mt-2 leading-tight uppercase font-sans tracking-tight">
                  {activeLevelObj.title}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed italic">
                  &ldquo;{activeLevelObj.description}&rdquo;
                </p>
                <div className="bg-[#1e293b] border border-[#334155] rounded p-2.5 mt-3 text-xs space-y-1 text-slate-300 text-left shadow-lg">
                  <div className="flex justify-between">
                    <span>Target Score Goal:</span> <span className="font-bold text-emerald-400">{activeLevelObj.targetScore} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gravity physical drift:</span> <span className="font-bold text-emerald-500">{activeMutation.gravityActive ? "ACTIVE" : "OFF"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Rival spawn on board:</span> <span className="font-bold text-emerald-500">{activeLevelObj.rivalActive ? "YES" : "NO"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center mb-4 flex flex-col items-center">
                <Cpu className="w-10 h-10 text-emerald-450 mx-auto mb-1 animate-pulse" />
                <h4 className="text-base font-bold text-white uppercase tracking-tight glow-text">
                  Interactive Neo-Retro Grid
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mb-3">
                  {currentMode === "rival" 
                    ? "Compete against Slyther's autonomous rival snake prototype." 
                    : "Traditional arcade game rules with custom speeds configuration."
                  }
                </p>

                {/* Pre-Game Difficulty Level Selection */}
                <div className="w-full max-w-[250px] mb-3 flex flex-col gap-1.5 bg-[#0f172a] border border-[#1e293b] p-2 rounded-lg">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold tracking-wider block text-center">
                    Difficulty Level Settings:
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-[#020617] border border-[#1e293b]/60 p-1 rounded-md">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => onDifficultyChange && onDifficultyChange(diff)}
                        className={`py-1 rounded text-[9px] font-mono uppercase transition-all font-bold cursor-pointer select-none ${
                          difficulty === diff
                            ? "bg-emerald-600 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block text-center leading-none">
                    {difficulty === "easy" && "Slower (175ms) • Grid 28x28"}
                    {difficulty === "medium" && "Default (130ms) • Grid 22x22"}
                    {difficulty === "hard" && "Faster (85ms) • Grid 15x15"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleStartStop}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider hover:opacity-95 transition-all font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] whitespace-nowrap cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Begin Slithering Loop
            </button>
            <div className="text-[10px] text-slate-500 mt-4 font-mono uppercase">
              Interact using [Arrow Keys] or [WASD] on desktop
            </div>
          </div>
        )}
      </div>

      {/* Manual Controllers panel (Perfect tactile feel for Mobile or Tablet frames!) */}
      <div id="mobile-gamepad" className="w-full max-w-[280px] grid grid-cols-3 gap-2 mt-4 select-none">
        <div></div>
        <button
          onClick={() => changeDirection("UP")}
          className="bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] active:scale-95 text-slate-350 rounded-lg p-3.5 flex items-center justify-center transition-all shadow-inner cursor-pointer"
        >
          ▲
        </button>
        <div></div>

        <button
          onClick={() => changeDirection("LEFT")}
          className="bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] active:scale-95 text-slate-355 rounded-lg p-3.5 flex items-center justify-center transition-all shadow-inner cursor-pointer"
        >
          ◀
        </button>
        <button
          onClick={handleStartStop}
          className="bg-[#1e293b] border border-[#334155] hover:bg-[#334155]/85 active:scale-95 text-emerald-400 font-bold rounded-lg p-3 text-[10px] font-mono tracking-tighter uppercase flex items-center justify-center select-none shadow-[0_0_8px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          {gameStarted ? "PAUS" : "PLAY"}
        </button>
        <button
          onClick={() => changeDirection("RIGHT")}
          className="bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] active:scale-95 text-slate-355 rounded-lg p-3.5 flex items-center justify-center transition-all shadow-inner cursor-pointer"
        >
          ▶
        </button>

        <div></div>
        <button
          onClick={() => changeDirection("DOWN")}
          className="bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] active:scale-95 text-slate-355 rounded-lg p-3.5 flex items-center justify-center transition-all shadow-inner cursor-pointer"
        >
          ▼
        </button>
        <div></div>
      </div>
    </div>
  );
}
