/**
 * @fileoverview Mapeadores de domínio (`ARPItem` -> linhas de planilha) e sanitização
 * anti-Formula Injection (CWE-1236) para Google Sheets, Excel Online e exportação local.
 *
 * @module lib/sheetMapping
 */
import { ARPItem, SheetRowConsumo, SheetRowPermanente, SheetRowContrato, SheetType } from '@/types';
import { enrichWithPncpLinks, enrichWithSaldoAdesao, formatContatoPlanilha } from './links';
import { FornecedorContato } from '@/types';

/**
 * Neutraliza textos iniciados por caracteres interpretados como fórmula por planilhas.
 *
 * @description Previne Spreadsheet Formula Injection (CWE-1236) prefixando apóstrofo simples (`'`)
 * quando o valor começa com `=`, `+`, `-`, `@`, `\t` ou `\r`.
 *
 * @param {string} value - Texto de célula proveniente de API externa ou entrada do usuário
 * @returns {string} Texto seguro para gravação em célula
 */
export function sanitizeSpreadsheetText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Mapeia um item ARP para o layout de 23 colunas da aba `"Atas - Mat. Consumo"`.
 *
 * @param {ARPItem} item - Item da ARP retornado pela busca/detalhes
 * @param {number} rowIndex - Índice da linha de destino (reservado para fórmulas futuras)
 * @param {FornecedorContato} [contato] - Dados cadastrais do fornecedor obtidos via BrasilAPI
 * @returns {SheetRowConsumo} Objeto estruturado na ordem exata das colunas de Consumo
 */
export function mapToConsumoRow(item: ARPItem, rowIndex: number, contato?: FornecedorContato): SheetRowConsumo {
  const enriched = enrichWithPncpLinks(item);
  const withSaldo = enrichWithSaldoAdesao(enriched, item.saldoAdesao?.quantidadeAutorizada || 0);
  
  const quant = Math.floor(item.quantidadeAta / 2); // Col D = Col O / 2 (onde O = N/2)
  const valorTotalAta = item.valorUnitarioAta * quant; // Col G = F * D
  const diferenca = item.valorUnitarioEstimado > 0 
    ? (item.valorUnitarioAta - item.valorUnitarioEstimado) / item.valorUnitarioEstimado 
    : 0; // Col H = (F-E)/E
  const quantDispAdesao = Math.floor(item.quantidadeAta / 2); // Col O = N/2
  const saldoAdesao = withSaldo.saldoAdesao?.saldoDisponivelOrgao || quantDispAdesao; // Col Q
  
  const contatoFormatado = formatContatoPlanilha(contato || (withSaldo.contatoFornecedor ? {
      cnpj: withSaldo.niFornecedor || '',
      razaoSocial: withSaldo.nomeRazaoSocialFornecedor || '',
  } : null));
  
  return {
    material: sanitizeSpreadsheetText(item.descricaoItem),
    catmat: item.codigoCatmat,
    marcaModelo: sanitizeSpreadsheetText(item.marcaModelo || ''),
    quant,
    valorUnitEstimado: item.valorUnitarioEstimado,
    valorUnitAta: item.valorUnitarioAta,
    valorTotalAta,
    diferenca,
    uasg: sanitizeSpreadsheetText(`${item.uasg} - ${item.orgaoNome}`),
    pregao: sanitizeSpreadsheetText(item.numeroCompra),
    numAta: sanitizeSpreadsheetText(item.numeroAta),
    item: item.numeroItemAta,
    validadeAta: item.dataVigenciaFinal.split('T')[0],
    quantAta: item.quantidadeAta,
    quantDispAdesao,
    autorizados: 0,
    saldoAdesao,
    contato: sanitizeSpreadsheetText(contatoFormatado),
    linkAtaPncp: enriched.linkAtaPncp || '',
    linkSaldoAdesao: enriched.linkAtaPncp || '', // Link para o PNCP como saldo
    linkEditalPncp: enriched.linkEditalPncp || '',
    linkPropostaItem: enriched.linkPropostaItem || '',
    status: withSaldo.saldoAdesao?.indicador === 'esgotado' ? 'Esgotado' : 
            withSaldo.saldoAdesao?.indicador === 'reduzido' ? 'Saldo Reduzido' :
            withSaldo.saldoAdesao?.indicador === 'vencido' ? 'Vencido' : 'Disponível',
  };
}

/**
 * Mapeia um item ARP para o layout de 23 colunas da aba `"Atas - Mat. Permanente"`.
 *
 * @param {ARPItem} item - Item da ARP retornado pela busca/detalhes
 * @param {number} rowIndex - Índice da linha de destino
 * @param {FornecedorContato} [contato] - Dados cadastrais do fornecedor obtidos via BrasilAPI
 * @returns {SheetRowPermanente} Objeto estruturado na ordem das colunas de Material Permanente
 */
