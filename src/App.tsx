/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { CampaignLevel, GameTheme, Skin, PlayerStats, GameMutation, CommentState, ThemeId } from "./types";
import GameBoard from "./components/GameBoard";
import PromptLab from "./components/PromptLab";
import ArcadeShop from "./components/ArcadeShop";
import StatsLeaderboard from "./components/StatsLeaderboard";
import { 
  Gamepad2, Sparkles, ShoppingBag, Trophy, Terminal, HelpCircle, 
  Coins, Zap, Play, Cpu, Shield, Snowflake, HeartHandshake, LogIn
} from "lucide-react";

// 1. Campaign database
const CAMPAIGN_LEVELS: CampaignLevel[] = [
  {
    id: 1,
    title: "Novice Cyber-Glide",
    subtitle: "Level 1",
    targetScore: 10,
    rivalActive: false,
    hasWalls: false,
    presetObstacles: [],
    rewardCoins: 15,
    description: "Welcome to the Neo Grid. Portals are active (wrap-around enabled). Master steering controls and eat 10 red cherries."
  },
  {
    id: 2,
    title: "Obstacle Survivor",
    subtitle: "Level 2",
    targetScore: 15,
    rivalActive: false,
    hasWalls: true,
    presetObstacles: [
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 16, y: 14 }, { x: 16, y: 15 }, { x: 16, y: 16 },
      { x: 10, y: 4 }, { x: 11, y: 4 }
    ],
    rewardCoins: 25,
    description: "The mainframe built block blocks! Avoid hitting security obstacles (indicated by '#') and reach a score of 15."
  },
  {
    id: 3,
    title: "Rivalry Prototype",
    subtitle: "Level 3",
    targetScore: 15,
    rivalActive: true,
    hasWalls: false,
    presetObstacles: [],
    rewardCoins: 40,
    description: "An autonomous computer intelligence (Rival Snake) spawns! Compete with it to eat target fruits first and hit 15. Active energy shield kills him!"
  },
  {
    id: 4,
    title: "Time-dilation Challenge",
    subtitle: "Level 4",
    targetScore: 20,
    rivalActive: false,
    hasWalls: false,
    presetObstacles: [
      { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 11, y: 10 }, { x: 11, y: 11 }
    ],
    timeLimit: 40, // 40 seconds
    rewardCoins: 50,
    description: "Grid collapse is imminent! Survive obstacles and score 20 points before the 40-second digital timer ticks out."
  },
  {
    id: 5,
    title: "Slyther's Gauntlet",
    subtitle: "Level 5",
    targetScore: 25,
    rivalActive: true,
    hasWalls: true,
    presetObstacles: [
      { x: 4, y: 4 }, { x: 17, y: 4 },
      { x: 4, y: 17 }, { x: 17, y: 17 },
      { x: 10, y: 10 }
    ],
    timeLimit: 60, // 60 seconds
    rewardCoins: 100,
    description: "The ultimate trial. Tight obstacles, rigorous speed pacing, rigid borders (no portals!), and an active AI Rival compete together under 60 seconds!"
  }
];

// 2. Skins Customization Catalog
const ALL_SKINS: Skin[] = [
  {
    id: "default",
    name: "Classic Pixel Green",
    className: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] border border-emerald-300",
    trailClassName: "bg-emerald-600/80",
    unlocked: true,
    cost: 0,
    description: "The traditional nostalgic arcade green. Hardened leather feeling from the pixel days."
  },
  {
    id: "vapor",
    name: "Neon Palms Sunset",
    className: "bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.7)] border border-pink-300",
    trailClassName: "bg-fuchsia-600/70",
    unlocked: false,
    cost: 30,
    description: "Glows with a warm beach purple synthwave shimmer. Vapor drift style."
  },
  {
    id: "glitch",
    name: "Cyber Glitch Override",
    className: "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(6,182,212,0.7)] border border-cyan-200",
    trailClassName: "bg-blue-600/70",
    unlocked: false,
    cost: 60,
    description: "A flashing neon cyan skin that glitches the local rendering matrices code."
  },
  {
    id: "dragon",
    name: "Imperial Royal Dragon",
    className: "bg-gradient-to-r from-yellow-300 via-amber-400 to-rose-500 shadow-[0_0_15px_rgba(245,158,11,1)] border border-yellow-200",
    trailClassName: "bg-amber-600/80 animate-pulse",
    unlocked: false,
    cost: 150,
    description: "Legendary gilded skin. Grants you gold flakes trail particle visualization aura."
  },
  {
    id: "ghost",
    name: "Spectral Ghost Frame",
    className: "bg-slate-300/40 border-2 border-slate-200 shadow-[0_0_10px_rgba(255,255,255,0.4)] backdrop-blur-xs",
    trailClassName: "bg-slate-500/20",
    unlocked: false,
    cost: 100,
    description: "Semi-translucent phantom skin. Slippery, stealthy, and vanishes in shadows."
  }
];

