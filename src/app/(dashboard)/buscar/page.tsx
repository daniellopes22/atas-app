'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import SpreadsheetPicker from '@/components/SpreadsheetPicker';
import SpreadsheetConnectionBar from '@/components/SpreadsheetConnectionBar';
import ItemDetailsDrawer from '@/components/ItemDetailsDrawer';
import AtaGroupedResults from '@/components/AtaGroupedResults';
import { ARPItem, SheetType, SearchFilters } from '@/types';
import { LogOut, Menu, X, FileSpreadsheet, ArrowRight, CheckCircle } from 'lucide-react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function BuscarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ARPItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [sheetType, setSheetType] = useState<SheetType>('consumo');
  const [showPicker, setShowPicker] = useState(false);
  const [connectedSpreadsheet, setConnectedSpreadsheet] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [detailItem, setDetailItem] = useState<ARPItem | null>(null);
  const [viewMode, setViewMode] = useState<'agrupado' | 'lista'>('agrupado');
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Verificar se já tem planilha conectada na URL
  useEffect(() => {
    const sheetId = searchParams.get('sheetId');
    const sheetName = searchParams.get('sheetName');
    const provider = searchParams.get('provider');
    const driveId = searchParams.get('driveId');
    
    if (sheetId && sheetName && provider) {
      setConnectedSpreadsheet({ id: sheetId, name: sheetName, provider, driveId });
    }
  }, [searchParams]);

  const handleSearch = useCallback(async (filters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/atas/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar itens');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado na busca');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectionChange = useCallback((selected: Record<string, boolean>) => {
    setSelectedItems(selected);
  }, []);

  const handleClearSelection = () => {
    setSelectedItems({});
  };

  const selectedARPItems = items.filter(item => selectedItems[item.numeroControlePncpAta]);
  const destinationSheetName: Record<SheetType, string> = {
    consumo: 'Atas - Mat. Consumo',
    permanente: 'Atas - Mat. Permanente',
    contratos: 'Atas - Contratos',
  };

  const handleWriteToSpreadsheet = async () => {
    if (!connectedSpreadsheet) {
      setShowPicker(true);
      return;
    }

    if (selectedARPItems.length === 0) {
      alert('Selecione pelo menos um item');
      return;
    }

    try {
      const response = await fetch('/api/planilha/escrever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedARPItems,
          sheetType,
          spreadsheetId: connectedSpreadsheet.id,
          sheetName: destinationSheetName[sheetType],
          provider: connectedSpreadsheet.provider,
          driveId: connectedSpreadsheet.driveId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`${result.updatedRows} linhas inseridas com sucesso!`);
        setSelectedItems({});
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleSpreadsheetSelected = (spreadsheet: any) => {
    setConnectedSpreadsheet(spreadsheet);
    setShowPicker(false);
    // Atualizar URL
    const params = new URLSearchParams();
    params.set('sheetId', spreadsheet.id);
    params.set('sheetName', spreadsheet.name);
    params.set('provider', spreadsheet.provider);
    if (spreadsheet.driveId) params.set('driveId', spreadsheet.driveId);
    router.push(`/buscar?${params.toString()}`);
  };

  const handleDisconnectSpreadsheet = () => {
    setConnectedSpreadsheet(null);
    router.push('/buscar');
  };

  const handleCreateStandardSheet = async (provider: 'google' | 'microsoft' | 'download', title: string) => {
    if (provider === 'download') {
      setShowCreateSheet(false);
      alert('Use "Baixar Excel dos Selecionados" para exportar localmente.');
      return;
    }

    try {
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, provider, driveId: connectedSpreadsheet?.driveId }),
      });

      const result = await response.json();
      if (result.success) {
        setConnectedSpreadsheet({ id: result.spreadsheetId, name: result.spreadsheetName, provider: result.provider, driveId: connectedSpreadsheet?.driveId });
        setShowPicker(false);
        setShowCreateSheet(false);
        const params = new URLSearchParams();
        params.set('sheetId', result.spreadsheetId);
        params.set('sheetName', result.spreadsheetName);
        params.set('provider', result.provider);
        if (connectedSpreadsheet?.driveId) params.set('driveId', connectedSpreadsheet.driveId);
        router.push(`/buscar?${params.toString()}`);
        alert('Planilha padrão criada e conectada. Já pode adicionar itens.');
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (err: any) {
      setShowCreateSheet(false);
      alert(`Erro: ${err.message}`);
    }
  };

  const openSpreadsheet = () => {
    if (!connectedSpreadsheet) return;
    const url = connectedSpreadsheet.provider === 'google'
      ? `https://docs.google.com/spreadsheets/d/${connectedSpreadsheet.id}/edit`
      : `https://www.office.com/launch/excel?auth=2&driveId=${encodeURIComponent(connectedSpreadsheet.driveId || '')}&itemId=${encodeURIComponent(connectedSpreadsheet.id)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Pesquisa de Atas RP</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Botão Nova Planilha Padrão */}
              {connectedSpreadsheet ? null : (
                <button
                  onClick={() => setShowCreateSheet(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>+ Nova Planilha Padrão</span>
                </button>
              )}
              {/* Status da planilha conectada */}
              {connectedSpreadsheet && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 truncate max-w-xs">
                    {connectedSpreadsheet.name}
                  </span>
                  <button
                    onClick={handleDisconnectSpreadsheet}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                    title="Desconectar planilha"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Botão selecionar planilha */}
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{connectedSpreadsheet ? 'Trocar Planilha' : 'Conectar Planilha'}</span>
              </button>

              {/* Menu do usuário */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-gray-600">
                  {session?.user?.email}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t py-4">
            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <button
                onClick={() => setShowPicker(true)}
                className="flex-1 text-left text-blue-700 font-medium"
              >
                {connectedSpreadsheet ? 'Trocar Planilha' : 'Conectar Planilha'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SpreadsheetConnectionBar
          connectedSpreadsheet={connectedSpreadsheet}
          onConnect={() => setShowPicker(true)}
          onDisconnect={handleDisconnectSpreadsheet}
          onOpenSpreadsheet={openSpreadsheet}
          provider={connectedSpreadsheet?.provider || ((session as any)?.provider === 'azure-ad' ? 'microsoft' : 'google')}
        />
        {/* Alert de erro */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Busca */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Visualização:</label>
          <button
            onClick={() => setViewMode('agrupado')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${viewMode === 'agrupado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
          >
            Agrupado por Ata
          </button>
          <button
            onClick={() => setViewMode('lista')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${viewMode === 'lista' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
          >
            Lista Corrida
          </button>
          <button
            onClick={handleClearSelection}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
            title="Limpar seleção de itens"
          >
            Limpar Seleção
          </button>
        </div>

        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {/* Resultados */}
        {items.length > 0 && (
          <div className="mt-6">
            {viewMode === 'agrupado' ? (
              <AtaGroupedResults
                items={items}
                selectedItems={selectedItems}
                onSelectionChange={handleSelectionChange}
                onOpenDetails={setDetailItem}
              />
            ) : (
              <ResultsTable
                items={items}
                onSelectionChange={handleSelectionChange}
                sheetType={sheetType}
                onOpenDetails={setDetailItem}
              />
            )}
            <ExportButtons
              selectedItems={selectedARPItems}
              sheetType={sheetType}
              onWriteToSpreadsheet={handleWriteToSpreadsheet}
              connectedSpreadsheet={connectedSpreadsheet}
              isConnected={!!connectedSpreadsheet}
              onSheetTypeChange={setSheetType}
              onClearSelection={handleClearSelection}
              onCreateStandardSheet={handleCreateStandardSheet}
            />
          </div>
        )}

        {items.length === 0 && !isLoading && !error && (
          <div className="mt-12 text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum resultado</h3>
            <p className="text-gray-500">Ajuste os filtros e tente novamente</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-8 space-y-3 rounded-xl border bg-white p-4" aria-live="polite">
            <p className="text-sm font-medium text-gray-700">Consultando o Portal de Compras do Governo...</p>
            {[1, 2, 3, 4].map(row => <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        )}
      </main>

      {/* Modal do seletor de planilha */}
      {showPicker && (
        <SpreadsheetPicker
          onSelect={handleSpreadsheetSelected}
          onClose={() => setShowPicker(false)}
                provider={(session as any)?.provider || 'google'}
        />
      )}
      <ItemDetailsDrawer item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}