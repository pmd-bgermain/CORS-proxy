import React, { useState } from 'react';
import { ShieldCheck, Globe, AlertTriangle, ArrowRight, Code, Key } from 'lucide-react';
import { ProxyTester } from './components/ProxyTester';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center space-x-3 text-indigo-600">
            <ShieldCheck className="w-10 h-10" />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              CORS Proxy
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl">
            Cette application inclut une fonction Serverless sécurisée (<code>api/proxy.js</code>) 
            qui agit comme un proxy pour contourner les restrictions CORS.
          </p>
        </header>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2 mb-4 text-emerald-600">
              <Globe className="w-5 h-5" />
              <h2 className="font-bold text-lg">Fonctionnalités</h2>
            </div>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-1 text-emerald-500 shrink-0" />
                <span>Relai les requêtes HTTP via fetch natif Node.js</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-1 text-emerald-500 shrink-0" />
                <span>Gestion transparente des headers Content-Type</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-1 text-emerald-500 shrink-0" />
                <span>Supporte les requêtes de vos applications locales et de production</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center space-x-2 mb-4 text-amber-600">
              <Key className="w-5 h-5" />
              <h2 className="font-bold text-lg">Double Sécurité</h2>
            </div>
            <ul className="space-y-3 text-slate-600 text-sm flex-grow">
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-1 text-amber-500 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="font-semibold text-slate-900">Origine :</strong>{' '}
                  Vérifie <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">req.headers.origin</code>{' '}
                  pour bloquer les navigateurs non autorisés.
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-1 text-amber-500 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="font-semibold text-slate-900">Clé API :</strong>{' '}
                  Exige un header <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">x-proxy-secret</code>. 
                </span>
              </li>
            </ul>
            <div className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-md">
              <span className="font-semibold text-slate-700">Note :</span> Configurez la variable d'environnement <code className="font-mono bg-white px-1 border border-slate-200 rounded">PROXY_SECRET</code> dans Vercel pour sécuriser l'accès.
            </div>
          </div>
        </div>

        {/* Tester Interface */}
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Code className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-800">Testeur de Proxy</h2>
          </div>
          <ProxyTester />
        </section>

      </div>
    </div>
  );
}