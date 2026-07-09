/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameMutation, PlayerStats } from "../types";
import { Terminal, Send, RefreshCw, Sparkles, BookOpen, Clock, Activity, Zap, ShieldAlert } from "lucide-react";

interface PromptLabProps {
  activeMutation: GameMutation;
  onApplyMutation: (mutation: GameMutation) => void;
  onResetMutation: () => void;
  playerStats: PlayerStats;
}

const TEMPLATE_PROMPTS = [
  { label: "⚡ Lightspeed Turbo", text: "Multiply my game movement speed by 2x but give me a 5x score multiplier for survival!" },
  { label: "🐢 Nostalgic Sloth", text: "Chill out the grid! Slow down my speed to half, and change the theme style to classic retro green." },
  { label: "🕶️ Enter The Matrix", text: "Slyther, hack the rendering engine: set theme to matrix hack color, and enable anti-aircraft gravity!" },
  { label: "🌴 Vaporwave Drift", text: "Set the mood to beach neon purple sunset, and make my controls reversed to simulate a wavy drift feeling." },
  { label: "👑 Golden Dragon", text: "Slyther, grant me the secret legendary Royal Dragon cosmetic skin and give me double point yields!" },
  { label: "🌀 Mirror Reverse", text: "Invert all controls (up is down, left is right) and boost score yield to a massive 10x multiplier cheat code!" }
];