// 3. Game UI Themes
const GAME_THEMES: GameTheme[] = [
  {
    id: "elegant",
    name: "Elegant Dark",
    bgClass: "from-slate-950 via-slate-900 to-slate-950",
    boardBg: "bg-[#020617]",
    gridColor: "border-[#1e293b]/50",
    primaryAccent: "bg-emerald-500",
    secondaryAccent: "bg-emerald-600"
  },
  {
    id: "cyberpunk",
    name: "Cyber-Neon",
    bgClass: "from-slate-950 via-slate-900 to-slate-950",
    boardBg: "bg-cyan-950/20",
    gridColor: "border-cyan-950/30",
    primaryAccent: "bg-cyan-500",
    secondaryAccent: "bg-fuchsia-500"
  },
  {
    id: "matrix",
    name: "Digital Matrix",
    bgClass: "from-black via-zinc-950 to-black",
    boardBg: "bg-emerald-950/15",
    gridColor: "border-emerald-950/25",
    primaryAccent: "bg-emerald-500",
    secondaryAccent: "bg-green-600"
  },
  {
    id: "vaporwave",
    name: "Vapor-Dream",
    bgClass: "from-indigo-950 via-purple-950 to-pink-950",
    boardBg: "bg-pink-950/20",
    gridColor: "border-purple-950/35",
    primaryAccent: "bg-pink-500",
    secondaryAccent: "bg-violet-500"
  },
  {
    id: "candy",
    name: "Sugar Rush",
    bgClass: "from-rose-955 via-fuchsia-950 to-purple-950",
    boardBg: "bg-rose-950/10",
    gridColor: "border-rose-950/25",
    primaryAccent: "bg-rose-400",
    secondaryAccent: "bg-indigo-400"
  },
  {
    id: "classic",
    name: "Nokia CRT",
    bgClass: "from-stone-900 to-neutral-950",
    boardBg: "bg-stone-950/30",
    gridColor: "border-stone-800/40",
    primaryAccent: "bg-stone-400",
    secondaryAccent: "bg-stone-500"
  }
];


