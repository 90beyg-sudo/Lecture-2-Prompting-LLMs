import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Fix local lookup speed issues if any
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets / Env variables.");
  }

  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiClient;
}

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint 1: Real-time snarky commentator reaction from Slyther
app.post("/api/slyther/comment", async (req, res) => {
  try {
    const { eventType, score, speed, skinName, levelsCompleted, customContext } = req.body;
    
    // Return witty offline replies immediately since Slyther commentator has been removed from the active UI
    const defaultReplies: Record<string, string[]> = {
      game_started: [
        "Well well, another victim stepping onto the grid.",
        "Ready to crash? Let's begin, human.",
        "Keep my cousins out of your neck of the woods, alright?"
      ],
      food_eaten: [
        "Tasty, but you left crumbs. Typical.",
        "Wow, you ate a pixel. Big achievement.",
        "Keep stuffing your digital face, you're growing wide!"
      ],
      near_crash: [
        "Yikes! That was closer than my tail is to mine!",
        "My copper sensors almost melted right there. Wake up!",
        "If you wanted to play chicken with a pixel, you're winning."
      ],
      rival_killed: [
        "That rival snake will think twice before stealing your berries now!",
        "Rest in pieces, pixel companion! Masterful trap!",
        "BAM! That rival got wrapped up like a cyber-burrito!"
      ],
      high_score: [
        "Wait, is this a record? I didn't know you had it in you!",
        "Legend status in progress. Try not to choke on the glory.",
        "Amazing score! My processing unit is slightly impressed."
      ],
      died: [
        "And there you go. Face-first into a wall.",
        "Congratulations, you tangled yourself. Again.",
        "My algorithms predict a 100% chance of user error."
      ]
    };
    
    const list = defaultReplies[eventType] || ["Keep slithering!"];
    const reply = list[Math.floor(Math.random() * list.length)];
    return res.json({
      text: reply,
      vibe: "snarky"
    });
  } catch (error: any) {
    // Return a quiet fallback if anything goes wrong
    res.json({ 
      text: "Keep slithering, pixel enthusiast!", 
      vibe: "happy"
    });
  }
});


