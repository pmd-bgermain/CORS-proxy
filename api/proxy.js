/**
 * Serverless Function: Secure CORS Proxy
 * 
 * Ce fichier doit être placé dans le dossier `api/` pour être détecté par Vercel.
 * Il agit comme un middleware pour récupérer des ressources externes en contournant les restrictions CORS du navigateur.
 * 
 * SÉCURITÉ :
 * 1. Vérification de l'origine (CORS).
 * 2. Vérification d'un secret partagé (API Key) via le header 'x-proxy-secret'.
 */

export default async function handler(req, res) {
  // --- CONFIGURATION DU SECRET ---
  
  // Dans Vercel, définissez une variable d'environnement PROXY_SECRET.
  // Valeur de repli pour le test immédiat (A CHANGER EN PRODUCTION).
  const API_SECRET = process.env.PROXY_SECRET || 'change-me-in-env-vars';

  // --- 1. CONFIGURATION DE SÉCURITÉ (ORIGINES AUTORISÉES) ---
  
  const origin = req.headers.origin;

  // Liste des origines explicitement autorisées
  const allowedOrigins = [
    'http://localhost:3000',      // Développement local (Create React App)
    'http://localhost:5173',      // Développement local (Vite)
    'https://aistudio.google.com' // Google AI Studio
  ];

  const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.endsWith('.vercel.app')) return true;
    return false;
  };

  // --- 2. VÉRIFICATION DE L'ORIGINE ET DU SECRET ---

  // Vérification de base de l'origine (CORS Layer)
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid Origin' });
  }

  // --- 3. GESTION DES PREFLIGHTS CORS (OPTIONS) ---
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    // On autorise explicitement notre header personnalisé 'x-proxy-secret'
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-proxy-secret');
    return res.status(200).end();
  }

  // Vérification de la méthode
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 4. VÉRIFICATION DU SECRET (AUTHENTICATION LAYER) ---

  const clientSecret = req.headers['x-proxy-secret'];

  // C'est ici que la vraie sécurité opère. Même si l'origine est spoofée ou partagée,
  // l'attaquant ne connait pas le secret (sauf s'il a accès à votre code source).
  if (clientSecret !== API_SECRET) {
    // Petit délai pour atténuer les attaques par force brute (timing attacks)
    await new Promise(resolve => setTimeout(resolve, 200));
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing Proxy Secret' });
  }

  // --- 5. EXÉCUTION DU PROXY ---

  const { url: targetUrl } = req.query;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    
    const response = await fetch(parsedUrl.toString());
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- 6. PRÉPARATION DE LA RÉPONSE ---

    res.setHeader('Access-Control-Allow-Origin', origin);
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    } else {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    }

    res.status(response.status).send(buffer);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: 'Failed to fetch the target URL.',
      details: error.message 
    });
  }
}