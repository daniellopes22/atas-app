/**
 * @fileoverview Barra fixa de ações de exportação para itens selecionados (nuvem, .xlsx e clipboard).
 *
 * @module components/ExportButtons
 */
'use client';

import { useState } from 'react';
import { ARPItem, ConnectedSpreadsheet, SheetType } from '@/types';
import { mapToConsumoRow, mapToPermanenteRow, mapToContratoRow } from '@/lib/sheetMapping';
import { downloadExcel } from '@/lib/excelExport';
import { Download, Clipboard, Check, Loader2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';

/** Propriedades de {@link ExportButtons} */
interface ExportButtonsProps {
  /** Itens selecionados prontos para exportação */
  selectedItems: ARPItem[];
  /** Aba de destino ativa (`consumo | permanente | contratos`) */
  sheetType: SheetType;
  /** Dispara gravação dos itens selecionados na planilha conectada */
  onWriteToSpreadsheet: () => void;
  /** Metadados da planilha conectada (ou `null`) */
  connectedSpreadsheet: ConnectedSpreadsheet | null;
  /** Indica se há planilha conectada na sessão */
  isConnected: boolean;
  /** Atualiza a aba de destino selecionada */
  onSheetTypeChange: (type: SheetType) => void;
  /** Limpa todos os checkboxes selecionados */
  onClearSelection?: () => void;
  /** Cria a planilha institucional padrão no Drive/OneDrive ou via download */
  onCreateStandardSheet?: (provider: 'google' | 'microsoft' | 'download', title: string) => void;
  /** Provedor ativo para criação de nova planilha padrão */
  defaultProvider?: 'google' | 'microsoft';
}

/**
 * Barra flutuante de exportação com cópia TSV (Excel/Sheets), gravação em nuvem e download `.xlsx`.
 *
 * @param {ExportButtonsProps} props
 * @returns {JSX.Element}
 */
export default function ExportButtons({
  selectedItems,
  sheetType,
  onWriteToSpreadsheet,
  connectedSpreadsheet,
  isConnected,
  onSheetTypeChange,
  onClearSelection,
  onCreateStandardSheet,
  defaultProvider = 'google',
}: ExportButtonsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [writeStatus, setWriteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      const rows = sheetType === 'consumo'
          ? selectedItems.map((item, index) => mapToConsumoRow(item, index + 2))
        : sheetType === 'permanente'
          ? selectedItems.map((item, index) => mapToPermanenteRow(item, index + 2))
          : selectedItems.map((item, index) => mapToContratoRow(item, index + 2));
      
      // Gerar texto tabulado
      const headers = sheetType === 'consumo' 
        ? ['Material', 'CATMAT', 'Marca / Modelo', 'Quant.', 'Valor Unit. Estimado', 'Valor Unit. Ata', 'Valor Total Ata', 'Diferença', 'UASG', 'Pregão', 'Nº Ata', 'Item', 'Validade Ata', 'Quant. Ata', 'Quant. Disp. p/ Adesão', 'Autorizados', 'Saldo p/ Adesão', 'Contato', 'Link Ata PNCP', 'Link Saldo de Adesão', 'Link Edital PNCP', 'Link Proposta do Item', 'Status', 'Regularidade']
        : sheetType === 'permanente'
        ? ['ID Ata PNCP', 'Material', 'Marca / Modelo', 'Quant.', 'Disponíveis p/ Adesão', 'Valor Unitário', 'Valor Total (Máx. Adesão)', 'UASG (Órgão Gerenciador)', 'Pregão', 'Nº Ata', 'Item', 'Validade Ata', 'Processo SIPAC', 'Contato', 'Status', 'Link Saldo de Adesão', 'Link item - PNCP', 'Link - Proposta', 'NOTA DE EMPENHO', 'CONTRATO', 'VIGÊNCIA', 'GESTÃO DO CONTRATO', 'DIAS P/ ENCERRAMENTO', 'Regularidade']
        : ['Material', 'Marca / Modelo', 'Quant.', 'Valor Unitário', 'Valor Total', 'UASG', 'Pregão', 'Nº Ata', 'Item', 'Validade Ata', 'Quant. Ata', 'Quant. Disp. p/ Adesão', 'Autorizados', 'Saldo p/ Adesão', 'Processo SEI', 'Contato', 'Status', 'Link Pesquisa Atas', 'Link item - PNCP', 'NOTA DE EMPENHO', 'CONTRATO', 'VIGÊNCIA', 'GESTÃO DO CONTRATO', 'DIAS P/ ENCERRAMENTO', 'Regularidade'];
      
      const headerLine = headers.join('\t');
      const dataLines = rows.map(row => 
        Object.values(row).map(v => 
          typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v ?? '')
        ).join('\t')
      );
      
      const tabText = [headerLine, ...dataLines].join('\n');
      await navigator.clipboard.writeText(tabText);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleWriteToSpreadsheet = async () => {
    setWriteStatus('loading');
    try {
      await onWriteToSpreadsheet();
      setWriteStatus('success');
      setTimeout(() => setWriteStatus('idle'), 3000);
    } catch {
      setWriteStatus('error');
      setTimeout(() => setWriteStatus('idle'), 3000);
    }
  };

  const handleDownload = async () => {
    setDownloadStatus('loading');
    try {
      const { exportToExcel } = await import('@/lib/excelExport');
      const blob = exportToExcel(selectedItems, sheetType);
      downloadExcel(blob, `atas-${sheetType}-${new Date().toISOString().split('T')[0]}.xlsx`);
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch {
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  const selectedCount = selectedItems.length;

  if (selectedCount === 0) {
    return (
      <div className="px-4 py-3 border-t bg-gray-50 text-center text-gray-500 text-sm">
        Selecione itens na tabela para habilitar a exportação
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-30 mt-4 rounded-xl border border-blue-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700">
        {selectedCount} item(s) selecionado(s) para <span className="text-blue-600">
          {sheetType === 'consumo' ? 'Atas - Mat. Consumo' : sheetType === 'permanente' ? 'Atas - Mat. Permanente' : 'Atas - Contratos'}
        </span>
      </span>
      <div className="text-sm text-gray-700">
        <span className="font-medium">Menor preço:</span> {Math.min(...selectedItems.map(item => item.valorUnitarioAta)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · <span className="font-medium">Preço médio:</span> {(selectedItems.reduce((sum, item) => sum + item.valorUnitarioAta, 0) / selectedCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
      <select value={sheetType} onChange={(event) => onSheetTypeChange(event.target.value as SheetType)} aria-label="Aba de destino" className="rounded-lg border px-3 py-2 text-sm">
        <option value="consumo">Mat. Consumo</option><option value="permanente">Mat. Permanente</option><option value="contratos">Contratos</option>
      </select>
      
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
        {onCreateStandardSheet && !connectedSpreadsheet && (
          <button
            onClick={() => {
              const title = window.prompt('Nome da nova planilha:', 'Controle de Atas - 2026');
              if (title?.trim()) onCreateStandardSheet(defaultProvider, title.trim());
            }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Nova Planilha Padrão
          </button>
        )}
        {/* Incluir na Planilha Conectada */}
        <button
          onClick={handleWriteToSpreadsheet}
          disabled={!isConnected || writeStatus === 'loading'}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isConnected ? `Inserir na planilha "${connectedSpreadsheet?.name}"` : 'Conecte uma planilha primeiro'}
        >
          {writeStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : writeStatus === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Incluir na Planilha</span>
            </>
          )}
        </button>

        {/* Download Excel */}
        <button
          onClick={handleDownload}
          disabled={downloadStatus === 'loading'}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Baixar arquivo .xlsx para uso offline"
        >
          {downloadStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloadStatus === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Baixar Excel</span>
            </>
          )}
        </button>

        {/* Copiar para área de transferência */}
        <button
          onClick={handleCopy}
          disabled={copyStatus === 'loading'}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Copiar dados tabulados para colar no Sheets/Excel (Ctrl+V)"
        >
          {copyStatus === 'success' ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copiado!</span>
            </>
          ) : copyStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>Erro</span>
            </>
          ) : (
            <>
              <Clipboard className="w-4 h-4" />
              <span>Copiar p/ Colar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}