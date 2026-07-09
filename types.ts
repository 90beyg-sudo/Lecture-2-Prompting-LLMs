/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Position {
  x: number;
  y: number;
}

export interface Skin {
  id: string;
  name: string;
  className: string; // Tailwind gradient classes
  trailClassName?: string;
  unlocked: boolean;
  cost: number;
  description: string;
}

export type ThemeId = "elegant" | "cyberpunk" | "matrix" | "vaporwave" | "candy" | "classic";

export interface GameTheme {
  id: ThemeId;
  name: string;
  bgClass: string;
  boardBg: string;
  gridColor: string;
  primaryAccent: string;
  secondaryAccent: string;
}

export interface FoodItem {
  position: Position;
  type: "standard" | "gold" | "speed" | "shield" | "freeze" | "shrink";
  colorClass: string;
  pointValue: number;
  modActive?: boolean;
}

export interface RivalSnake {
  body: Position[];
  direction: Direction;
  alive: boolean;
  colorClass: string;
  respawnTimer: number; // in seconds
}

export interface CampaignLevel {
  id: number;
  title: string;
  subtitle: string;
  targetScore: number;
  timeLimit?: number; // duration in seconds
  rivalActive: boolean;
  hasWalls: boolean;
  presetObstacles: Position[];
  description: string;
  rewardCoins: number;
}

export interface PlayerStats {
  highScore: number;
  totalGames: number;
  totalFoodEaten: number;
  totalCoins: number;
  unlockedSkins: string[];
  levelsCompleted: number[];
}

export interface GameMutation {
  active: boolean;
  speedMultiplier: number;
  scoreMultiplier: number;
  unlockedSkinId?: string;
  foodRainType?: string;
  invertControls: boolean;
  gravityActive: boolean;
  themeId?: ThemeId;
  announcement: string;
  promptText: string;
  durationLeft: number; // in seconds, or -1 for permanent until reset
}

export interface CommentState {
  text: string;
  speaker: "slyther" | "rival" | "audience";
  vibe: "snarky" | "happy" | "cheering" | "shocked" | "coaxing";
  timestamp: number;
}
