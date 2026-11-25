/**
 * @fileoverview Gerador em memória da planilha institucional padrão (`.xlsx`)
 * compatível com Google Sheets, Excel Online e Microsoft Excel desktop.
 *
 * @module lib/spreadsheet-template
 * @description Constrói um workbook com 4 abas:
 * 1. `Dashboard_Chefia` — painel consolidado com fórmulas em inglês (`COUNTA`, `COUNTIF`, `COUNTIFS`, `SUM`, `TODAY`).
 * 2. `Atas - Mat. Consumo`
 * 3. `Atas - Mat. Permanente`
 * 4. `Atas - Contratos`
 */

import * as ExcelJS from 'exceljs';

const NAVY = '1E3A8A';
const LIGHT_BLUE = 'E8EEF7';
const WHITE = 'FFFFFF';
const FFWHITE = `FF${WHITE}`;

/** Cabeçalhos padrão das abas operacionais de atas */
const DATA_HEADERS = [
  'ID Controle (PNCP-Item)',
  'Status Vigência',
  'Órgão Gerenciador (UASG)',
  'Nº Ata / Pregão',
  'Código PDM/CATMAT',
  'Descrição do Item',
  'Unidade',
  'Qtd. Homologada',
  'Limite Carona Órgão (50%)',
  'Saldo Disponível Real',
  'Valor Unitário',
  'Valor Total Disponível',
  'Fim da Vigência',
  'Fornecedor & Contatos (BrasilAPI)',
  'Link Ata PNCP',
  'Link Proposta Comprasnet',
  'Data Inclusão',
];

/**
 * Aplica estilização institucional azul-marinho na linha de cabeçalho.
 *
 * @param {ExcelJS.Worksheet} worksheet - Aba alvo do ExcelJS
 * @param {number} rowNumber - Índice 1-based da linha de cabeçalho
 */
function styleHeaderRow(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const row = worksheet.getRow(rowNumber);
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
    cell.font = { bold: true, color: { argb: FFWHITE }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    };
  });
  row.height = 30;
}

/**
 * Aplica bordas suaves, alinhamento superior com quebra de texto e zebra opcional em linhas de dados.
 *
 * @param {ExcelJS.Worksheet} worksheet - Aba alvo do ExcelJS
 * @param {number} rowNumber - Índice 1-based da linha
 * @param {boolean} [isAlternate=false] - Aplica preenchimento cinza claro alternado quando `true`
 */
function styleDataRow(worksheet: ExcelJS.Worksheet, rowNumber: number, isAlternate = false) {
  const row = worksheet.getRow(rowNumber);
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };
    if (isAlternate) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    }
    cell.alignment = { vertical: 'top', wrapText: true };
  });
}

/**
 * Constrói o workbook `ExcelJS.Workbook` completo com dashboard gerencial e três abas operacionais.
 *
 * @description Fórmulas são gravadas em inglês (padrão OpenXML) para garantir avaliação correta tanto
 * no Google Sheets quanto no Excel Online independentemente do locale da conta do usuário.
 * Inclui painéis congelados (`views`) e autofiltro nas 4 abas.
 *
 * @returns {ExcelJS.Workbook} Instância pronta para serialização em buffer
 */