export function mapToPermanenteRow(item: ARPItem, rowIndex: number, contato?: FornecedorContato): SheetRowPermanente {
  const enriched = enrichWithPncpLinks(item);
  const withSaldo = enrichWithSaldoAdesao(enriched, item.saldoAdesao?.quantidadeAutorizada || 0);
  
  const dispAdesao = Math.floor(item.quantidadeAta / 2); // Col E = ROUNDDOWN(D/2,0)
  const valorTotal = dispAdesao * item.valorUnitarioAta; // Col G = E * F
  
  const contatoFormatado = formatContatoPlanilha(contato || (withSaldo.contatoFornecedor ? {
      cnpj: withSaldo.niFornecedor || '',
      razaoSocial: withSaldo.nomeRazaoSocialFornecedor || '',
  } : null));
  
  return {
    idAtaPncp: enriched.linkAtaPncp || '',
    material: sanitizeSpreadsheetText(item.descricaoItem),
    marcaModelo: sanitizeSpreadsheetText(item.marcaModelo || ''),
    quantAta: item.quantidadeAta,
    dispAdesao,
    valorUnitario: item.valorUnitarioAta,
    valorTotal,
    uasg: sanitizeSpreadsheetText(`${item.uasg} - ${item.orgaoNome}`),
    pregao: sanitizeSpreadsheetText(item.numeroCompra),
    numAta: sanitizeSpreadsheetText(item.numeroAta),
    item: item.numeroItemAta.toString(),
    validadeAta: item.dataVigenciaFinal.split('T')[0],
    processoSipac: '',
    contato: sanitizeSpreadsheetText(contatoFormatado),
    status: withSaldo.saldoAdesao?.indicador === 'esgotado' ? 'Esgotado' : 
            withSaldo.saldoAdesao?.indicador === 'reduzido' ? 'Saldo Reduzido' :
            withSaldo.saldoAdesao?.indicador === 'vencido' ? 'Vencido' : 'Disponível',
    linkSaldoAdesao: enriched.linkAtaPncp || '',
    linkItemPncp: enriched.linkAtaPncp || '',
    linkProposta: enriched.linkPropostaItem || '',
    notaEmpenho: '',
    contrato: '',
    vigencia: item.dataVigenciaFinal.split('T')[0],
    gestaoContrato: '',
    diasEncerramento: '',
  };
}

/**
 * Mapeia um item ARP para o layout de 24 colunas da aba `"Atas - Contratos"`.
 *
 * @param {ARPItem} item - Item da ARP retornado pela busca/detalhes
 * @param {number} rowIndex - Índice da linha de destino
 * @param {FornecedorContato} [contato] - Dados cadastrais do fornecedor obtidos via BrasilAPI
 * @returns {SheetRowContrato} Objeto estruturado na ordem das colunas de Contratos
 */
export function mapToContratoRow(item: ARPItem, rowIndex: number, contato?: FornecedorContato): SheetRowContrato {
  const enriched = enrichWithPncpLinks(item);
  const withSaldo = enrichWithSaldoAdesao(enriched, item.saldoAdesao?.quantidadeAutorizada || 0);
  
  const quantDispAdesao = Math.floor(item.quantidadeAta / 2);
  const saldoAdesao = withSaldo.saldoAdesao?.saldoDisponivelOrgao || quantDispAdesao;
  
  const contatoFormatado = formatContatoPlanilha(contato || (withSaldo.contatoFornecedor ? {
      cnpj: withSaldo.niFornecedor || '',
      razaoSocial: withSaldo.nomeRazaoSocialFornecedor || '',
  } : null));
  
  return {
    material: sanitizeSpreadsheetText(item.descricaoItem),
    marcaModelo: sanitizeSpreadsheetText(item.marcaModelo || ''),
    quant: quantDispAdesao,
    valorUnitario: item.valorUnitarioAta,
    valorTotal: item.valorUnitarioAta * quantDispAdesao,
    uasg: sanitizeSpreadsheetText(`${item.uasg} - ${item.orgaoNome}`),
    pregao: sanitizeSpreadsheetText(item.numeroCompra),
    numAta: sanitizeSpreadsheetText(item.numeroAta),
    item: item.numeroItemAta.toString(),
    validadeAta: item.dataVigenciaFinal.split('T')[0],
    quantAta: item.quantidadeAta,
    quantDispAdesao,
    autorizados: 0,
    saldoAdesao,
    processoSei: '',
    contato: sanitizeSpreadsheetText(contatoFormatado),
    status: withSaldo.saldoAdesao?.indicador === 'esgotado' ? 'Esgotado' : 
            withSaldo.saldoAdesao?.indicador === 'reduzido' ? 'Saldo Reduzido' :
            withSaldo.saldoAdesao?.indicador === 'vencido' ? 'Vencido' : 'Disponível',
    linkPesquisaAtas: `https://contratos.sistema.gov.br/transparencia/arp-item?palavra_chave=${encodeURIComponent(item.descricaoItem)}`,
    linkItemPncp: enriched.linkAtaPncp || '',
    notaEmpenho: '',
    contrato: '',
    vigencia: item.dataVigenciaFinal.split('T')[0],
    gestaoContrato: '',
    diasEncerramento: '',
  };
}

