/**
 * @fileoverview Exportação local client-side de itens ARP selecionados para arquivo `.xlsx`.
 *
 * @module lib/excelExport
 */
import * as XLSX from 'xlsx';
import { ARPItem, SheetType } from '@/types';
import { getSheetMapper, mapToConsumoRow, mapToPermanenteRow, mapToContratoRow } from './sheetMapping';

/**
 * Converte uma lista de `ARPItem` em um `Blob` binário `.xlsx` pronto para download no navegador.
 *
 * @param {ARPItem[]} items - Itens ARP selecionados pelo usuário
 * @param {SheetType} type - Tipo de aba que define cabeçalhos e colunas
 * @param {string} [filename] - Nome sugerido do arquivo (usado como metadado de referência)
 * @returns {Blob} Blob MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
 */
export function exportToExcel(
  items: ARPItem[],
  type: SheetType,
  filename: string = `atas-${type}-${new Date().toISOString().split('T')[0]}.xlsx`
): Blob {
  const { map, headers } = getSheetMapper(type);
  
  // Mapear itens para linhas da planilha
  const rows = items.map((item, index) => {
    const mapped = type === 'consumo' 
      ? map(item as any, index + 2)
      : type === 'permanente'
      ? map(item as any, index + 2)
      : map(item as any, index + 2);
    
    return headers.map(h => {
      const key = h.toLowerCase().replace(/[^a-z]/g, '');
      return (mapped as any)[key] ?? '';
    });
  });

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