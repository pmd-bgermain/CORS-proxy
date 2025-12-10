# CORS Proxy & Tester

Ce projet est une application "full-stack" légère conçue pour Vercel. Elle combine :
1.  **Une interface React** pour tester des requêtes HTTP.
2.  **Une fonction Serverless (`api/proxy.js`)** agissant comme un proxy sécurisé pour contourner les erreurs CORS (Cross-Origin Resource Sharing).

## 📂 Structure du projet

*   **Frontend (React)** : `index.html`, `index.tsx`, `App.tsx` et `components/`. L'interface utilisateur pour tester le proxy.
*   **Backend (Serverless)** : `api/proxy.js`. Ce fichier est automatiquement détecté par Vercel et transformé en endpoint API.

---

## 🚀 Déploiement sur Vercel

C'est la méthode recommandée. Vercel détectera automatiquement la partie React et la partie API Serverless.

### 1. Pré-requis
*   Un compte [Vercel](https://vercel.com).
*   Le code source poussé sur un dépôt Git (GitHub, GitLab ou Bitbucket).

### 2. Importation
1.  Allez sur votre tableau de bord Vercel.
2.  Cliquez sur **"Add New..."** > **"Project"**.
3.  Sélectionnez votre dépôt Git.

### 3. Configuration des variables d'environnement (Important)
Pour sécuriser votre proxy, vous devez définir un secret. Sans cela, n'importe qui pourrait utiliser votre proxy pour masquer son trafic.

Dans la section **Environment Variables** lors de l'import (ou plus tard dans Settings > Environment Variables) :

*   **Key** : `PROXY_SECRET`
*   **Value** : Une chaîne aléatoire complexe (ex: `ma-super-cle-secrete-12345`)

*Pour le frontend (afin que le champ secret soit pré-rempli pour vous lors des tests)* :
*   **Key** : `VITE_PROXY_SECRET` (si vous utilisez Vite) ou `REACT_APP_PROXY_SECRET` (Create React App)
*   **Value** : La même valeur que ci-dessus.

### 4. Déployer
Cliquez sur **Deploy**. Vercel va construire le frontend et déployer la fonction serverless.

---

## 🛠 Développement Local

Pour tester l'API et le Frontend simultanément en local, il est recommandé d'utiliser [Vercel CLI](https://vercel.com/docs/cli).

1.  **Installer Vercel CLI** :
    ```bash
    npm i -g vercel
    ```

2.  **Lancer le projet** :
    À la racine du projet, exécutez :
    ```bash
    vercel dev
    ```
    
    Cela démarrera un serveur local (généralement sur `http://localhost:3000`) qui gère à la fois le rechargement à chaud de React et l'exécution de `api/proxy.js`.

---

## 🔐 Sécurité

Ce proxy implémente deux niveaux de sécurité dans `api/proxy.js` :

1.  **Whitelist d'Origine** : Le proxy vérifie l'en-tête `Origin` de la requête. Par défaut, il accepte `localhost` et les domaines `.vercel.app`.
2.  **Clé Secrète (API Key)** : Le proxy exige un en-tête HTTP spécifique :
    *   Header : `x-proxy-secret`
    *   Valeur : Doit correspondre à la variable d'environnement `PROXY_SECRET`.

### Utilisation dans votre code client

Pour utiliser ce proxy depuis votre propre application :

```javascript
const targetUrl = "https://api.externe.com/data";
const proxyUrl = "/api/proxy"; // Ou l'URL complète de votre déploiement Vercel

const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(targetUrl)}`, {
  headers: {
    // Ce secret doit être configuré côté serveur (Vercel)
    "x-proxy-secret": "votre-secret-configuré" 
  }
});

const data = await response.json();
```
