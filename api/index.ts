import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const app = express();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBPczFq0evqKAWc9G-NN3YJeEsbllnkeHfOzrlRPoMfI8aucROYj3gYrYGEZS3QSjrrA/exec";

app.use(express.json());

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

// Vite middleware for development - only used locally or in AIS dev mode
if (process.env.NODE_ENV !== "production") {
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  })();
} else {
  // Production static file serving
  // On Vercel, process.cwd() is the root, but we should be safe with multiple paths
  const possiblePaths = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, '../dist'),
  ];
  
  let distPath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }
  
  app.use(express.static(distPath));
  
  // Catch-all route for SPA fallback
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) return next();
    
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error("Index file not found in " + distPath);
      res.status(404).send("Application files not found. Please ensure the build completed successfully.");
    }
  });
}

// Port listener - redundant on Vercel but needed for local/AIS
const PORT = 3000;
const portToListen = process.env.PORT ? parseInt(process.env.PORT) : PORT;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(portToListen, "0.0.0.0", () => {
    console.log(`Server running on port ${portToListen} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export default app;
