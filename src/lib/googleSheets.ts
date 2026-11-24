/**
 * @fileoverview Adaptador Google Sheets API v4 & Google Drive API v3 para listagem
 * de planilhas e inserção incremental (`append`) de itens ARP.
 *
 * @module lib/googleSheets
 * @description Utiliza o `accessToken` OAuth 2.0 do usuário autenticado via NextAuth.
 */
import { google, sheets_v4 } from 'googleapis';
import { ARPItem, SheetType, ConnectedSpreadsheet } from '@/types';
import { getSheetMapper, rowsToSheetValues } from './sheetMapping';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];

/**
 * Instancia o cliente autenticado do Google Sheets API v4.
 *
 * @param {string} accessToken - Token OAuth 2.0 do Google com escopo `spreadsheets`
 * @returns {sheets_v4.Sheets} Cliente configurado
 */
export function getSheetsClient(accessToken: string): sheets_v4.Sheets {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Instancia o cliente autenticado do Google Drive API v3.
 *
 * @param {string} accessToken - Token OAuth 2.0 do Google com escopo `drive.file`
 * @returns {Promise<ReturnType<typeof google.drive>>} Cliente Drive configurado
 */
export async function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

/**
 * Lista até 50 planilhas Google Sheets pertencentes/acessíveis pelo usuário no Drive.
 *
 * @param {string} accessToken - Token OAuth 2.0 do Google
 * @returns {Promise<ConnectedSpreadsheet[]>} Planilhas ordenadas por modificação decrescente
 */
export async function listUserSpreadsheets(accessToken: string): Promise<ConnectedSpreadsheet[]> {
  const drive = await getDriveClient(accessToken);
  
  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  });
  
  return (response.data.files || []).map(file => ({
    id: file.id!,
    name: file.name!,
    provider: 'google',
    sheets: [],
  }));
}

/**
 * Obtém os nomes de todas as abas (worksheets) de uma planilha Google Sheets.
 *
 * @param {string} accessToken - Token OAuth 2.0 do Google
 * @param {string} spreadsheetId - ID do arquivo no Google Drive
 * @returns {Promise<string[]>} Títulos das abas existentes
 */
export async function getSpreadsheetSheets(accessToken: string, spreadsheetId: string): Promise<string[]> {
  const sheets = getSheetsClient(accessToken);
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(title))',
  });
  
  return (response.data.sheets || []).map(s => s.properties?.title || '');
}

/**
 * Anexa itens ARP a uma aba específica do Google Sheets, criando cabeçalhos se estiver vazia.
 *
 * @description Utiliza `valueInputOption: 'USER_ENTERED'` após sanitização prévia via
 * `sanitizeSpreadsheetText` no mapper, preservando tipagem numérica e datas na planilha.
 *
 * @param {string} accessToken - Token OAuth 2.0 do Google
 * @param {string} spreadsheetId - ID da planilha alvo
 * @param {string} sheetName - Nome exato da aba destino
 * @param {ARPItem[]} items - Itens ARP a inserir
 * @param {SheetType} type - Layout de colunas (`'consumo' | 'permanente' | 'contratos'`)
 * @returns {Promise<{ success: boolean; updatedRows?: number; error?: string }>} Resultado da operação
 */
export async function appendRowsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  items: ARPItem[],
  type: SheetType
): Promise<{ success: boolean; updatedRows?: number; error?: string }> {
  try {
    const sheets = getSheetsClient(accessToken);
    const { map, headers } = getSheetMapper(type);
    
    // Verificar se a aba existe
    const sheetNames = await getSpreadsheetSheets(accessToken, spreadsheetId);
    if (!sheetNames.includes(sheetName)) {
      return { success: false, error: `Aba "${sheetName}" não encontrada na planilha` };
    }
    
    // Verificar se a aba tem cabeçalho
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:W1`,
    });
    
    let startRow = 1;
    if (!checkResponse.data.values || checkResponse.data.values.length === 0) {
      // Adicionar cabeçalho
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      startRow = 2;
    } else {
      // Encontrar próxima linha vazia
      const allData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      });
      startRow = (allData.data.values?.length || 1) + 1;
    }

    // Preparar valores
    const rows = items.map((item, index) => map(item, startRow + index));
    const values = rowsToSheetValues(rows, headers);

    // Inserir dados
    const range = `${sheetName}!A${startRow}`;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return {
      success: true,
      updatedRows: response.data.updates?.updatedRows || 0,
    };
  } catch (error: any) {
    console.error('Erro ao escrever no Google Sheets:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao escrever no Google Sheets',
    };
  }
}