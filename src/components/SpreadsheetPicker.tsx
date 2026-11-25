/**
 * @fileoverview Modal seletor de planilhas no Google Drive / OneDrive com opção de criar planilha padrão.
 *
 * @module components/SpreadsheetPicker
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileSpreadsheet, Loader2, X, CheckCircle } from 'lucide-react';

/** Propriedades de {@link SpreadsheetPicker} */
interface SpreadsheetPickerProps {
  /** Callback chamado quando o usuário confirma a seleção de uma planilha */
  onSelect: (spreadsheet: { id: string; name: string; provider: 'google' | 'microsoft'; driveId?: string }) => void;
  /** Fecha o modal */
  onClose: () => void;
  /** Provedor OAuth da sessão (`'google' | 'azure-ad'`) */
  provider: 'google' | 'azure-ad';
  /** Callback opcional para provisionar uma nova planilha padrão diretamente pelo modal */
  onCreateStandardSheet?: (provider: 'google' | 'microsoft' | 'download', title: string) => void;
}

/**
 * Modal que lista planilhas disponíveis via `/api/planilha/listar` e permite conectá-las ao fluxo de exportação.
 *
 * @param {SpreadsheetPickerProps} props
 * @returns {JSX.Element}
 */
export default function SpreadsheetPicker({ onSelect, onClose, provider, onCreateStandardSheet }: SpreadsheetPickerProps) {
  const { data: session, status } = useSession();
  const [spreadsheets, setSpreadsheets] = useState<Array<{ id: string; name: string; driveId?: string; provider?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedProvider: 'google' | 'microsoft' = provider === 'google' ? 'google' : 'microsoft';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setTimeout(() => {
        setError('Faça login para listar suas planilhas.');
        setIsLoading(false);
      }, 0);
      return;
    }

    let cancelled = false;
    const loadSpreadsheets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/planilha/listar?provider=${normalizedProvider}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar planilhas');
        }

        const data = (await response.json()) as {
          spreadsheets?: Array<{ id: string; name: string; driveId?: string }>;
        };
        if (!cancelled) {
          setSpreadsheets(
            (data.spreadsheets || []).map((s) => ({
              ...s,
              provider: normalizedProvider,
            }))
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao buscar planilhas');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSpreadsheets();
    return () => {
      cancelled = true;
    };
  }, [session, status, normalizedProvider]);

  const handleSelect = (spreadsheet: { id: string; name: string; driveId?: string }) => {
    setSelectedId(spreadsheet.id);
    onSelect({ ...spreadsheet, provider: normalizedProvider });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando planilhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Selecionar Planilha ({provider === 'google' ? 'Google Drive' : 'OneDrive/SharePoint'})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {spreadsheets.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma planilha encontrada</p>
              <p className="text-sm text-gray-400 mt-1">
                Verifique se você tem planilhas no {provider === 'google' ? 'Google Drive' : 'OneDrive/SharePoint'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {spreadsheets.map((sheet) => (
                <li key={sheet.id}>
                  <button
                    onClick={() => handleSelect(sheet)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedId === sheet.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FileSpreadsheet className={`w-5 h-5 ${selectedId === sheet.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left truncate font-medium text-gray-900">
                      {sheet.name}
                    </span>
                    {selectedId === sheet.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {onCreateStandardSheet && (
            <button
              onClick={() => {
                const title = window.prompt('Nome da nova planilha:', 'Controle de Atas - 2026');
                if (title) onCreateStandardSheet(normalizedProvider, title);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              + Nova Planilha Padrão
            </button>
          )}
          <button
                      onClick={() => {
                        const sheet = spreadsheets.find(s => s.id === selectedId);
                        if (sheet) onSelect({ ...sheet, provider: normalizedProvider });
                      }}
            disabled={!selectedId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>
  );
}