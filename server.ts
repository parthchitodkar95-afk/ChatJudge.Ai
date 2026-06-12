import express from "express";
import path from "path";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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
2. ego — never apologizes, always thinks they're right
3. attitude — rudeness, condescension
4. love — care, concern, emotional support
5. hate — anger, blame, frustration
6. humor — playfulness, positive jokes
7. dominance — controls topic, speaks most
8. coldness — dry replies, late responses

Rules:
- LIMIT ANALYSIS STRICTLY TO THE TOP 2 MOST ACTIVE, MAIN SPEAKERS.
- Keep all texts EXTREMELY short, punchy, and direct to ensure fast generation times.
- Be highly savage, brutal, and hilarious in modern Eng/Hinglish style.
- Each roast must be strictly ONE compact, ultra-savage sentence (max 20 words) that absolutely demolishes them.
- Each Red/Green Flag description must be ultra-short (max 4-5 words).
- Pick exactly ONE short direct quote per person for evidence quote.
- Apology verdict reasoning must be under 2 short sentences.
- Relationship explanation must be under 2 short sentences.
- Couple challenge and actionable steps must be ultra-short (max 10 words each).`;

      const modelCandidates = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let lastError: any = null;
      let generateResponse: any = null;

      for (const currentModel of modelCandidates) {
        let attempts = 0;
        const maxAttempts = 2; // Try up to twice for each model
        while (attempts < maxAttempts) {
          try {
            console.log(`Attempting analysis with model: ${currentModel} (attempt ${attempts + 1}/${maxAttempts})`);
            generateResponse = await ai.models.generateContent({
              model: currentModel,
              contents: `Chat to analyze:\n${processedChatText}`,
              config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.MINIMAL
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
            break; // Success! Exit the attempts loop for this model.
          } catch (err: any) {
            attempts++;
            lastError = err;
            console.warn(`Model ${currentModel} analysis attempt ${attempts} failed:`, err.message || err);
            
            // Wait for backoff if we have remaining attempts for this model
            if (attempts < maxAttempts) {
              const backoffDelay = attempts * 1500;
              console.log(`Waiting ${backoffDelay}ms before retry on ${currentModel}...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
        }
        
        if (generateResponse) {
          console.log(`Analysis successfully completed using model: ${currentModel}`);
          break; // Exit the candidates loop since we got a valid response
        }
      }

      if (!generateResponse) {
        throw new Error(lastError?.message || "All fallback models returned transient errors due to peak demand. Please wait a moment and try again.");
      }

      const rawText = generateResponse.text;
      if (!rawText) {
        throw new Error("Empty response received from GenAI backend.");
      }

      res.json(JSON.parse(rawText));
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during raw conversation analysis." });
    }
  });

// Export the app for Vercel/Serverless deployment
export default app;

async function startListening() {
  if (process.env.VERCEL) {
    return; // Vercel is serverless, do not bind app.listen
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startListening().catch((err) => {
  console.error("Server listen startup error:", err);
});
