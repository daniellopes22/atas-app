/**
 * @fileoverview Utilitários centralizados para links de certidões e cópia segura de CNPJ.
 *
 * @module lib/certidoes-links
 * @description Centraliza a geração de URLs oficiais dos portais de certidões (TCU, Receita Federal,
 * FGTS/CAIXA, CNDT/TST), sanitização de CNPJ e cópia segura para área de transferência.
 * Não implementa automação de processos internos (SEI) — foco em triagem operacional.
 */

/**
 * Remove pontuação, espaços e caracteres não numéricos de um CNPJ,
 * validando que o resultado tem exatamente 14 dígitos.
 *
 * @param {string} cnpj - CNPJ com ou sem máscara (ex: "00.000.000/0000-00" ou "00000000000100")
 * @returns {string} CNPJ limpo com 14 dígitos
 * @throws {Error} Se o CNPJ não tiver exatamente 14 dígitos numéricos após limpeza
 *
 * @example
 * sanitizeCnpj('00.000.000/0000-00') // '00000000000000'
 * sanitizeCnpj('  00 000 000 0000 00  ') // '00000000000000'
 */
export function sanitizeCnpj(cnpj: string): string {
  const limpo = cnpj.replace(/\D/g, '');
  if (limpo.length !== 14) {
    throw new Error(`CNPJ inválido: esperado 14 dígitos, recebeu ${limpo.length} (entrada: "${cnpj}")`);
  }
  return limpo;
}

/**
 * Configuração de um portal de certidão.
 *
 * @interface PortalCertidao
 * @property {string} id - Identificador único do portal
 * @property {string} nome - Nome amigável para exibição na UI
 * @property {string} url - URL oficial do portal
 * @property {boolean} suportaAutoFillUrl - Se `true`, a URL aceita o CNPJ via query string (ex: TCU).
 *   Se `false`, o portal exige interação manual (CAPTCHA) e o CNPJ deve ser copiado manualmente.
 * @property {string} orgao - Órgão emissor/responsável
 */
export interface PortalCertidao {
  id: 'tcu' | 'receita' | 'fgts' | 'cndt';
  nome: string;
  url: string;
  suportaAutoFillUrl: boolean;
  orgao: string;
}

/**
 * Retorna a configuração dos 4 portais principais de verificação de regularidade.
 *
 * @param {string} cnpj - CNPJ já sanitizado (14 dígitos numéricos)
 * @returns {PortalCertidao[]} Array com os 4 portais configurados
 *
 * @example
 * const portais = getCertidoesPortais('00000000000100');
 * // portais[0].url === 'https://certidoes-apf.apps.tcu.gov.br/#/certidoes?cnpj=00000000000100'
 */
export function getCertidoesPortais(cnpj: string): PortalCertidao[] {
  const cnpjLimpo = sanitizeCnpj(cnpj);

  return [
    {
      id: 'tcu',
      nome: 'Nada Consta TCU',
      url: `https://certidoes-apf.apps.tcu.gov.br/#/certidoes?cnpj=${cnpjLimpo}`,
      suportaAutoFillUrl: true,
      orgao: 'TCU / CNJ / CEIS / CNEP (Consulta Consolidada)',
    },
    {
      id: 'receita',
      nome: 'Receita Federal / PGFN',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir',
      suportaAutoFillUrl: false,
      orgao: 'Receita Federal do Brasil / PGFN',
    },
    {
      id: 'fgts',
      nome: 'FGTS / CRF (CAIXA)',
      url: 'https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf',
      suportaAutoFillUrl: false,
      orgao: 'Caixa Econômica Federal',
    },
    {
      id: 'cndt',
      nome: 'CNDT / Justiça do Trabalho',
      url: 'https://cndt-certidao.tst.jus.br/inicio.faces',
      suportaAutoFillUrl: false,
      orgao: 'TST / Justiça do Trabalho',
    },
  ];
}

/**
 * Copia o CNPJ limpo (14 dígitos) para a área de transferência.
 * Funciona tanto em contextos seguros (HTTPS) quanto em HTTP/localhost.
 *
 * @param {string} cnpjLimpo - CNPJ já sanitizado (14 dígitos)
 * @returns {Promise<boolean>} `true` se copiou com sucesso, `false` caso contrário
 *
 * @example
 * await copyCnpjToClipboard('00000000000100'); // true
 */
export async function copyCnpjToClipboard(cnpjLimpo: string): Promise<boolean> {
  // Clipboard API moderna (requer contexto seguro: HTTPS ou localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(cnpjLimpo);
      return true;
    } catch {
      // Fallback silencioso para o método legacy
    }
  }

  // Fallback: textarea temporário + execCommand (funciona em HTTP)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = cnpjLimpo;
    // Evita scroll e mantém fora da tela
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    const sucesso = document.execCommand('copy');
    document.body.removeChild(textarea);
    return sucesso;
  } catch {
    return false;
  }
}

/**
 * Gera o resumo objetivo da verificação de regularidade para gravação na planilha compartilhada.
 *
 * @param {object} params - Parâmetros da verificação
 * @param {boolean} params.tcuOk - Se a consulta TCU/Compras.gov não encontrou impedimentos
 * @param {string} [params.detalheImpedimento] - Descrição do impedimento encontrado (se houver)
 * @param {Date} [params.dataVerificacao=new Date()] - Data/hora da verificação
 * @returns {string} Texto formatado para a coluna de observações da planilha
 *
 * @example
 * formatarResumoRegularidade({ tcuOk: true })
 * // '| Situação: Sem restrições TCU/Compras.gov (25/11/2026)'
 *
 * formatarResumoRegularidade({ tcuOk: false, detalheImpedimento: 'CEIS - Empresa inidônea' })
 * // '| ALERTA: Consta restrição TCU/Compras.gov - CEIS - Empresa inidônea (25/11/2026)'
 */
export function formatarResumoRegularidade(params: {
  tcuOk: boolean;
  detalheImpedimento?: string;
  dataVerificacao?: Date;
}): string {
  const data = params.dataVerificacao || new Date();
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (params.tcuOk) {
    return `| Situação: Sem restrições TCU/Compras.gov (${dataFormatada})`;
  }

  const detalhe = params.detalheImpedimento ? ` - ${params.detalheImpedimento}` : '';
  return `| ALERTA: Consta restrição TCU/Compras.gov${detalhe} (${dataFormatada})`;
}