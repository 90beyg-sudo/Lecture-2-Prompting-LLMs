/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { CommentState } from "../types";
import { Sparkles, MessageSquare, Flame, ShieldAlert, Award } from "lucide-react";

interface SlytherCommentatorProps {
  currentComment: CommentState | null;
  commentHistory: CommentState[];
}

export default function SlytherCommentator({ currentComment, commentHistory }: SlytherCommentatorProps) {
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Smooth typewriter effect for the commentary
  useEffect(() => {
    if (!currentComment?.text) {
      setTypedText("");
      return;
    }

    setIsTyping(true);
    setTypedText("");
    let index = 0;
    const textToType = currentComment.text;
    
    const interval = setInterval(() => {
      setTypedText((prev) => prev + textToType.charAt(index));
      index++;
      if (index >= textToType.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [currentComment]);

  // Autoscroll history to the bottom
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commentHistory]);

  const getVibeStyles = (vibe: string) => {
    switch (vibe) {
      case "snarky":
        return {
          textColor: "text-amber-400",
          bgColor: "bg-amber-950/40 border-amber-500/30",
          indicatorColor: "bg-amber-500",
          face: "o_o"
        };
      case "shocked":
        return {
          textColor: "text-red-400",
          bgColor: "bg-red-950/40 border-red-500/30",
          indicatorColor: "bg-red-500",
          face: "O_O"
        };
      case "cheering":
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-950/40 border-emerald-500/30",
          indicatorColor: "bg-emerald-500",
          face: "^_^"
        };
      case "happy":
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-900/10 border-emerald-500/20",
          indicatorColor: "bg-emerald-500",
          face: "👁️‿👁️"
        };
      case "coaxing":
        return {
          textColor: "text-cyan-400",
          bgColor: "bg-cyan-950/40 border-cyan-500/30",
          indicatorColor: "bg-cyan-500",
          face: "¬_¬"
        };
      default:
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-900/10 border-emerald-500/20",
          indicatorColor: "bg-emerald-500",
          face: "o_o"
        };
    }
  };

  const activeVibe = getVibeStyles(currentComment?.vibe || "happy");

  return (
    <div id="slyther-panel" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col h-full shadow-lg relative overflow-hidden">
      {/* Background Neon Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(16,185,129,0.03),_transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-[#1e293b] pb-2 relative z-10">
        <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
        <h3 className="font-sans font-semibold tracking-tight text-white text-sm uppercase glow-text">
          AI Commentator: <span className="text-emerald-400 font-bold">Slyther</span>
        </h3>
        <span className="ml-auto flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeVibe.indicatorColor} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${activeVibe.indicatorColor}`}></span>
        </span>
      </div>

      {/* Slyther Avatar + Main Balloon */}
      <div id="chatbot-conversation" className="flex gap-4 items-start mb-4 relative z-10 flex-col sm:flex-row">
        {/* Animated Cybernetic Snake Head */}
        <div className="flex flex-col items-center shrink-0 mx-auto sm:mx-0">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 bg-slate-950 transition-all duration-300 ${
            isTyping ? "scale-105 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]" : "border-emerald-500/40"
          }`}>
            <div className="flex flex-col items-center">
              {/* Snake Eyes with dynamic flickering colors as feedback */}
              <div className="flex gap-2.5 mb-1">
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentComment?.vibe === "shocked" ? "bg-red-500 animate-ping" : 
                  currentComment?.vibe === "snarky" ? "bg-yellow-400" : "bg-emerald-400"
                }`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentComment?.vibe === "shocked" ? "bg-red-500 animate-ping" : 
                  currentComment?.vibe === "snarky" ? "bg-yellow-400" : "bg-emerald-400"
                }`}></div>
              </div>
              
              {/* Mouth with typwriter mouth-opening scale transformation */}
              <div className={`w-6 h-1.5 bg-emerald-400/80 rounded transition-all duration-100 ${
                isTyping ? "h-3 animate-bounce bg-red-400" : "h-1"
              }`}></div>
            </div>
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded tracking-widest mt-1.5">
            {currentComment?.vibe || "IDLE"}
          </div>
        </div>
          {/* Speech Bubble */}
        <div className={`flex-1 p-3.5 rounded-xl border relative w-full ${activeVibe.bgColor} transition-all duration-300`}>
          {/* Bubble peak arrow pointing to the left on screens larger than mobile */}
          <div className="hidden sm:block absolute left-[-6px] top-6 w-3 h-3 bg-[#1e293b] border-l border-b border-[#334155] transform rotate-45"></div>

          <div className="text-xs text-slate-400 font-mono mb-1 select-none flex items-center gap-1">
            <MessageSquare className="w-3" /> Slyther writes...
          </div>
          <p className="font-sans text-sm text-white font-medium leading-relaxed min-h-[36px]">
            {typedText || "Start slithering to wake me up! I'll be watching your every high-score, tail crash, and near-miss."}
          </p>
        </div>
      </div>

      {/* Commentary Log Panel */}
      <div className="flex-1 flex flex-col min-h-[140px] max-h-[140px] bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 relative z-10 mt-auto">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
          <span>Slyther Commentary History</span>
          <span className="text-[9px] bg-[#0f172a] px-1 py-0.5 rounded text-slate-400">
            {commentHistory.length} events logged
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar scroll-smooth">
          {commentHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-600 italic select-none">
              No events generated yet
            </div>
          ) : (
            commentHistory.map((h, i) => (
              <div 
                key={i} 
                className="text-xs border-l-2 pl-2 py-1 leading-normal border-emerald-500/35 bg-[#020617]/40 rounded-r hover:bg-[#020617]/80 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-emerald-400/70">
                    {h.vibe}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 font-sans break-words">{h.text}</p>
              </div>
            ))
          )}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
}
