/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Skin, ThemeId, GameTheme, PlayerStats } from "../types";
import { Coins, Check, ShoppingBag, Eye, Star, Palette, Award } from "lucide-react";

interface ArcadeShopProps {
  playerStats: PlayerStats;
  selectedSkinId: string;
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skinId: string, cost: number) => void;
  selectedThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  gameThemes: GameTheme[];
  allSkins: Skin[];
}

export default function ArcadeShop({
  playerStats,
  selectedSkinId,
  onSelectSkin,
  onBuySkin,
  selectedThemeId,
  onSelectTheme,
  gameThemes,
  allSkins
}: ArcadeShopProps) {
  const handleSkinAction = (skin: Skin) => {
    const isUnlocked = playerStats.unlockedSkins.includes(skin.id);
    if (isUnlocked) {
      onSelectSkin(skin.id);
    } else {
      if (playerStats.totalCoins >= skin.cost) {
        onBuySkin(skin.id, skin.cost);
      }
    }
  };

  return (
    <div id="shop-panel" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col h-full shadow-lg relative overflow-hidden">
      {/* Background neon accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,_rgba(16,185,129,0.03),_transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-[#1e293b] pb-2 relative z-10">
        <ShoppingBag className="w-5 h-5 text-emerald-400" />
        <h3 className="font-sans font-semibold tracking-tight text-white text-sm uppercase glow-text">
          Arcade Customization <span className="text-emerald-400">Shoppe</span>
        </h3>
        {/* balance */}
        <div className="ml-auto flex items-center gap-1 bg-emerald-950/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-300 font-mono shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          <Coins className="w-3.5 h-3.5" />
          <span>{playerStats.totalCoins} COINS</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
        Eat apples and glowing orbs in classic or campaign modes to earn coins! Use them to unlock custom cosmic trails and glowing neon skins.
      </p>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 max-h-[380px] custom-scrollbar">
        {/* Section 1: Skins customization */}
        <div>
          <div className="text-[10px] font-mono tracking-wider uppercase text-slate-500 mb-2 flex items-center gap-1">
            <Palette className="w-3" /> Select Cosmetic Skin
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allSkins.map((s) => {
              const unlocked = playerStats.unlockedSkins.includes(s.id);
              const selected = selectedSkinId === s.id;
              const affordable = playerStats.totalCoins >= s.cost;

              return (
                <div 
                  key={s.id} 
                  className={`bg-[#020617]/80 border rounded-lg p-3 relative flex flex-col justify-between transition-all ${
                    selected ? "border-emerald-500 bg-emerald-950/10 shadow-[0_0_12px_rgba(16,185,129,0.25)]" : "border-[#1e293b] hover:border-slate-750"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-xs font-sans font-bold text-white">{s.name}</span>
                      
                      {selected ? (
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                          <Check className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : unlocked ? (
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Eye className="w-2.5 h-2.5" /> Selectable
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-emerald-450 flex items-center gap-0.5 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          <Coins className="w-3 h-3" /> {s.cost}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-normal mb-3">
                      {s.description}
                    </p>
                  </div>

                  {/* Skin Preview bar */}
                  <div className="flex gap-1.5 items-center bg-[#0f172a] border border-[#1e293b] rounded p-1.5 mb-3.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wide shrink-0">Preview:</span>
                    <div className="flex gap-1">
                      <div className={`w-3.5 h-3.5 rounded-full ${s.className}`}></div>
                      <div className={`w-3 h-3 rounded-full opacity-80 ${s.trailClassName || s.className}`}></div>
                      <div className={`w-2.5 h-2.5 rounded-full opacity-60 ${s.trailClassName || s.className}`}></div>
                    </div>
                  </div>

                  {/* Button Action */}
                  <button
                    onClick={() => handleSkinAction(s)}
                    className={`w-full py-2 rounded text-xs uppercase font-mono font-bold tracking-wider transition-all border cursor-pointer ${
                      selected 
                        ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-500/70 cursor-default" 
                        : unlocked 
                          ? "bg-[#1e293b] hover:bg-[#334155] border-[#334155] hover:text-white text-slate-300" 
                          : affordable 
                            ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold" 
                            : "bg-[#020617]/40 border-transparent text-slate-650 cursor-not-allowed"
                    }`}
                  >
                    {selected ? "Equipped" : unlocked ? "Equip Skin" : affordable ? "Buy Skin" : "Insufficient Coins"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Visual Themes selection */}
        <div>
          <div className="text-[10px] font-mono tracking-wider uppercase text-slate-500 mb-2 flex items-center gap-1">
            <Palette className="w-3" /> Grid Theme Preset Style
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {gameThemes.map((t) => {
              const selected = selectedThemeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTheme(t.id)}
                  className={`text-left p-2 border rounded-lg transition-all flex flex-col justify-between h-[64px] cursor-pointer ${
                    selected ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.25)]" : "border-[#1e293b] bg-[#020617]/40 hover:border-slate-700 hover:bg-[#020617]/70"
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-tight text-white font-bold">{t.name}</span>
                  
                  {/* Theme Dots */}
                  <div className="flex gap-1.5 items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#020617] border border-[#1e293b] flex items-center justify-center overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-sm ${t.primaryAccent}`}></div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#020617] border border-[#1e293b] flex items-center justify-center overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-sm ${t.secondaryAccent}`}></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