export default function App() {
  const [activeTab, setActiveTab] = useState<"game" | "prompts" | "shop" | "leaderboard">("game");
  const [currentMode, setCurrentMode] = useState<"classic" | "campaign" | "rival">("classic");
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [wrapAround, setWrapAround] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Stats State
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    highScore: 0,
    totalGames: 0,
    totalFoodEaten: 0,
    totalCoins: 20, // Start with 20 gift coins
    unlockedSkins: ["default"],
    levelsCompleted: []
  });

  // Cosmetic skin selection
  const [selectedSkinId, setSelectedSkinId] = useState<string>("default");
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("elegant");

  // Prompts mutation state
  const [activeMutation, setActiveMutation] = useState<GameMutation>({
    active: false,
    speedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    unlockedSkinId: undefined,
    invertControls: false,
    gravityActive: false,
    themeId: undefined,
    announcement: "Standard safe grid loaded",
    promptText: "",
    durationLeft: 0
  });

  // Slyther AI Commentator reactive state
  const [currentComment, setCurrentComment] = useState<CommentState | null>(null);
  const [commentHistory, setCommentHistory] = useState<CommentState[]>([]);
  const lastCommentTime = useRef<number>(0);

  // Active game session score metric
  const [sessionScore, setSessionScore] = useState<number>(0);

  // On mount state loading
  useEffect(() => {
    const savedStats = localStorage.getItem("snake_legends_player_stats");
    if (savedStats) {
      try {
        setPlayerStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Failed to parse localized stats", e);
      }
    }
  }, []);

  // Save Stats handler
  const saveStats = (updated: PlayerStats) => {
    setPlayerStats(updated);
    localStorage.setItem("snake_legends_player_stats", JSON.stringify(updated));
  };

  // Hack prompts timer decay
  useEffect(() => {
    if (!activeMutation.active) return;
    
    const interval = setInterval(() => {
      setActiveMutation((prev) => {
        if (!prev.active) return prev;
        if (prev.durationLeft <= 1) {
          clearInterval(interval);
          
          setCommentHistory((h) => [
            {
              text: "System Alert: Hacked simulation code has run out! Back to basic safety protocols, human.",
              vibe: "snarky",
              speaker: "slyther",
              timestamp: Date.now()
            },
            ...h
          ]);

          return {
            ...prev,
            active: false,
            speedMultiplier: 1.0,
            scoreMultiplier: 1.0,
            unlockedSkinId: undefined,
            invertControls: false,
            gravityActive: false,
            themeId: undefined,
            announcement: "Mutation expired.",
            durationLeft: 0
          };
        }
        return { ...prev, durationLeft: prev.durationLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMutation.active]);

  // Apply a mutation from PromptLab
  const handleApplyMutation = (newMutation: GameMutation) => {
    setActiveMutation(newMutation);

    // If a custom skin is requested & unlocked by AI model bypass, grant it temporary
    if (newMutation.unlockedSkinId) {
      const targetSkin = ALL_SKINS.find(s => s.name.toLowerCase().includes(newMutation.unlockedSkinId!.toLowerCase()) || s.id === newMutation.unlockedSkinId!.toLowerCase());
      if (targetSkin) {
        setSelectedSkinId(targetSkin.id);
        const alreadyHas = playerStats.unlockedSkins.includes(targetSkin.id);
        if (!alreadyHas) {
          const up = { ...playerStats, unlockedSkins: [...playerStats.unlockedSkins, targetSkin.id] };
          saveStats(up);
        }
      }
    }

    // Change custom theme temporarily if model generated one
    if (newMutation.themeId) {
      setSelectedThemeId(newMutation.themeId);
    }

    // Push commentator feedback manually
    const textToShow = `HACK INJECTED! Broadcast: "${newMutation.announcement}"`;
    const logsObj: CommentState = {
      text: newMutation.announcement,
      vibe: "shocked",
      speaker: "slyther",
      timestamp: Date.now()
    };
    setCurrentComment(logsObj);
    setCommentHistory((prev) => [logsObj, ...prev]);
  };

  // Reset modifiers
  const handleResetMutation = () => {
    setActiveMutation({
      active: false,
      speedMultiplier: 1.0,
      scoreMultiplier: 1.0,
      unlockedSkinId: undefined,
      invertControls: false,
      gravityActive: false,
      themeId: undefined,
      announcement: "Hacks deactivated.",
      promptText: "",
      durationLeft: 0
    });
    setSelectedThemeId("cyberpunk");
  };

  // Post live reactive commentary back to server
  const handlePostComment = async (eventType: string, score: number, customText?: string) => {
    const now = Date.now();
    // Throttle high frequency eating log calls to prevent server flooding
    if (eventType === "food_eaten" && now - lastCommentTime.current < 8000) {
      return;
    }
    lastCommentTime.current = now;

    try {
      const activeSkin = ALL_SKINS.find(s => s.id === selectedSkinId);
      const res = await fetch("/api/slyther/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          score,
          speed: activeMutation.active ? activeMutation.speedMultiplier : 1.0,
          skinName: activeSkin ? activeSkin.name : "Classic Green",
          levelsCompleted: playerStats.levelsCompleted,
          customContext: customText
        })
      });

      const data = await res.json();
      if (res.ok) {
        const commentObj: CommentState = {
          text: data.text || "Munch munch! Keep slithering, giant!",
          vibe: data.vibe || "happy",
          speaker: "slyther",
          timestamp: Date.now()
        };
        setCurrentComment(commentObj);
        setCommentHistory((prev) => [commentObj, ...prev]);
      }
    } catch (e) {
      console.error("Failed to query Slyther AI voiceover commentator:", e);
    }
  };

  // Update coin counts in persistent storage
  const handleUpdateCoins = (amount: number) => {
    const up = {
      ...playerStats,
      totalCoins: playerStats.totalCoins + amount,
      totalFoodEaten: playerStats.totalFoodEaten + amount
    };
    saveStats(up);
  };

  // Complete Campaign Mission level
  const handleLevelComplete = (levelId: number, rewardCoins: number) => {
    setCommentHistory((h) => [
      {
        text: `Level Complete! Stage ${levelId} records hacked successfully. Received +${rewardCoins} gift coins!`,
        vibe: "cheering",
        speaker: "slyther",
        timestamp: Date.now()
      },
      ...h
    ]);

    const levelsDone = [...playerStats.levelsCompleted];
    if (!levelsDone.includes(levelId)) {
      levelsDone.push(levelId);
    }

    const up = {
      ...playerStats,
      totalCoins: playerStats.totalCoins + rewardCoins,
      levelsCompleted: levelsDone
    };
    saveStats(up);
    
    // Auto speed next unlocks stage
    if (levelId < CAMPAIGN_LEVELS.length) {
      setActiveLevelId(levelId + 1);
    }
  };

  // Complete death logs
  const handleDied = (lastScore: number) => {
    setSessionScore(lastScore);
    const hasNewHigh = lastScore > playerStats.highScore;
    const up = {
      ...playerStats,
      totalGames: playerStats.totalGames + 1,
      highScore: hasNewHigh ? lastScore : playerStats.highScore
    };
    saveStats(up);
  };

  // Reset Stats profiles
  const handleClearStats = () => {
    const up = {
      highScore: 0,
      totalGames: 0,
      totalFoodEaten: 0,
      totalCoins: 20,
      unlockedSkins: ["default"],
      levelsCompleted: []
    };
    saveStats(up);
    setSelectedSkinId("default");
    localStorage.removeItem("snake_legends_leaderboard");
    window.location.reload();
  };

  // Buy Skin helper
  const handleBuySkin = (skinId: string, cost: number) => {
    if (playerStats.totalCoins >= cost) {
      const up = {
        ...playerStats,
        totalCoins: playerStats.totalCoins - cost,
        unlockedSkins: [...playerStats.unlockedSkins, skinId]
      };
      saveStats(up);
      setSelectedSkinId(skinId);
      
      setCommentHistory((h) => [
        {
          text: `Sweet skin unlock choice! That neon cybernetic design matches your processor beautifully.`,
          vibe: "happy",
          speaker: "slyther",
          timestamp: Date.now()
        },
        ...h
      ]);
    }
  };

  // Select Theme manually
  const handleSelectTheme = (themeId: ThemeId) => {
    setSelectedThemeId(themeId);
  };

  // Derived styling presets
  const selectedTheme = GAME_THEMES.find(t => t.id === selectedThemeId) || GAME_THEMES[0];
  const activeSkin = ALL_SKINS.find(s => s.id === selectedSkinId) || ALL_SKINS[0];
  const activeLevelObj = CAMPAIGN_LEVELS.find(l => l.id === activeLevelId) || CAMPAIGN_LEVELS[0];

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-100 transition-colors duration-500 pb-12`}>
      
      {/* 1. Header Navigation HUD with Arcade styling */}
      <header className="border-b border-[#1e293b] bg-[#0f172a] sticky top-0 z-50 px-4 py-3 select-none shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              <Gamepad2 className="w-5 h-5 text-slate-950 animate-bounce" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-white tracking-widest text-lg flex items-center gap-1.5 uppercase leading-none glow-text">
                AI Arcade Snake Legends
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                NEO-RETRO ELEGANT DARK EDITION
              </span>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div id="quick-hud-coins" className="flex items-center gap-4 text-xs font-mono">
            {playerStats.totalCoins > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/30 px-3 py-1 rounded text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                <Coins className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{playerStats.totalCoins} COINS</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#1e293b] border border-[#334155] px-3 py-1 rounded text-slate-300 font-bold">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>RECORD: {playerStats.highScore} PTS</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex bg-[#020617] p-1 border border-[#1e293b] rounded-lg">
            <button
              onClick={() => setActiveTab("game")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all uppercase tracking-tight ${
                activeTab === "game" 
                  ? "bg-[#1e293b] text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/40" 
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Arcade Grid
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all uppercase tracking-tight ${
                activeTab === "prompts" 
                  ? "bg-[#1e293b] text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/40" 
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Prompt Lab
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all uppercase tracking-tight ${
                activeTab === "shop" 
                  ? "bg-[#1e293b] text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/40" 
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Shoppe
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all uppercase tracking-tight ${
                activeTab === "leaderboard" 
                  ? "bg-[#1e293b] text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/40" 
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> High Scores
            </button>
          </nav>

        </div>
      </header>

      {/* 2. Main Bento Layout Wrapper */}
      <main className="max-w-7xl lg:max-w-[1300px] mx-auto px-4 mt-6">
        
        {/* Active Custom Mutation Alert Header */}
        {activeMutation.active && (
          <div className="mb-5 bg-purple-950/40 border border-purple-500/40 rounded-xl px-4 py-3 text-xs flex flex-col sm:flex-row items-center gap-3 animate-fade-in shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <div className="bg-purple-600 px-2 py-1 rounded text-white font-mono font-bold animate-pulse text-[10px] uppercase">
              ⚠️ LIVE MOD ACTIVE
            </div>
            <div className="flex-1 font-sans text-purple-200">
              Hacking Rule Code: <span className="font-mono italic font-bold text-white">&ldquo;{activeMutation.promptText}&rdquo;</span> — Score output yield multiplier is active!
            </div>
            <div className="text-[10px] font-mono text-purple-400 shrink-0 font-bold">
              TIME REMAINING: {activeMutation.durationLeft}s
            </div>
          </div>
        )}

        {/* Tab Displays Router */}
           {/* TAB 1: Arcade game cabinet split screen */}
        {activeTab === "game" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Console Column: Select Stage Level & Slyther Commentator */}
            <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
              
              {/* Campaign Progressive List */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-2 shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-350 font-bold block mb-1">
                  🗺️ Select Stage Level
                </span>

                {currentMode !== "campaign" && (
                  <p className="text-[10px] text-emerald-400 font-mono leading-tight mb-2 animate-pulse uppercase tracking-wider">
                    ⚡ Tap stage to open Campaign Mode
                  </p>
                )}
                
                <div className="space-y-1.5">
                  {CAMPAIGN_LEVELS.map((level) => {
                    const completed = playerStats.levelsCompleted.includes(level.id);
                    const active = currentMode === "campaign" && activeLevelId === level.id;
                    
                    return (
                      <button
                        key={level.id}
                        onClick={() => {
                          setActiveLevelId(level.id);
                          if (currentMode !== "campaign") {
                            setCurrentMode("campaign");
                          }
                        }}
                        className={`w-full text-left p-2 rounded border text-xs flex justify-between items-center transition-all cursor-pointer ${
                          active 
                            ? "border-emerald-500 bg-emerald-950/15 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                            : completed 
                              ? "border-[#1e293b] hover:border-slate-700 bg-emerald-950/5 text-emerald-450 font-bold" 
                              : "border-[#1e293b]/50 hover:border-slate-700 bg-[#020617]/40 text-slate-400"
                        }`}
                      >
                        <div>
                          <span className="font-mono text-[9px] block text-emerald-400 tracking-wider">STAGE 0{level.id}</span>
                          <span className="font-bold select-none">{level.title}</span>
                        </div>
                        {completed && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-1 py-0.5 rounded font-mono uppercase font-bold">
                            PASS
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Middle Section: Game Screen (Play Area in the center and at the start) */}
            <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
              <GameBoard
                currentMode={currentMode}
                activeLevelId={activeLevelId}
                activeLevelObj={currentMode === "campaign" ? activeLevelObj : null}
                activeMutation={activeMutation}
                selectedSkinClassName={activeSkin.className}
                selectedSkinTrailClassName={activeSkin.trailClassName}
                selectedSkinId={selectedSkinId}
                selectedTheme={selectedTheme}
                playerCoins={playerStats.totalCoins}
                onUpdateCoins={handleUpdateCoins}
                onLevelComplete={handleLevelComplete}
                onPostComment={handlePostComment}
                onDied={handleDied}
                wrapAround={wrapAround}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
              />
            </div>

            {/* Right Console Column: Select Game Mode, Grid/Difficulty Settings, Hacks Referral */}
            <div className="lg:col-span-3 flex flex-col gap-4 order-3 lg:order-3">
              
              {/* Select Game Mode Selector widget */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-3 shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-[#1e293b] pb-1">
                  🕹️ Select Game Mode
                </span>

                {/* Submode 1: Classic standard */}
                <button
                  onClick={() => setCurrentMode("classic")}
                  className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    currentMode === "classic" 
                      ? "border-emerald-500 bg-emerald-950/10 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                      : "border-[#1e293b] bg-[#020617]/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold font-sans">Nostalgic Classic</span>
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase">Original Snake Grid</span>
                  </div>
                  <Play className={`w-3.5 h-3.5 ${currentMode === "classic" ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
                </button>

                {/* Submode 2: AI Rival */}
                <button
                  onClick={() => setCurrentMode("rival")}
                  className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    currentMode === "rival" 
                      ? "border-emerald-500 bg-emerald-950/10 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                      : "border-[#1e293b] bg-[#020617]/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold font-sans">AI Rival Arena</span>
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase">Competitive Opponent</span>
                  </div>
                  <Cpu className={`w-3.5 h-3.5 ${currentMode === "rival" ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
                </button>

                {/* Submode 3: Campaign */}
                <button
                  onClick={() => setCurrentMode("campaign")}
                  className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    currentMode === "campaign" 
                      ? "border-emerald-500 bg-emerald-950/10 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                      : "border-[#1e293b] bg-[#020617]/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold font-sans">Adventure Campaign</span>
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase">Levels Progression</span>
                  </div>
                  <Trophy className={`w-3.5 h-3.5 ${currentMode === "campaign" ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
                </button>
              </div>

              {/* Grid settings & parameters */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-3 pb-1 border-b border-[#1e293b]">
                  ⚙️ Grid Settings
                </span>
                
                <label className="flex items-center justify-between p-1.5 cursor-pointer text-xs select-none hover:text-white transition-colors">
                  <span className="text-slate-350">Boundary Portal / Wrap-around</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      disabled={currentMode === "campaign"}
                      checked={currentMode === "campaign" ? !activeLevelObj?.hasWalls : wrapAround}
                      onChange={(e) => setWrapAround(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-[#020617] border border-[#1e293b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-650 peer-checked:after:bg-white"></div>
                  </div>
                </label>

                {/* Sidebar Difficulty Selector */}
                <div className="mt-4 pt-4 border-t border-[#1e293b]/60 flex flex-col gap-2">
                  <span className="text-slate-350 text-xs font-sans">Game Difficulty Level:</span>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#020617] border border-[#1e293b] rounded-lg">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        disabled={currentMode === "campaign"}
                        onClick={() => setDifficulty(diff)}
                        className={`py-1.5 rounded text-[10px] font-mono uppercase transition-all font-bold cursor-pointer select-none ${
                          difficulty === diff
                            ? "bg-emerald-600 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "text-slate-400 hover:text-slate-205"
                        } ${currentMode === "campaign" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  {currentMode === "campaign" && (
                    <p className="text-[9px] text-slate-500 font-mono text-center uppercase">
                      Fixed by Campaign Level
                    </p>
                  )}
                </div>

                {currentMode === "campaign" && (
                  <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase border-t border-[#1e293b]/60 pt-2 text-center">
                    * Portal wraps are locked in Level configs
                  </p>
                )}
              </div>

              {/* Shortcut to prompt lab */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3.5 flex flex-col gap-2 relative overflow-hidden select-none shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block glow-text">
                  🛠️ Quick Prompt Lab Access
                </span>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Stuck? Open the **Prompt Lab** tab above. Type prompts like <span className="font-mono text-emerald-400 italic">&ldquo;make me invincible&rdquo;</span> or <span className="font-mono text-emerald-400 italic">&ldquo;slow down speed&rdquo;</span> to gain leverage!
                </p>
                <button
                  onClick={() => setActiveTab("prompts")}
                  className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-slate-950 font-mono rounded text-xs uppercase tracking-wider font-bold transition-all text-center shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Open Sandbox Hacks
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: AI Prompt sandbox modifier laboratory console */}
        {activeTab === "prompts" && (
          <div className="grid grid-cols-1 gap-6 items-start">
            {/* Terminal console */}
            <div className="w-full">
              <PromptLab
                activeMutation={activeMutation}
                onApplyMutation={handleApplyMutation}
                onResetMutation={handleResetMutation}
                playerStats={playerStats}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Customizer Skins & Themes Shoppe */}
        {activeTab === "shop" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8">
              <ArcadeShop
                playerStats={playerStats}
                selectedSkinId={selectedSkinId}
                onSelectSkin={(id) => setSelectedSkinId(id)}
                onBuySkin={handleBuySkin}
                selectedThemeId={selectedThemeId}
                onSelectTheme={handleSelectTheme}
                gameThemes={GAME_THEMES}
                allSkins={ALL_SKINS}
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-lg relative select-none">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-2 pb-1 border-b border-[#1e293b] glow-text">
                  🏆 Cosmic Unlock achievements
                </span>
                <p className="text-xs text-slate-400 mb-3 font-sans leading-relaxed">
                  Show off style of your pixel snake skins by achieving high standings:
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className={`p-2 rounded border flex items-center justify-between ${
                    playerStats.highScore >= 30 ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-400 font-bold" : "border-[#1e293b]/80 bg-[#020617]/40 text-slate-500"
                  }`}>
                    <span>SCORE 30 PTS</span>
                    <span>{playerStats.highScore >= 30 ? "✔ DONE" : "LOCKED"}</span>
                  </div>
                  <div className={`p-2 rounded border flex items-center justify-between ${
                    playerStats.levelsCompleted.length >= 3 ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-400 font-bold" : "border-[#1e293b]/80 bg-[#020617]/40 text-slate-500"
                  }`}>
                    <span>FINISH 3 CAMPAIGN STAGES</span>
                    <span>{playerStats.levelsCompleted.length >= 3 ? "✔ DONE" : "LOCKED"}</span>
                  </div>
                  <div className={`p-2 rounded border flex items-center justify-between ${
                    playerStats.unlockedSkins.length >= 3 ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-400 font-bold" : "border-[#1e293b]/80 bg-[#020617]/40 text-slate-500"
                  }`}>
                    <span>COLLECT 3 SKINS</span>
                    <span>{playerStats.unlockedSkins.length >= 3 ? "✔ DONE" : "LOCKED"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Scores, high logs, statistics and delete profiles */}
        {activeTab === "leaderboard" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8">
              <StatsLeaderboard
                playerStats={playerStats}
                currentScore={sessionScore}
                onClearStats={handleClearStats}
                selectedSkinName={activeSkin.name}
                currentMode={currentMode}
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl font-sans text-xs text-slate-300 leading-relaxed select-text space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block pb-1 border-b border-slate-800">
                  📁 Assignment Documentation Report Helper
                </span>
                <p>
                  This game is developed to actively present the school prompt deliverables:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 font-mono text-[11px] text-cyan-300">
                  <li>AI prompt logs are fully tracked under <b>Slyther Comments</b>.</li>
                  <li>Live mutations verify exact prompt-to-compile metrics values!</li>
                  <li>Copy logs to fulfill report submission targets trivially.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