export default function PromptLab({ activeMutation, onApplyMutation, onResetMutation, playerStats }: PromptLabProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const handleTemplateClick = (text: string) => {
    setInputText(text);
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setTerminalLogs([
      `[HACKER_CON_INIT] Establishing connection to Slyther-AI core...`,
      `[PROMPT_INJECT] Payload: "${inputText}"`,
      `[NEURAL_PARSE] Running LLM inference (gemini-3.5-flash)...`
    ]);

    // Simple ticker log to make it feel super authentic
    const logTicker = setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `[DECIPHER] Compiling snake parameters...`,
        `[GRID_MUTATOR] Bypassing grid protection laws...`
      ]);
    }, 600);

    try {
      const response = await fetch("/api/prompt/mod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: inputText,
          currentStats: playerStats
        })
      });

      const data = await response.json();

      clearTimeout(logTicker);

      if (response.ok) {
        setTerminalLogs(prev => [
          ...prev,
          `[SYS_OVERRIDE] Successfully bypassed terminal logic!`,
          `[MUTATION_READY] Modified Speed: ${data.speedMultiplier}x, Score Yield: ${data.scoreMultiplier}x`,
          `[THEME_MOD] Applied theme style: ${data.themeId || "Default"}`,
          `[BROADCAST] Slyther: "${data.announcement}"`
        ]);

        const duration = 45; // 45 seconds dynamic mod
        const newMutation: GameMutation = {
          active: true,
          speedMultiplier: data.speedMultiplier || 1.0,
          scoreMultiplier: data.scoreMultiplier || 1.0,
          unlockedSkinId: data.unlockedSkinId,
          invertControls: !!data.invertControls,
          gravityActive: !!data.gravityActive,
          themeId: data.themeId || undefined,
          announcement: data.announcement || "Custom game mutation loaded!",
          promptText: inputText,
          durationLeft: duration
        };

        onApplyMutation(newMutation);
        setInputText("");
      } else {
        throw new Error(data.error || "Modification was rejected by the grid.");
      }
    } catch (err: any) {
      clearTimeout(logTicker);
      setTerminalLogs(prev => [
        ...prev,
        `[CRITICAL_ERR] Core rejected the query! Reason: ${err.message}`,
        `[EMBED_FAIL] Reverting to standby safe parameters.`
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="prompt-lab-panel" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col h-full shadow-lg relative overflow-hidden">
      {/* Background neon grid accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(16,185,129,0.03),_transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-[#1e293b] pb-2 relative z-10">
        <Terminal className="w-5 h-5 text-emerald-400" />
        <h3 className="font-sans font-semibold tracking-tight text-white text-sm uppercase glow-text">
          AI Prompt Laboratory <span className="text-emerald-400">Modder</span>
        </h3>
        <span className="ml-auto text-[10px] bg-emerald-950/60 border border-emerald-500/35 text-emerald-450 px-1.5 py-0.5 rounded tracking-widest font-mono shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          BETA CORE v1.4
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed relative z-10">
        Become a grid architect. Prompt our AI server using natural language to live-mutate game rules, speeds, point yields, gravity forces, and unlock secret designs!
      </p>

      {/* Active Mod Stats */}
      <div className="mb-4 bg-[#020617] border border-[#1e293b] rounded-lg p-3 relative z-10 shadow-inner">
        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><Activity className="w-3" /> Core Modification Status</span>
          {activeMutation.active && (
            <span className="text-[10px] text-emerald-400 animate-pulse flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-500/20 rounded font-bold font-mono">
              <Clock className="w-3 h-3" /> {activeMutation.durationLeft}s left
            </span>
          )}
        </div>

        {activeMutation.active ? (
          <div className="space-y-2">
            <div className="text-sm text-emerald-350 font-semibold bg-emerald-950/20 border-l-4 border-emerald-500 pl-2.5 py-1 rounded">
              {activeMutation.announcement}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
              <div className="bg-[#0f172a] border border-[#1e293b] p-1.5 rounded flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-mono">Speed Mod</span>
                <span className="text-white font-bold font-mono">{activeMutation.speedMultiplier}x</span>
              </div>
              <div className="bg-[#0f172a] border border-[#1e293b] p-1.5 rounded flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-mono">Score Yield</span>
                <span className="text-emerald-400 font-bold font-mono">{activeMutation.scoreMultiplier}x</span>
              </div>
              <div className="bg-[#0f172a] border border-[#1e293b] p-1.5 rounded flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-mono">Gravity Force</span>
                <span className="text-emerald-400 font-bold font-mono">{activeMutation.gravityActive ? "ON" : "OFF"}</span>
              </div>
              <div className="bg-[#0f172a] border border-[#1e293b] p-1.5 rounded flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-mono">Invert Controls</span>
                <span className="text-emerald-400 font-bold font-mono">{activeMutation.invertControls ? "YES" : "NO"}</span>
              </div>
            </div>
            <button
              onClick={onResetMutation}
              className="mt-2 w-full flex items-center justify-center gap-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-500/30 hover:border-red-500/90 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> De-activate Mod Code / Reset
            </button>
          </div>
        ) : (
          <div className="h-[92px] flex flex-col items-center justify-center text-xs text-slate-650 italic select-none">
            <Zap className="w-5 h-5 text-slate-800 mb-1" />
            <span>Standing by. Grid is on safe/normal protocol.</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Selector */}
      <div className="mb-4 relative z-10">
        <div className="text-[10px] font-mono uppercase tracking-semibold text-slate-500 mb-2 flex items-center gap-1">
          <BookOpen className="w-3" /> Quick Mod Hack Templates
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_PROMPTS.map((t, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleTemplateClick(t.text)}
              className="text-left text-[11px] bg-[#020617]/50 border border-[#1e293b] hover:border-emerald-500/40 font-mono text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/10 p-2 rounded transition-all truncate cursor-pointer"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Command Prompt Form */}
      <form onSubmit={handleSendPrompt} className="flex gap-2 mb-4 relative z-10">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder="e.g. Try 'Give me 3x extreme score and turn screen green!'"
          className="flex-1 bg-[#020617] text-white border border-[#1e293b] hover:border-[#334155] focus:border-emerald-500/60 focus:outline-none p-3.5 rounded-lg text-xs font-mono placeholder:text-slate-650 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950/40 disabled:text-emerald-300/40 disabled:border-emerald-950/20 border border-emerald-500/40 hover:border-emerald-400 text-slate-950 px-4 rounded-lg flex items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 cursor-pointer font-extrabold"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Terminal logs diagnostics */}
      <div className="flex-1 flex flex-col bg-[#020617] border border-[#1e293b] rounded-lg p-2.5 font-mono text-[10px] min-h-[140px] max-h-[140px] relative z-10 overflow-hidden">
        <div className="text-slate-500 font-bold mb-1 border-b border-[#1e293b] pb-1 uppercase flex items-center justify-between">
          <span>hacker core diagnostics log</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-slate-450">
          {terminalLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-700 italic">
              [SYSTEM] Logging ready. Run a prompt code above.
            </div>
          ) : (
            terminalLogs.map((log, idx) => {
              let color = "text-slate-450";
              if (log.includes("[HACKER")) color = "text-emerald-400 font-semibold";
              if (log.includes("[CRITICAL")) color = "text-red-400 font-bold";
              if (log.includes("[SUCCESS") || log.includes("[MUTATION")) color = "text-emerald-400 font-semibold glow-text";
              if (log.includes("[BROADCAST")) color = "text-emerald-300 italic";
              if (log.includes("[THEME")) color = "text-emerald-500";

              return (
                <div key={idx} className={`${color} leading-relaxed break-words`}>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
