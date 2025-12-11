import React, { useState } from 'react';
import { Search, Loader2, XCircle, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';

export const ProxyTester: React.FC = () => {
  // Fonction utilitaire pour récupérer le secret de l'environnement de manière sécurisée
  // Cela permet de pré-remplir le champ si la variable est exposée au frontend
  const getInitialSecret = () => {
    try {
      // Support pour Vite (import.meta.env)
      // Cast import.meta to any to avoid TypeScript errors if env is not defined in ImportMeta
      const meta = import.meta as any;
      if (typeof meta !== 'undefined' && meta.env) {
        if (meta.env.VITE_PROXY_SECRET) return meta.env.VITE_PROXY_SECRET;
        if (meta.env.PROXY_SECRET) return meta.env.PROXY_SECRET;
      }

      // Support pour Node/Next.js/CRA (process.env)
      if (typeof process !== 'undefined' && process.env) {
        return process.env.PROXY_SECRET || 
               process.env.NEXT_PUBLIC_PROXY_SECRET || 
               process.env.REACT_APP_PROXY_SECRET || 
               process.env.VITE_PROXY_SECRET ||
               '';
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState(getInitialSecret()); 
  const [showSecret, setShowSecret] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);

    try {
      const proxyEndpoint = `https://wors-proxy-seven-alpha.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;
      
      const res = await fetch(proxyEndpoint, {
        method: 'GET',
        headers: {
          // On envoie le secret dans les headers personnalisés
          // Si le champ est vide, on utilise la valeur par défaut du serveur pour faciliter le test
          'x-proxy-secret': secret || 'change-me-in-env-vars'
        }
      });
      setStatus(res.status);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erreur HTTP: ${res.status}`);
      }

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
          
          {/* Input URL - Full Width */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Entrez une URL externe (ex: https://jsonplaceholder.typicode.com/todos/1)"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:placeholder-transparent selection:bg-indigo-500 selection:text-white sm:text-sm transition-all"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Input Secret */}
            <div className="relative group flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              </div>
              <input
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Secret (défaut: change-me-in-env-vars)"
                className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:placeholder-transparent selection:bg-amber-500 selection:text-white sm:text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Chargement...
                </>
              ) : (
                'Tester le Proxy'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="p-6 bg-slate-900 min-h-[300px] font-mono text-sm overflow-auto">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-4 mb-4 flex items-start text-red-200">
            <XCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold mb-1">Erreur de la requête</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {status && !error && (
          <div className="flex items-center space-x-2 text-emerald-400 mb-4 text-xs uppercase tracking-wider font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>Status: {status}</span>
          </div>
        )}

        {response ? (
          <pre className="text-slate-300 whitespace-pre-wrap break-all selection:bg-indigo-500 selection:text-white">
            {response}
          </pre>
        ) : (
          !error && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p>Entrez une URL ci-dessus pour voir le contenu via le proxy.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};