/**
 * Serializa um array de linhas tipadas em matriz bidimensional para APIs de planilhas.
 *
 * @template T
 * @param {T[]} rows - Objetos mapeados (`SheetRowConsumo`, `SheetRowPermanente` ou `SheetRowContrato`)
 * @param {string[]} _headers - Lista de cabeçalhos associada (mantida para alinhamento de contrato)
 * @returns {(string | number)[][]} Matriz de valores compatível com Google Sheets e Microsoft Graph
 */
export function rowsToSheetValues<T extends object>(
  rows: T[], 
  _headers: string[]
): (string | number)[][] {
  void _headers;
  return rows.map(row => Object.values(row).map(value => value ?? ''));
}

/**
 * Retorna os 23 cabeçalhos da aba `"Atas - Mat. Consumo"`.
 * @returns {string[]}
 */
export function getConsumoHeaders(): string[] {
  return [
    'Material', 'CATMAT', 'Marca / Modelo', 'Quant.', 'Valor Unit. Estimado',
    'Valor Unit. Ata', 'Valor Total Ata', 'Diferença', 'UASG', 'Pregão',
    'Nº Ata', 'Item', 'Validade Ata', 'Quant. Ata', 'Quant. Disp. p/ Adesão',
    'Autorizados', 'Saldo p/ Adesão', 'Contato', 'Link Ata PNCP', 'Link Saldo de Adesão',
    'Link Edital PNCP', 'Link Proposta do Item', 'Status'
  ];
}

/**
 * Retorna os 23 cabeçalhos da aba `"Atas - Mat. Permanente"`.
 * @returns {string[]}
 */
export function getPermanenteHeaders(): string[] {
  return [
    'ID Ata PNCP', 'Material', 'Marca / Modelo', 'Quant.', 'Disponíveis p/ Adesão',
    'Valor Unitário', 'Valor Total (Máx. Adesão)', 'UASG (Órgão Gerenciador)',
    'Pregão', 'Nº Ata', 'Item', 'Validade Ata', 'Processo SIPAC', 'Contato',
    'Status', 'Link Saldo de Adesão', 'Link item - PNCP', 'Link - Proposta',
    'NOTA DE EMPENHO', 'CONTRATO', 'VIGÊNCIA', 'GESTÃO DO CONTRATO', 'DIAS P/ ENCERRAMENTO'
  ];
}

/**
 * Retorna os 24 cabeçalhos da aba `"Atas - Contratos"`.
 * @returns {string[]}
 */
export function getContratoHeaders(): string[] {
  return [
    'Material', 'Marca / Modelo', 'Quant.', 'Valor Unitário', 'Valor Total',
    'UASG', 'Pregão', 'Nº Ata', 'Item', 'Validade Ata', 'Quant. Ata',
    'Quant. Disp. p/ Adesão', 'Autorizados', 'Saldo p/ Adesão', 'Processo SEI',
    'Contato', 'Status', 'Link Pesquisa Atas', 'Link item - PNCP',
    'NOTA DE EMPENHO', 'CONTRATO', 'VIGÊNCIA', 'GESTÃO DO CONTRATO', 'DIAS P/ ENCERRAMENTO'
  ];
}

/**
 * Seleciona o par `{ map, headers }` correspondente ao tipo de aba informado.
 *
 * @param {SheetType} type - Tipo da aba (`'consumo' | 'permanente' | 'contratos'`)
 * @returns {{ map: Function; headers: string[] }} Função de mapeamento e cabeçalhos
 */
export function getSheetMapper(type: SheetType) {
  switch (type) {
    case 'consumo':
      return { 
        map: mapToConsumoRow, 
        headers: getConsumoHeaders() 
      };
    case 'permanente':
      return { 
        map: mapToPermanenteRow, 
        headers: getPermanenteHeaders() 
      };
    case 'contratos':
      return { 
        map: mapToContratoRow, 
        headers: getContratoHeaders() 
      };
    default:
      return { 
        map: mapToConsumoRow, 
        headers: getConsumoHeaders() 
      };
  }
}