import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // In-memory relational state cache for public sharing URLs
  const sharedReportsCache = new Map<string, { analysisResult: any; chatText: string }>();

  // API Route to register and persist a shared report structure
  app.post("/api/share", (req, res) => {
    try {
      const { analysisResult, chatText } = req.body;
      if (!analysisResult) {
        return res.status(400).json({ error: "No analysis result provided to share." });
      }

      // Generate a fast, unique, path-friendly alphanumeric key
      const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
      sharedReportsCache.set(uniqueId, { analysisResult, chatText });

      res.json({ id: uniqueId });
    } catch (err: any) {
      console.error("Share error:", err);
      res.status(500).json({ error: "Failed to generate share link." });
    }
  });

  // API Route to retrieve a previously shared report state
  app.get("/api/share/:id", (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "No ID provided" });
      }
      const report = sharedReportsCache.get(id.toUpperCase());
      if (!report) {
        return res.status(404).json({ error: "Shared forensic report not found or has expired." });
      }
      res.json(report);
    } catch (err: any) {
      console.error("Retrieve error:", err);
      res.status(500).json({ error: "Failed to retrieve shared report." });
    }
  });

  // API Route FIRST for Gemini-powered analytical judging
  app.post("/api/analyze", async (req, res) => {
    try {
      const { chatText } = req.body;
      if (!chatText) {
        return res.status(400).json({ error: "No chat text provided." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it via the Settings > Secrets panel in AI Studio." 
        });
      }

      // Initialize Google Gen AI client with appropriate telemetry header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Clean up the raw chat logs from typical WhatsApp system clutter
      const originalLines = chatText.split("\n")
        .map(l => l.trim())
        .filter(l => {
          if (l.length === 0) return false;
          const lower = l.toLowerCase();
          if (lower.includes("end-to-end encrypted")) return false;
          if (lower.includes("media omitted")) return false;
          if (lower.includes("message was deleted")) return false;
          if (lower.includes("joined using")) return false;
          if (lower.includes("created this group")) return false;
          if (lower.includes("changed the group")) return false;
          if (lower.includes("file omitted")) return false;
          return true;
        });

      // Slice to the last 150 clean lines to ensure super-fast context matching and keep the tokens compact
      let processedChatText = chatText;
      if (originalLines.length > 150) {
        processedChatText = originalLines.slice(-150).join("\n");
      } else {
        processedChatText = originalLines.join("\n");
      }

      const systemInstruction = `You are ChatJudge — an AI that analyzes WhatsApp conversations and gives brutally honest, logical, evidence-backed personality reports.

Analyze the chat received. For every unique person, score these 8 traits from 0 to 100 on their personality parameters:
1. toxicity — insults, passive aggression, demeaning language
2. ego — never apologizes, always thinks they're right, self-centered behavior
3. attitude — rudeness, dismissiveness, condescending tone
4. love — affection, care, concern, emotional support
5. hate — anger, resentment, blame, frustration
6. humor — positive jokes, playfulness, making others laugh
7. dominance — controls conversation, redirects topics, speaks most
8. coldness — dry one-word replies, late responses noted, emotional unavailability

Rules:
- LIMIT ANALYSIS STRICTLY TO THE TOP 2 (OR AT ABSOLUTE MAXIMUM 3) MOST ACTIVE, MAIN SPEAKERS. Ignore minor participants or numbers that only text once.
- Base scores ONLY on actual messages in the chat.
- Be logical, not random.
- Scores should reflect the overall pattern, not just one message.
- If someone never apologizes across many messages, ego should be high.
- If someone uses caring words consistently, love should be high.

For evidence, pick exactly the 1-2 most representative actual quotes per person that best prove their dominant traits.

Give each person a creative, funny verdict label (max 6 words) that captures their personality.

And write a highly savage, brutal, hilarious roast (max 2-3 sentences or 50 words) targeting their conversational toxicity, ego, attitude, or coldness. The roast MUST be in active, engaging, highly modern Hinglish/English style (e.g., using terms like 'bhai', 'attitude', 'bhav', 'footmat', etc.) that absolutely demolishes their behavior with savage metaphors and observations based on their exact messages.

Identify individual Red Flags (🚩) and Green Flags (💚) for each person based on their specific chat lines:
- redFlags: exactly 2 negative toxic attributes, problematic habits, defensive mechanisms, gaslighting attempts, bad vibes, or passive-aggressive words.
- greenFlags: exactly 1 to 2 positive attributes, caring details, apologies, efforts to plan, patience, or warm jokes that soften the tension.

Provide a definitive and deeply logical judgment on **who should apologize first** (or both, or neither) and explain the reasoning behind it with concrete behavioral evidence from their messages (e.g., who was defensive, who attempted to repair, who escalates conflict).

For overall relationship health:
- Score it 0-100
- Label: Toxic / Complicated / Manageable / Healthy
- Write 2-3 sentences explaining the dynamic

Provide relationship improvement advice based on the chat's context:
- actionableSteps: exactly 3 hyper-specific steps to improve their communication, lower toxicity scores, and resolve conflict. Feel free to use modern Hinglish/English.
- coupleChallenge: A creative, playful custom 48-hour challenge (e.g. 'The 48-hour No-Blaming Pact' or similar) to start building progress.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Chat to analyze:\n${processedChatText}`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW
          },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              persons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    verdict: { type: Type.STRING },
                    roast: { type: Type.STRING },
                    redFlags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    greenFlags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    scores: {
                      type: Type.OBJECT,
                      properties: {
                        toxicity: { type: Type.INTEGER },
                        ego: { type: Type.INTEGER },
                        attitude: { type: Type.INTEGER },
                        love: { type: Type.INTEGER },
                        hate: { type: Type.INTEGER },
                        humor: { type: Type.INTEGER },
                        dominance: { type: Type.INTEGER },
                        coldness: { type: Type.INTEGER }
                      },
                      required: ["toxicity", "ego", "attitude", "love", "hate", "humor", "dominance", "coldness"]
                    },
                    evidence: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          trait: { type: Type.STRING },
                          quote: { type: Type.STRING },
                          explanation: { type: Type.STRING }
                        },
                        required: ["trait", "quote", "explanation"]
                      }
                    }
                  },
                  required: ["name", "verdict", "scores", "evidence", "roast", "redFlags", "greenFlags"]
                }
              },
              relationship: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  label: { type: Type.STRING },
                  summary: { type: Type.STRING }
                },
                required: ["score", "label", "summary"]
              },
              apologyVerdict: {
                type: Type.OBJECT,
                properties: {
                  shouldApologizeFirst: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["shouldApologizeFirst", "reasoning"]
              },
              relationshipAdvice: {
                type: Type.OBJECT,
                properties: {
                  actionableSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                    },
                  coupleChallenge: { type: Type.STRING }
                },
                required: ["actionableSteps", "coupleChallenge"]
              }
            },
            required: ["persons", "relationship", "apologyVerdict", "relationshipAdvice"]
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Empty response received from GenAI backend.");
      }

      res.json(JSON.parse(rawText));
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during raw conversation analysis." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
