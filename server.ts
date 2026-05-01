import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini as fallback or for search grounding
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize Claude clients if keys are present
const getClaudeClients = () => {
  const keys = [
    process.env.CLAUDE_API_KEY_1,
    process.env.CLAUDE_API_KEY_2,
    process.env.CLAUDE_API_KEY_3
  ].filter(Boolean);
  
  return keys.map(key => new Anthropic({ apiKey: key }));
};

// The "Multi-Agent" synthesis logic
async function generateDiscordCode(prompt: string, language: string = "javascript") {
  const claudeClients = getClaudeClients();
  
  // 1. Agent 1: Research & Plan
  // 2. Agent 2: Drafting
  // 3. Agent 3: Review & Refinement
  
  let currentContext = `User Request: ${prompt}\nLanguage: ${language}`;
  
  // If we have 3 keys, we do 3 distinct steps with potentially different models/clients
  // If we don't have Claude keys, we'll use Gemini to simulate the multi-step process
  
  if (claudeClients.length >= 3) {
    // Step 1: Architecting (Agent 1)
    const architectResponse = await claudeClients[0].messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4096,
      messages: [{ role: "user", content: `Architect a Discord bot project based on: ${currentContext}. Define file structure and logic.` }],
    });
    const plan = (architectResponse.content[0] as any).text;

    // Step 2: Implementation (Agent 2)
    const coderResponse = await claudeClients[1].messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 8192,
      messages: [{ role: "user", content: `Using this plan: ${plan}\n\nImplement all files. Format as JSON: { "files": [{ "name": "...", "content": "..." }] }` }],
    });
    const draft = (coderResponse.content[0] as any).text;

    // Step 3: Review (Agent 3)
    const reviewerResponse = await claudeClients[2].messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 8192,
      messages: [{ role: "user", content: `Review and fix any errors in this implementation: ${draft}\n\nReturn EXACTLY the final JSON.` }],
    });
    const final = (reviewerResponse.content[0] as any).text;
    
    try {
      const match = final.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : final);
    } catch (e) {
      return { files: [{ name: "error.txt", content: "Failed to parse final output." }], raw: final };
    }
  }

  // Fallback: Multi-step Gemini Logic
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent({
    contents: [
      { 
        role: "user", 
        parts: [{ text: `
          (MULTI-AGENT SIMULATION)
          Goal: Create a perfectly working Discord bot.
          Step 1: Research latest documentation.
          Step 2: Generate modular code.
          Step 3: Self-verify for errors.
          
          Request: ${prompt} in ${language}
          
          Return as JSON: { "files": [{ "name": "...", "content": "..." }] }
        ` }] 
      }
    ],
  });

  const responseText = result.response.text();
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch (e) {
    return { error: "Failed to parse simulated output", raw: responseText };
  }
}

app.post("/api/generate", async (req, res) => {
  const { prompt, language } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const codeData = await generateDiscordCode(prompt, language);
    res.json(codeData);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  startServer();
}
