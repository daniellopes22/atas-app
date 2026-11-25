/**
 * @fileoverview Exportação local client-side de itens ARP selecionados para arquivo `.xlsx`.
 *
 * @module lib/excelExport
 */
import * as XLSX from 'xlsx';
import { ARPItem, SheetType } from '@/types';
import { getSheetMapper, rowsToSheetValues } from './sheetMapping';

/**
 * Converte uma lista de `ARPItem` em um `Blob` binário `.xlsx` pronto para download no navegador.
 *
 * @param {ARPItem[]} items - Itens ARP selecionados pelo usuário
 * @param {SheetType} type - Tipo de aba que define cabeçalhos e colunas
 * @returns {Blob} Blob MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
 */
export function exportToExcel(
  items: ARPItem[],
  type: SheetType
): Blob {
  const { map, headers } = getSheetMapper(type);
  
  // Mapear itens para linhas da planilha
  const mappedRows = items.map((item, index) => map(item, index + 2));
  const rows = rowsToSheetValues(mappedRows, headers);

  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Dados com cabeçalho
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Configurar largura das colunas
  const colWidths = headers.map(h => Math.max(h.length, 15));
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  
  XLSX.utils.book_append_sheet(wb, ws, type === 'consumo' ? 'Atas - Mat. Consumo' : 
    type === 'permanente' ? 'Atas - Mat. Permanente' : 'Atas - Contratos');
  
  // Gerar buffer e converter para Blob
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

/**
 * Dispara o download de um `Blob` no navegador criando e revogando uma Object URL temporária.
 *
 * @param {Blob} blob - Conteúdo binário gerado por `exportToExcel`
 * @param {string} filename - Nome do arquivo exibido no diálogo de download
 */
export function downloadExcel(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}