import express from "express";
import path from "path";
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

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // Catch-all route for SPA
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) return next();
      
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Use PORT from environment or default to 3000
  const portToListen = process.env.PORT ? parseInt(process.env.PORT) : PORT;

  app.listen(portToListen, "0.0.0.0", () => {
    console.log(`Server running on port ${portToListen} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();

export default app;
