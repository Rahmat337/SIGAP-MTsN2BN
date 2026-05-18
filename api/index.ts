import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Initialize Gemini (Safe initialization)
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
  }
  return ai;
};

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBPczFq0evqKAWc9G-NN3YJeEsbllnkeHfOzrlRPoMfI8aucROYj3gYrYGEZS3QSjrrA/exec";

app.use(express.json());

// API Routes
app.post("/api/action", async (req, res) => {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: "Failed to connect to Google Apps Script" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

// Middleware setup for development vs production
async function setupMiddlewares() {
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
    // SPA Fallback: Vercel usually handles this via rewrites, 
    // but this is a safety for other environments.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Only setup middlewares and listen if not running on Vercel as a function
if (!process.env.VERCEL) {
  setupMiddlewares().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
