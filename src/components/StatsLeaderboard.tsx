/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PlayerStats } from "../types";
import { Award, Trophy, Star, History, Trash2, Calendar, Gamepad, Zap } from "lucide-react";

interface HighScoreEntry {
  name: string;
  score: number;
  mode: string;
  date: string;
  skin: string;
}

interface StatsLeaderboardProps {
  playerStats: PlayerStats;
  currentScore: number;
  onClearStats: () => void;
  selectedSkinName: string;
  currentMode: string;
}

export default function StatsLeaderboard({
  playerStats,
  currentScore,
  onClearStats,
  selectedSkinName,
  currentMode
}: StatsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Load initial leaderboard entries
  useEffect(() => {
    const saved = localStorage.getItem("snake_legends_leaderboard");
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    } else {
      // Seed initial funny mock entrants
      const defaultLeaderboard: HighScoreEntry[] = [
        { name: "Slyther_AI", score: 120, mode: "AI Rival", date: "2026-06-18", skin: "Golden Dragon" },
        { name: "RetroSteve", score: 65, mode: "Classic", date: "2026-06-17", skin: "Default Green" },
        { name: "VaporQueen", score: 48, mode: "Vapor Mode", date: "2026-06-16", skin: "Neon Vapor" },
        { name: "PixelJunkie", score: 32, mode: "Classic", date: "2026-06-15", skin: "Cyber Glitch" }
      ];
      localStorage.setItem("snake_legends_leaderboard", JSON.stringify(defaultLeaderboard));
      setLeaderboard(defaultLeaderboard);
    }
  }, []);

  const handleScoreSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || currentScore <= 0 || submitted) return;

    const newEntry: HighScoreEntry = {
      name: playerName.trim(),
      score: currentScore,
      mode: currentMode === "rival" ? "AI Rival" : currentMode === "campaign" ? "Campaign" : "Classic",
      date: new Date().toLocaleDateString(),
      skin: selectedSkinName
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    localStorage.setItem("snake_legends_leaderboard", JSON.stringify(updated));
    setLeaderboard(updated);
    setSubmitted(true);
    setPlayerName("");
  };

  useEffect(() => {
    setSubmitted(false);
  }, [currentScore]);

  return (
    <div id="stats-leaderboard-panel" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col h-full shadow-lg relative overflow-hidden">
      {"/* Background decoration */"}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.03),_transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-[#1e293b] pb-2 relative z-10">
        <Trophy className="w-5 h-5 text-emerald-400" />
        <h3 className="font-sans font-semibold tracking-tight text-white text-sm uppercase glow-text">
          Arcade Performance &amp; <span className="text-emerald-400">Records</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 max-h-[380px] custom-scrollbar">
        {/* Submit Score Form */}
        {currentScore > 0 && !submitted && (
          <div className="bg-[#020617] border border-emerald-500/40 rounded-lg p-3 relative z-10 animate-pulse">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1 block">
              ⭐ New Arcade Score Captured!
            </span>
            <p className="text-xs text-slate-300 font-sans mb-3">
              You scored <span className="text-emerald-400 font-bold font-mono">{currentScore} pts</span> wearing &ldquo;{selectedSkinName}&rdquo;. Submit to the Hall of Fame!
            </p>
            <form onSubmit={handleScoreSubmission} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Initials / Name"
                maxLength={10}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 bg-[#0f172a] text-white border border-[#1e293b] focus:border-emerald-500/50 focus:outline-none px-3 py-1.5 rounded text-xs font-mono"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-slate-950 px-3 py-1 rounded text-xs uppercase font-mono font-bold tracking-wider transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)] cursor-pointer"
              >
                Publish
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-350 text-center font-semibold animate-fade-in relative z-10">
            💥 Score posted to the leaderboards successfully!
          </div>
        )}

        {/* Section 1: Lifetime Statistics */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Gamepad className="w-3" /> Grid pilot life stats
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#020617]/60 border border-[#1e293b] p-2.5 rounded-lg shadow-sm">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Personal High Score</span>
              <span className="text-emerald-400 font-mono font-bold text-sm tracking-wide">
                {playerStats.highScore} PTS
              </span>
            </div>
            <div className="bg-[#020617]/60 border border-[#1e293b] p-2.5 rounded-lg shadow-sm">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Total Coins Earned</span>
              <span className="text-emerald-450 font-mono font-bold text-sm tracking-wide">
                {playerStats.totalCoins} COINS
              </span>
            </div>
            <div className="bg-[#020617]/60 border border-[#1e293b] p-2.5 rounded-lg shadow-sm">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Total Food Consumed</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {playerStats.totalFoodEaten} TILES
              </span>
            </div>
            <div className="bg-[#020617]/60 border border-[#1e293b] p-2.5 rounded-lg shadow-sm">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Campaign Level</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                STAGE {playerStats.levelsCompleted.length + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Hall of Fame Leaderboard */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Award className="w-3" /> Retro Arcade Hall of Fame
          </div>
          <div className="bg-[#020617] border border-[#1e293b] rounded-lg overflow-hidden text-xs shadow-inner">
            {leaderboard.length === 0 ? (
              <div className="p-4 text-center text-slate-600 italic">No scoreboard entries recorded yet</div>
            ) : (
              <div className="divide-y divide-[#1e293b]/70 font-mono">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex p-2.5 items-center justify-between hover:bg-[#1e293b]/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        idx === 0 ? "bg-emerald-500 text-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                        idx === 1 ? "bg-slate-300 text-slate-900" :
                        idx === 2 ? "bg-emerald-900/50 text-slate-300 border border-emerald-500/20" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-white font-bold select-all">{entry.name}</span>
                        <span className="block text-[8px] text-slate-500 uppercase">{entry.mode} &bull; {entry.skin}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-450 text-sm font-bold tracking-wider">{entry.score}</span>
                      <span className="block text-[8px] text-slate-600">{entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reset System Storage */}
        <button
          onClick={onClearStats}
          className="w-full py-1.5 bg-[#020617]/40 hover:bg-red-950/20 text-[9px] font-mono text-slate-600 hover:text-red-400 hover:border-red-950 uppercase tracking-widest border border-dashed border-[#1e293b] rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3" /> Factory Wipe Profile Data
        </button>
      </div>
    </div>
  );
}
