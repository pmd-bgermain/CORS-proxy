import React, { useState } from 'react';
import { Search, Loader2, XCircle, CheckCircle, Key, Eye, EyeOff, Info, AlertTriangle } from 'lucide-react';

// URL du proxy codée en dur
const PROXY_BASE_URL = 'https://cors-proxy-seven-alpha.vercel.app/api/proxy';

export const ProxyTester: React.FC = () => {
  // Fonction utilitaire pour récupérer le secret de l'environnement
  const getInitialSecret = () => {
    try {
      const meta = import.meta as any;
      if (typeof meta !== 'undefined' && meta.env) {
        if (meta.env.VITE_PROXY_SECRET) return meta.env.VITE_PROXY_SECRET;
        if (meta.env.PROXY_SECRET) return meta.env.PROXY_SECRET;
      }
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

  // État pour l'URL cible
  const [url, setUrl] = useState('');
  
  // État pour le Secret
  const [secret, setSecret] = useState(getInitialSecret()); 
  const [showSecret, setShowSecret] = useState(false);

  // États de réponse
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
      const baseUrl = PROXY_BASE_URL.split('?')[0]; 
      const proxyEndpoint = `${baseUrl}?url=${encodeURIComponent(url)}`;
      
      const res = await fetch(proxyEndpoint, {
        method: 'GET',
        headers: {
          'x-proxy-secret': secret || 'change-me-in-env-vars'
        }
      });
      
      // On capture le status HTTP
      setStatus(res.status);

      // Note : On ne throw PLUS d'erreur ici si !res.ok (ex: 404, 500).
      // On veut voir le corps de la réponse même en cas d'erreur API distante.

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err: any) {
      // Ce bloc catch ne se déclenche que pour les erreurs RÉSEAU (CORS, Offline, DNS, etc.)
      const currentOrigin = window.location.origin;
      const originContext = currentOrigin === 'null' 
        ? 'null (Sandbox/Iframe stricte)' 
        : currentOrigin;
        
      setError(`${err.message}\n\n[Debug Info]\nVotre Origine locale : ${originContext}\nEndpoint appelé : ${PROXY_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = status && status >= 200 && status < 300;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
          
          {/* Input URL Target */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Entrez une URL externe à tester (ex: https://jsonplaceholder.typicode.com/todos/1)"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:placeholder-transparent selection:bg-indigo-500 selection:text-white sm:text-sm transition-all"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Secret Input */}
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Clé API (Proxy Secret)"
                className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:placeholder-transparent selection:bg-indigo-500 selection:text-white sm:text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Chargement...
                </>
              ) : (
                'Envoyer la requête'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="p-6 bg-slate-900 min-h-[300px] font-mono text-sm overflow-auto relative">
        {/* Affichage des erreurs réseau critiques (CORS, etc) */}
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-4 mb-4 flex items-start text-red-200">
            <XCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="w-full">
              <h3 className="font-bold mb-1">Erreur Réseau (Network/CORS)</h3>
              <p className="whitespace-pre-wrap font-mono text-xs opacity-90">{error}</p>
              <div className="mt-3 flex items-start gap-2 text-xs text-red-300/70 bg-red-950/50 p-2 rounded">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Si l'origine est "null", cela signifie que l'app tourne dans une iframe sécurisée. 
                  Assurez-vous que le Backend autorise l'origine <code>null</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Affichage du Status HTTP (même pour les erreurs 4xx/5xx) */}
        {status !== null && !error && (
          <div className={`flex items-center space-x-2 mb-4 text-xs uppercase tracking-wider font-bold ${isSuccess ? 'text-emerald-400' : 'text-amber-500'}`}>
            {isSuccess ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>Status: {status}</span>
          </div>
        )}

        {/* Affichage de la réponse (JSON ou HTML) */}
        {response ? (
          <pre className="text-slate-300 whitespace-pre-wrap break-all selection:bg-indigo-500 selection:text-white">
            {response}
          </pre>
        ) : (
          !error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none p-6 text-center">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p>Entrez une URL ci-dessus pour voir le contenu via le proxy.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};