export function buildStandardWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pesquisa de Atas RP';
  wb.lastModifiedBy = 'Pesquisa de Atas RP';
  wb.created = new Date();
  wb.modified = new Date();

  // ========================================================
  // Aba 1 — Dashboard_Chefia
  // ========================================================
  const dashboard = wb.addWorksheet('Dashboard_Chefia');
  dashboard.columns = [
    { header: 'Categoria', key: 'categoria', width: 26 },
    { header: 'Total Itens Mapeados', key: 'total', width: 22 },
    { header: 'Itens Vigentes', key: 'vigentes', width: 18 },
    { header: 'Vencendo em até 60 dias', key: 'vencendo', width: 24 },
    { header: 'Valor Global Disponível (R$)', key: 'valor', width: 26 },
  ];

  dashboard.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
    cell.font = { bold: true, color: { argb: FFWHITE }, size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  dashboard.getRow(1).height = 24;

  const categorias = ['Mat. Consumo', 'Mat. Permanente', 'Contratos'];
  let rowIdx = 2;
  for (const cat of categorias) {
    const sheetRef = `'Atas - ${cat}'`;
    const r = dashboard.getRow(rowIdx);
    r.getCell('categoria').value = cat;
    r.getCell('total').value = { formula: `COUNTA(${sheetRef}!A:A)-1` };
    r.getCell('vigentes').value = { formula: `COUNTIF(${sheetRef}!B:B,"Vigente")` };
    r.getCell('vencendo').value = {
      formula: `COUNTIFS(${sheetRef}!M:M,">="&TODAY(),${sheetRef}!M:M,"<="&TODAY()+60)`,
    };
    r.getCell('valor').value = { formula: `SUM(${sheetRef}!L:L)` };
    r.getCell('valor').numFmt = '"R$" #,##0.00';
    styleDataRow(dashboard, rowIdx, rowIdx % 2 === 0);
    rowIdx++;
  }

  // Totais
  const totalRow = dashboard.getRow(rowIdx);
  totalRow.getCell('categoria').value = 'TOTAL GERAL';
  totalRow.getCell('total').value = { formula: `SUM(B2:B${rowIdx - 1})` };
  totalRow.getCell('vigentes').value = { formula: `SUM(C2:C${rowIdx - 1})` };
  totalRow.getCell('vencendo').value = { formula: `SUM(D2:D${rowIdx - 1})` };
  totalRow.getCell('valor').value = { formula: `SUM(E2:E${rowIdx - 1})` };
  totalRow.getCell('valor').numFmt = '"R$" #,##0.00';
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_BLUE}` } };
    cell.border = {
      top: { style: 'medium', color: { argb: `FF${NAVY}` } },
      bottom: { style: 'medium', color: { argb: `FF${NAVY}` } },
      left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    };
  });

  dashboard.views = [];

  // ========================================================
  // Abas 2, 3, 4 — Dados
  // ========================================================
  const sheetConfigs: Array<{ name: string }> = [
    { name: 'Atas - Mat. Consumo' },
    { name: 'Atas - Mat. Permanente' },
    { name: 'Atas - Contratos' },
  ];

  for (const { name } of sheetConfigs) {
    const ws = wb.addWorksheet(name);
    ws.columns = DATA_HEADERS.map((h, i) => ({ header: h, key: `col${i}`, width: h === 'Descrição do Item' ? 46 : 22 }));

    styleHeaderRow(ws, 1);
    ws.getRow(1).values = DATA_HEADERS;

    // Linha 2 de exemplo (ajuda o usuário a entender o preenchimento)
    const exampleRow = ws.getRow(2);
    exampleRow.getCell('col0').value = '75095679000149-1-000046/2025-000001';
    exampleRow.getCell('col1').value = 'Vigente';
    exampleRow.getCell('col2').value = '590001 - CONSELHO NACIONAL DO MINISTERIO PUBLICO';
    exampleRow.getCell('col3').value = '00003/2025 - 90014';
    exampleRow.getCell('col4').value = '6661';
    exampleRow.getCell('col5').value = 'MICROCOMPUTADOR, MEMÓRIA RAM 32 GB...';
    exampleRow.getCell('col6').value = 'UN';
    exampleRow.getCell('col7').value = 2;
    exampleRow.getCell('col8').value = 1;
    exampleRow.getCell('col9').value = 1;
    exampleRow.getCell('col10').value = 13365;
    exampleRow.getCell('col11').value = 13365;
    exampleRow.getCell('col12').value = '2026-11-27';
    exampleRow.getCell('col13').value = 'CNPJ: 11101784000160 | RAZÃO SOCIAL: SR TECNOLOGIA...';
    exampleRow.getCell('col14').value = 'https://pncp.gov.br/app/atas/11439520000111/2025/46/1';
    exampleRow.getCell('col15').value = 'https://cnetmobile.estaleiro.serpro.gov.br/...';
    exampleRow.getCell('col16').value = new Date().toISOString().split('T')[0];
    styleDataRow(ws, 2, true);

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, showGridLines: true }];
    ws.autoFilter = 'A1:Q1';
  }

  return wb;
}

/**
 * Serializa o workbook institucional padrão em um `Buffer` binário `.xlsx` em memória.
 *
 * @returns {Promise<Buffer>} Conteúdo binário pronto para upload no Google Drive/OneDrive ou download HTTP
 */
export async function generateStandardWorkbookBuffer(): Promise<Buffer> {
  const wb = buildStandardWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Retorna os nomes exatos das quatro abas criadas na planilha padrão.
 *
 * @returns {string[]} Lista ordenada de nomes das abas
 */
export function getStandardSheetNames(): string[] {
  return ['Dashboard_Chefia', 'Atas - Mat. Consumo', 'Atas - Mat. Permanente', 'Atas - Contratos'];
}
