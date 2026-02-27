import express from "express";
import { createServer as createViteServer } from "vite";
import proxyHandler from "./api/proxy.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.all("/api/proxy", async (req, res) => {
    // Vercel serverless functions expect req.query to be populated
    // Express does this automatically, but let's ensure it's passed correctly
    await proxyHandler(req, res);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // En production (Vercel), ce fichier n'est pas utilisé, 
    // Vercel gère le routage vers /api/proxy.js et sert les fichiers statiques
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