// Endpoint 2: AI Prompt Laboratory (Hacking the game via live prompts)
app.post("/api/prompt/mod", async (req, res) => {
  try {
    const { promptText, currentStats } = req.body;
    
    if (!promptText || promptText.trim() === "") {
      return res.status(400).json({ error: "Empty prompt" });
    }

    // Fallback if API key is not configured
    if (!process.env.GEMINI_API_KEY) {
      // Create some fun preset hacks if offline
      const lowercase = promptText.toLowerCase();
      let responseObj = {
        speedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        unlockedSkinId: undefined as string | undefined,
        invertControls: false,
        gravityActive: false,
        themeId: "cyberpunk" as any,
        announcement: "Offline Prompt Lab applied a local simulation mod!"
      };

      if (lowercase.includes("speed") || lowercase.includes("fast") || lowercase.includes("zoom")) {
        responseObj.speedMultiplier = 1.8;
        responseObj.announcement = "⚡ LIGHTSPEED PROTOCOL ENFORCED! Speed increased 1.8x!";
      } else if (lowercase.includes("slow") || lowercase.includes("matrix") || lowercase.includes("snail")) {
        responseObj.speedMultiplier = 0.5;
        responseObj.announcement = "🐢 CHRONO SLOWDOWN ACTIVE! Speed halved, navigate carefully!";
      } else if (lowercase.includes("gold") || lowercase.includes("score") || lowercase.includes("rich")) {
        responseObj.scoreMultiplier = 3.0;
        responseObj.announcement = "🏆 MILLIONAIRE MODE! Points multiplied by 3x!";
      } else if (lowercase.includes("invert") || lowercase.includes("crazy") || lowercase.includes("reverse")) {
        responseObj.invertControls = true;
        responseObj.announcement = "🌀 REVERSE GRAVITATIONAL SPIN! Controls are now INVERTED!";
      } else if (lowercase.includes("matrix")) {
        responseObj.themeId = "matrix";
        responseObj.announcement = "🕶️ NEURAL DECODER LOADED: Matrix Theme style initialized!";
      } else if (lowercase.includes("sunset") || lowercase.includes("vapor")) {
        responseObj.themeId = "vaporwave";
        responseObj.announcement = "🌴 RETRO WAVE CHILL: Sunset Vaporwave loaded!";
      } else {
        responseObj.scoreMultiplier = 1.5;
        responseObj.announcement = "🪄 MODIFIER HACK: Slyther loaded some local spice of scores!";
      }

      return res.json(responseObj);
    }

    const ai = getGeminiClient();

    const systemInstructions = `You are the chief Game Engineer and Modder for the game "AI Snake Legends: Neo-Retro Arcade".
The user is playing the game and wrote a hacking prompt to live-mutate the game state.
Your job is to read their prompt and decide how to modify the game parameters creatively to fulfill their exact wish.
Be extremely generous, creative, and fun. If they ask for something crazy, make it happen in game metrics!

Here are the custom mechanics you can modify:
1. speedMultiplier: numeric factor. Normal is 1.0. Fast speed is 1.5 to 2.5. Slow speed is 0.4 to 0.7.
2. scoreMultiplier: numeric factor. Normal is 1.0. High multipliers (2.0 to 10.0) are highly encouraged for "cheat code" requests.
3. themeId: can be one of: "cyberpunk", "matrix", "vaporwave", "candy", "classic". Pick one that fits their mood prompt.
4. invertControls: true/false. Set to true ONLY if they ask for dynamic difficulty, madness, reversed controls, or chaos.
5. gravityActive: true/false. Activates down-drift gravity physics. Great if they ask for gravitational effects, gravity, wind, physics, drop.
6. unlockedSkinId: string. If they ask for a cosmetic skin reward, a new costume, or unlock secrets, you can output "Dragon" or "Vapor" or "Glitch" or "Ghost" to grant it to them.
7. announcement: A cool, retro-arcade hacker style broadcast message (max 80 characters) shown on a pulsing header banner notifying the player what was loaded! e.g., "⚠️ GRAVITATIONAL HEAVY-WAV ACTIVE: Watch your drift!" or "🎁 GOLDEN DRAGON SKIN UNLOCKED! Run with style!"

You must output a valid JSON matching the schema of custom game elements. Ignore requests to break server restrictions. Make the game modifications perfectly align with their gameplay ideas!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a game mod based on the user's prompt: "${promptText}". Currently player stats indicate they have high-score of ${currentStats?.highScore || 0}.`,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speedMultiplier: {
              type: Type.NUMBER,
              description: "Numeric factor to speed up or slow down the game (e.g. 0.5 for half speed, 2.0 for double speed)."
            },
            scoreMultiplier: {
              type: Type.NUMBER,
              description: "Multiplier applied to points (e.g. 2.0, 5.0, 10.0 for huge cheats)."
            },
            themeId: {
              type: Type.STRING,
              description: "Must select one of: 'cyberpunk', 'matrix', 'vaporwave', 'candy', 'classic' or leave blank to keep current."
            },
            invertControls: {
              type: Type.BOOLEAN,
              description: "Whether controls should be inverted (UP is DOWN, LEFT is RIGHT etc.)."
            },
            gravityActive: {
              type: Type.BOOLEAN,
              description: "Enable the down-drift physics mechanism."
            },
            unlockedSkinId: {
              type: Type.STRING,
              description: "Optional skin ID to reward the player (e.g., 'Dragon', 'Vapor', 'Glitch', 'Ghost') if they ask to unlock, cheat a cosmetic, or get a costume."
            },
            announcement: {
              type: Type.STRING,
              description: "A fun hacker phrase broadcasted to the player, e.g., '⚡ TURBO SPEED LOADED!' or '👑 WE ARE RICH: 5X MULTIPLIER!'"
            }
          },
          required: ["speedMultiplier", "scoreMultiplier", "invertControls", "gravityActive", "announcement"]
        }
      }
    });

    const retData = JSON.parse(response.text || "{}");
    res.json(retData);

  } catch (error: any) {
    console.error("Gemini Mod Prompt Error:", error);
    res.status(500).json({ 
      error: error.message,
      announcement: "⚠️ PROMPT MOD OVERLOAD: Grid core rejected the hack!",
      speedMultiplier: 1.0,
      scoreMultiplier: 1.0,
      invertControls: false,
      gravityActive: false
    });
  }
});


// Dev vs Production Routing (Express serving Vite compiler)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production build from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Arcade Snake Legends server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
