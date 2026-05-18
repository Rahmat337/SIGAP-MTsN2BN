import express from "express";
import path from "path";
import fs from "fs";
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
  res.json({ status: "ok", mode: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
});

// Production static file serving
const distPath = path.join(process.cwd(), "dist");

if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.use(express.static(distPath));
}

// Vite middleware for development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  })();
}

// Catch-all route for SPA fallback
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) return next();
  
  // In dev mode without middleware (should not happen usually) skip
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) return next();

  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If we are on Vercel, we might need a relative path check
    const altPath = path.join(__dirname, "../dist/index.html");
    if (fs.existsSync(altPath)) {
      res.sendFile(altPath);
    } else {
      next();
    }
  }
});

// Only listen if not running on Vercel as a function
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
