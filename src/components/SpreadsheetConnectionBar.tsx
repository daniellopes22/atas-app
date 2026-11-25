/**
 * @fileoverview Barra de status da conexão ativa com Google Sheets ou Excel Online.
 *
 * @module components/SpreadsheetConnectionBar
 */
'use client';

import { ExternalLink, Settings, CheckCircle } from 'lucide-react';

/** Propriedades de {@link SpreadsheetConnectionBar} */
interface SpreadsheetConnectionBarProps {
  /** Planilha atualmente conectada ou `null` quando desconectada */
  connectedSpreadsheet: {
    id: string;
    name: string;
    provider: 'google' | 'microsoft';
  } | null;
  /** Abre o modal {@link SpreadsheetPicker} para escolher uma planilha */
  onConnect: () => void;
  /** Remove o vínculo com a planilha atual */
  onDisconnect: () => void;
  /** Abre a planilha conectada em nova aba no navegador */
  onOpenSpreadsheet: () => void;
  /** Provedor autenticado na sessão atual */
  provider?: 'google' | 'microsoft';
}

/**
 * Exibe o estado da integração em nuvem (conectada ou aguardando seleção) no topo do dashboard.
 *
 * @param {SpreadsheetConnectionBarProps} props
 * @returns {JSX.Element}
 */
export default function SpreadsheetConnectionBar({
  connectedSpreadsheet,
  onConnect,
  onDisconnect,
  onOpenSpreadsheet,
  provider = 'google',
}: SpreadsheetConnectionBarProps) {
  const providerIcon = provider === 'google' ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-7 10a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1zm0-6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
    </svg>
  );

  const providerName = provider === 'google' ? 'Google Sheets' : 'Excel Online';

  if (connectedSpreadsheet) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-green-200">
              <span className="text-green-700 font-medium">{providerIcon}</span>
              <span className="text-green-800 font-medium truncate max-w-xs">{connectedSpreadsheet.name}</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Conectado ao {providerName}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <button
              onClick={onOpenSpreadsheet}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-800 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Planilha
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              Trocar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-700 font-medium">{providerIcon}</span>
            <h2 className="text-lg font-semibold text-gray-900">Bem-vindo à Pesquisa de Atas RP</h2>
          </div>
          <p className="text-gray-600 mb-4 max-w-2xl">
            Pesquise atas de registro de preços no Portal de Compras do Governo Federal e envie os resultados direto para sua planilha do <strong>{providerName}</strong>.
          </p>
          
          <div className="bg-white rounded-lg border border-blue-200 p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Pesquise</span> – Use PDM, CATMAT, palavra-chave ou filtros avançados
            </h3>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Marque</span> – Selecione os itens com melhor preço e saldo de carona
            </h3>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Envie</span> – Um clique para gravar na sua planilha conectada
            </h3>
          </div>
        </div>
        
        <div className="sm:ml-8">
          <button
            onClick={onConnect}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-medium text-base flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Conectar Minha Planilha</span>
          </button>
          <p className="text-center sm:text-left text-sm text-gray-500 mt-2">
            Suporta Google Sheets e Excel Online (OneDrive/SharePoint)
          </p>
        </div>
      </div>
    </div>
  );
}