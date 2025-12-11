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

  // Liste des origines explicitement autorisées (match exact)
  const allowedOrigins = [
    'http://localhost:3000',      // Développement local (Create React App)
    'http://localhost:5173',      // Développement local (Vite)
    'https://aistudio.google.com' // Interface principale Google AI Studio
  ];

  const isAllowedOrigin = (origin) => {
    // IMPORTANT : Les navigateurs n'envoient PAS le header 'Origin' pour les requêtes GET
    // effectuées depuis le même domaine (Same-Origin).
    if (!origin) return true;

    // 1. Match exact
    if (allowedOrigins.includes(origin)) return true;

    // 2. Match dynamique pour les déploiements Vercel
    if (origin.endsWith('.vercel.app')) return true;

    // 3. Match dynamique pour les Previews Google AI Studio / Cloud Shell
    // Exemple : https://0xhkooxgg...-h839267052.scf.usercontent.goog
    if (origin.endsWith('.scf.usercontent.goog')) return true;
    if (origin.endsWith('.googleusercontent.com')) return true;

    return false;
  };

  // --- 2. VÉRIFICATION DE L'ORIGINE ET DU SECRET ---

  // Vérification de base de l'origine (CORS Layer)
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden', message: `Invalid Origin: ${origin}` });
  }

  // --- 3. GESTION DES PREFLIGHTS CORS (OPTIONS) ---
  
  if (req.method === 'OPTIONS') {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-proxy-secret');
    return res.status(200).end();
  }

  // Vérification de la méthode
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 4. VÉRIFICATION DU SECRET (AUTHENTICATION LAYER) ---

  const clientSecret = req.headers['x-proxy-secret'];

  if (clientSecret !== API_SECRET) {
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
    
    // Fonction helper pour gérer manuellement les redirections et préserver les cookies
    // Cela corrige l'erreur "redirect count exceeded" causée par des sites qui vérifient
    // si les cookies sont activés lors d'une redirection (boucle infinie sans stockage de cookie).
    const fetchWithCookies = async (url, options, n = 0) => {
      const MAX_REDIRECTS = 10;
      if (n > MAX_REDIRECTS) throw new Error('Redirect count exceeded (custom limit)');

      // On désactive le suivi automatique (manual) pour intercepter les headers Set-Cookie
      const response = await fetch(url, { ...options, redirect: 'manual' });

      // Si c'est une redirection (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        const location = response.headers.get('location');
        const nextUrl = new URL(location, url).toString(); // Résolution relative

        // Gestion des cookies (simple concaténation)
        let currentCookies = options.headers['Cookie'] || '';
        
        // Récupération des nouveaux cookies (support Node 18+ getSetCookie ou fallback)
        let newCookies = [];
        if (typeof response.headers.getSetCookie === 'function') {
          newCookies = response.headers.getSetCookie();
        } else {
          const c = response.headers.get('set-cookie');
          if (c) newCookies = [c];
        }

        // On ajoute les nouveaux cookies à ceux existants
        newCookies.forEach(cookieStr => {
          const cookiePart = cookieStr.split(';')[0]; // On garde seulement cle=valeur
          if (cookiePart) {
            currentCookies = currentCookies ? `${currentCookies}; ${cookiePart}` : cookiePart;
          }
        });

        // Appel récursif avec les nouveaux cookies et la nouvelle URL
        return fetchWithCookies(nextUrl, {
          ...options,
          headers: {
            ...options.headers,
            'Cookie': currentCookies
          }
        }, n + 1);
      }

      return response;
    };

    // Configuration des headers pour simuler parfaitement un navigateur
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await fetchWithCookies(parsedUrl.toString(), { headers });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- 6. PRÉPARATION DE LA RÉPONSE ---

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
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
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    const errorMessage = error.cause ? error.cause.message : error.message;
    
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: 'Failed to fetch the target URL.',
      details: errorMessage
    });
  }
}