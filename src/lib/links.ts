/**
 * @fileoverview Utilitários de links PNCP/Comprasnet, enriquecimento cadastral via BrasilAPI
 * e motor de cálculo de saldo de adesão ("carona") conforme Lei 14.133/2021.
 *
 * @module lib/links
 */
import { ARPItem, FornecedorContato, SaldoAdesao } from '@/types';

/**
 * Valida e normaliza uma URL garantindo estritamente protocolo `https:`.
 *
 * @description Previne injeção de esquemas inseguros (`javascript:`, `data:`, `http:`)
 * antes de gravar links em células de planilhas ou renderizar âncoras na UI.
 *
 * @param {string} value - URL candidata a validação
 * @returns {string} URL normalizada se válida e HTTPS; caso contrário string vazia
 */
export function safeHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

/**
 * Converte o identificador PNCP da Ata no link web oficial da Ata no portal PNCP.
 *
 * @description O padrão da API Compras.gov.br (`CNPJ-MODALIDADE-SEQCOMPRA/ANO-SEQATA`)
 * possui zeros à esquerda que devem ser removidos ao montar a rota REST do portal PNCP.
 *
 * @param {string} numeroControlePncpAta - Código de controle PNCP (ex: `"00394494000136-1-000918/2025-000004"`)
 * @returns {string} URL HTTPS da Ata no PNCP ou string vazia se o formato for inválido
 *
 * @example
 * convertToPncpAtaLink('00394494000136-1-000918/2025-000004')
 * // => 'https://pncp.gov.br/app/atas/00394494000136/2025/918/4'
 */
export function convertToPncpAtaLink(numeroControlePncpAta: string): string {
  const match = numeroControlePncpAta.match(/^(\d{14})-(\d)-(\d{6})\/(\d{4})-(\d+)$/);
  if (!match) return '';

  const [, cnpj, , seqCompra, ano, seqAta] = match;
  const seqCompraLimpo = parseInt(seqCompra, 10).toString();
  const seqAtaLimpo = parseInt(seqAta, 10).toString();

  return safeHttpsUrl(`https://pncp.gov.br/app/atas/${cnpj}/${ano}/${seqCompraLimpo}/${seqAtaLimpo}`);
}

/**
 * Converte o identificador PNCP da Ata no link web do Edital da contratação no PNCP.
 *
 * @param {string} numeroControlePncpAta - Código de controle PNCP da Ata
 * @returns {string} URL HTTPS do Edital no PNCP ou string vazia se inválido
 *
 * @example
 * convertToPncpEditalLink('00394494000136-1-000918/2025-000004')
 * // => 'https://pncp.gov.br/app/editais/00394494000136/2025/918'
 */
export function convertToPncpEditalLink(numeroControlePncpAta: string): string {
  const match = numeroControlePncpAta.match(/^(\d{14})-(\d)-(\d{6})\/(\d{4})-(\d+)$/);
  if (!match) return '';

  const [, cnpj, , seqCompra, ano] = match;
  const seqCompraLimpo = parseInt(seqCompra, 10).toString();

  return safeHttpsUrl(`https://pncp.gov.br/app/editais/${cnpj}/${ano}/${seqCompraLimpo}`);
}

/**
 * Gera o link direto de acompanhamento da proposta do item no Comprasnet Web.
 *
 * @description O identificador `compra` do Comprasnet concatena:
 * `UASG (6 dígitos) + código de modalidade "05" (Pregão) + número do pregão (9 dígitos)`.
 *
 * @param {ARPItem} item - Item de ARP contendo `codigoUnidadeGerenciadora`/`uasg`, `numeroCompra` e `numeroItem`
 * @returns {string} URL HTTPS da proposta do item no Comprasnet
 *
 * @example
 * // UASG 153178 + "05" + Pregão 900142025 => compra=15317805900142025
 */
export function convertToPropostaItemLink(item: ARPItem): string {
  const uasg = (item.codigoUnidadeGerenciadora || item.uasg || '').padStart(6, '0');
  const pregao = (item.numeroCompra || '').replace(/\D/g, '').padStart(9, '0');
  const numeroItem = item.numeroItem || String(item.numeroItemAta || '');

  const compraId = `${uasg}05${pregao}`;

  return safeHttpsUrl(`https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/${numeroItem}?compra=${compraId}`);
}

/**
 * Enriquece um item ARP com os três links oficiais derivados (Ata PNCP, Edital PNCP e Proposta Comprasnet).
 *
 * @param {ARPItem} item - Item de ARP bruto ou parcialmente enriquecido
 * @returns {ARPItem} Novo objeto `ARPItem` com `linkAtaPncp`, `linkEditalPncp` e `linkPropostaItem`
 */
