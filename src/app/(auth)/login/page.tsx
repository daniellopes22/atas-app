'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Monitor } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = (provider: 'google' | 'azure-ad') => {
    setIsLoading(provider);
    signIn(provider, { callbackUrl: '/buscar' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Atas RP</h1>
            <p className="text-gray-600 mt-1">Consulta ao Compras.gov.br com integração ao Google Sheets e Excel Online</p>
          </div>

          {/* Botões de login */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Continuar com Google</span>
              {isLoading === 'google' && <span className="animate-spin">⏳</span>}
            </button>

            {/* Microsoft */}
            <button
              onClick={() => handleSignIn('azure-ad')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Monitor className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-gray-700">Continuar com Microsoft</span>
              {isLoading === 'azure-ad' && <span className="animate-spin">⏳</span>}
            </button>
          </div>

          {/* Informações */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">Como funciona</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Faça login com sua conta institucional (Google ou Microsoft)</li>
              <li>• Selecione sua planilha no Google Drive ou OneDrive/SharePoint</li>
              <li>• Pesquise atas por PDM, CATMAT, palavra-chave, esfera, etc.</li>
              <li>• Marque os itens desejados e clique em &quot;Incluir na Planilha&quot;</li>
              <li>• Os dados são inseridos preservando todas as fórmulas originais</li>
            </ul>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Dados fornecidos pela API de Dados Abertos do Compras.gov.br
          </p>
        </div>
      </div>
    </div>
  );
}