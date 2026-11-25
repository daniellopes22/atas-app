/**
 * @fileoverview Adaptador Microsoft Graph API v1.0 para OneDrive / SharePoint Excel Online.
 *
 * @module lib/microsoftGraph
 * @description Realiza listagem de pastas de trabalho `.xlsx/.xls/.xlsm`, leitura de abas
 * e escrita incremental via `PATCH .../workbook/worksheets('{sheet}')/range(...)` com timeout de 15s.
 */
import { ARPItem, SheetType, ConnectedSpreadsheet } from '@/types';
import { getSheetMapper, rowsToSheetValues } from './sheetMapping';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const FETCH_OPTIONS = { signal: AbortSignal.timeout(15_000) };

/**
 * Lista até 50 planilhas Excel armazenadas na raiz do OneDrive do usuário.
 *
 * @param {string} accessToken - Access token OAuth 2.0 Microsoft Graph (`Files.ReadWrite`)
 * @returns {Promise<ConnectedSpreadsheet[]>} Lista de arquivos compatíveis ou array vazio em falha
 */
export async function listUserSpreadsheets(accessToken: string): Promise<ConnectedSpreadsheet[]> {
  
  try {
    const response = await fetch(
      `${GRAPH_BASE}/me/drive/root/children?$filter=endswith(name,'.xlsx') or endswith(name,'.xls') or endswith(name,'.xlsm')&$orderby=lastModifiedDateTime desc&$top=50`,
      { ...FETCH_OPTIONS, headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    if (!response.ok) return [];
    
    const data = (await response.json()) as {
      value: Array<{ id: string; name: string; parentReference?: { driveId?: string } }>;
    };
    return data.value.map((item) => ({
      id: item.id,
      name: item.name,
      provider: 'microsoft',
      sheets: [],
      driveId: item.parentReference?.driveId,
    }));
  } catch (error) {
    console.error('Erro ao listar arquivos Excel:', error);
    return [];
  }
}

/**
 * Lista os nomes das abas (worksheets) de um arquivo Excel no OneDrive ou SharePoint.
 *
 * @param {string} accessToken - Access token OAuth 2.0 Microsoft Graph
 * @param {string} fileId - ID do DriveItem
 * @param {string} [driveId] - ID do Drive (opcional, necessário para bibliotecas SharePoint)
 * @returns {Promise<string[]>} Nomes das abas ou array vazio em caso de falha
 */
export async function getSpreadsheetSheets(accessToken: string, fileId: string, driveId?: string): Promise<string[]> {
  
  try {
    const base = driveId 
      ? `${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/worksheets`
      : `${GRAPH_BASE}/me/drive/items/${fileId}/workbook/worksheets`;
    
    const response = await fetch(base, {
      ...FETCH_OPTIONS, headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (!response.ok) return [];
    
    const data = (await response.json()) as { value: Array<{ name: string }> };
    return data.value.map((s) => s.name);
  } catch (error) {
    console.error('Erro ao listar abas:', error);
    return [];
  }
}

/**
 * Anexa linhas mapeadas ao final do `usedRange` de uma aba no Excel Online via Microsoft Graph.
 *
 * @param {string} accessToken - Access token OAuth 2.0 Microsoft Graph
 * @param {string} fileId - ID do arquivo Excel
 * @param {string} sheetName - Nome da aba de destino
 * @param {ARPItem[]} items - Itens ARP a gravar
 * @param {SheetType} type - Tipo de aba para seleção de mapper/colunas
 * @param {string} [driveId] - ID do drive SharePoint, se aplicável
 * @returns {Promise<{ success: boolean; updatedRows?: number; error?: string }>} Resultado da gravação
 */
export async function appendRowsToExcel(
  accessToken: string,
  fileId: string,
  sheetName: string,
  items: ARPItem[],
  type: SheetType,
  driveId?: string
): Promise<{ success: boolean; updatedRows?: number; error?: string }> {
  try {
    const { headers, map } = getSheetMapper(type);
    const base = driveId 
      ? `${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/worksheets('${sheetName}')`
      : `${GRAPH_BASE}/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')`;

    // Ler range atual para encontrar próxima linha
    const rangeUrl = `${base}/usedRange`;
    const rangeResponse = await fetch(rangeUrl, {
      ...FETCH_OPTIONS, headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    let startRow = 1;
    if (rangeResponse.ok) {
      const data = await rangeResponse.json();
      startRow = (data.rowCount || 0) + 1;
    } else if (rangeResponse.status === 404) {
      // Aba não existe, criar com cabeçalho
      startRow = 1;
    } else {
      throw new Error(`Erro ao ler planilha: ${rangeResponse.statusText}`);
    }

    // Converter linhas para formato Excel
    const rows = items.map((item, index) => map(item, startRow + index));
    const values = rowsToSheetValues(rows, headers);

    // Preparar range para escrita
    const colCount = headers.length;
    const endCol = toExcelColumnName(colCount);
    const rangeAddress = startRow === 1 
      ? `${sheetName}!A1:${endCol}${values.length + 1}`
      : `${sheetName}!A${startRow}:${endCol}${startRow + values.length - 1}`;
    
    // Se for primeira linha, incluir cabeçalho
    const writeValues = startRow === 1 ? [headers, ...values] : values;

    const writeUrl = `${base}/range(address='${rangeAddress}')`;
    const writeResponse = await fetch(writeUrl, {
      method: 'PATCH',
      ...FETCH_OPTIONS,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: writeValues }),
    });

    if (!writeResponse.ok) {
      const error = await writeResponse.text();
      throw new Error(`Erro ao escrever no Excel: ${error}`);
    }

    return {
      success: true,
      updatedRows: items.length,
    };
  } catch (error: unknown) {
    console.error('Erro ao escrever no Excel Online:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao escrever no Excel Online',
    };
  }
}

/**
 * Converte um índice de coluna 1-based em notação alfabética do Excel (ex: `1 -> A`, `27 -> AA`).
 *
 * @param {number} columnNumber - Número da coluna (1-based)
 * @returns {string} Letra(s) da coluna no formato A1
 */
function toExcelColumnName(columnNumber: number): string {
  let column = '';
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  return column;
}