export function enrichWithPncpLinks(item: ARPItem): ARPItem {
  return {
    ...item,
    linkAtaPncp: convertToPncpAtaLink(item.numeroControlePncpAta),
    linkEditalPncp: convertToPncpEditalLink(item.numeroControlePncpAta),
    linkPropostaItem: convertToPropostaItemLink(item),
  };
}

/**
 * Consulta dados cadastrais públicos do fornecedor via BrasilAPI pelo CNPJ/NI.
 *
 * @description Falhas de rede, timeouts (15s) ou CNPJs inválidos não interrompem o fluxo principal;
 * retornam `null` para degradação graciosa na UI e na exportação.
 *
 * @param {string} niFornecedor - CNPJ com ou sem máscara (14 dígitos numéricos esperados)
 * @returns {Promise<FornecedorContato | null>} Dados de contato ou `null` quando indisponível
 */
export async function fetchFornecedorContato(niFornecedor: string): Promise<FornecedorContato | null> {
  try {
    const cnpjLimpo = niFornecedor.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return null;

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;

    const data = await response.json();

    return {
      cnpj: data.cnpj,
      razaoSocial: data.razao_social || data.nome_fantasia || '',
      email: data.email || '',
      telefone: data.telefone || data.ddd_telefone || '',
    };
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    return null;
  }
}

/**
 * Formata os dados do fornecedor no bloco multilinha exigido pela planilha institucional.
 *
 * @param {FornecedorContato | null} contato - Dados de contato retornados pela BrasilAPI ou `null`
 * @returns {string} Bloco formatado com rótulos `CNPJ`, `RAZÃO SOCIAL`, `E-MAIL` e `TELEFONE`
 */
export function formatContatoPlanilha(contato: FornecedorContato | null): string {
  if (!contato) return 'CNPJ: \nRAZÃO SOCIAL: \nE-MAIL: \nTELEFONE: ';

  return `CNPJ: ${contato.cnpj}\nRAZÃO SOCIAL: ${contato.razaoSocial}\nE-MAIL: ${contato.email || ''}\nTELEFONE: ${contato.telefone || ''}`;
}

/**
 * Calcula o saldo disponível para adesão ("carona") conforme os limites da Lei nº 14.133/2021.
 *
 * @description Regras legais implementadas:
 * - **Art. 86, § 4º**: cada órgão/entidade não participante pode aderir até **50%** da quantidade homologada (`Math.floor(quantidadeAta / 2)`).
 * - **Art. 86, § 5º**: o somatório das adesões não pode exceder o **dobro** da quantidade registrada (`(quantidadeAta * 2) - quantidadeAutorizada`).
 * - Saldo efetivo do órgão solicitante: `min(limiteOrgaoCarona, saldoGlobalRestante)`.
 * - Indicador `'reduzido'` quando o saldo restante for $\le 20\%$ do teto individual.
 *
 * @param {number} quantidadeAta - Quantidade total homologada na ARP
 * @param {number} [quantidadeAutorizada=0] - Soma já autorizada a outros órgãos carona
 * @returns {SaldoAdesao} Estrutura completa de saldos e indicador semafórico
 */
export function calcularSaldoAdesao(
  quantidadeAta: number,
  quantidadeAutorizada: number = 0
): SaldoAdesao {
  const limiteOrgaoCarona = Math.floor(quantidadeAta / 2);
  const saldoGlobalRestante = (quantidadeAta * 2) - quantidadeAutorizada;
  const saldoDisponivelOrgao = Math.min(limiteOrgaoCarona, saldoGlobalRestante);

  let indicador: SaldoAdesao['indicador'] = 'disponivel';
  if (saldoDisponivelOrgao <= 0) {
    indicador = 'esgotado';
  } else if (saldoDisponivelOrgao <= limiteOrgaoCarona * 0.2) {
    indicador = 'reduzido';
  }

  return {
    quantidadeHomologada: quantidadeAta,
    limiteOrgaoCarona,
    quantidadeAutorizada,
    saldoGlobalRestante,
    saldoDisponivelOrgao,
    indicador,
  };
}

/**
 * Enriquece um item ARP com o saldo de adesão calculado e sobrescreve o indicador para `'vencido'`
 * caso `dataVigenciaFinal` seja anterior à data corrente (meia-noite local).
 *
 * @param {ARPItem} item - Item de ARP a enriquecer
 * @param {number} [autorizados=0] - Quantidade total já autorizada em adesões anteriores
 * @returns {ARPItem} Novo objeto `ARPItem` contendo `saldoAdesao` atualizado
 */
export function enrichWithSaldoAdesao(item: ARPItem, autorizados: number = 0): ARPItem {
  const saldo = calcularSaldoAdesao(item.quantidadeAta, autorizados);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dataFinal = new Date(item.dataVigenciaFinal);
  if (dataFinal < today) {
    saldo.indicador = 'vencido';
  }

  return {
    ...item,
    saldoAdesao: saldo,
  };
}