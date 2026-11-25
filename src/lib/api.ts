/**
 * @fileoverview Cliente HTTP para a API de Dados Abertos do Compras.gov.br (Módulo ARP).
 *
 * @module lib/api
 * @description Responsável por consultar itens de Atas de Registro de Preços com timeout
 * explícito de 15s, normalizar o payload bruto em `ARPItem` e aplicar filtros locais
 * complementares (palavra-chave e vigência na data atual).
 */
import axios from 'axios';
import { ARPItem, SearchFilters } from '@/types';

const API_BASE = 'https://dadosabertos.compras.gov.br/modulo-arp/2_consultarARPItem';
const EXTERNAL_API_TIMEOUT_MS = 15_000;
const SEARCH_PAGE_SIZE = 100;

interface APIResponse {
  resultado: RawARPItem[];
  totalRegistros: number;
  totalPaginas: number;
  paginasRestantes: number;
}

interface RawARPItem {
  // Apenas campos que sÃ£o realmente Ãºnicos na resposta da API
  numeroControlePncpAta: string;
  numeroAtaRegistroPreco: string;
  numeroItem: string;
  codigoItem: number;
  descricaoItem: string;
  tipoItem: string;
  quantidadeHomologadaItem: number;
  classificacaoFornecedor: string;
  niFornecedor: string;
  nomeRazaoSocialFornecedor: string;
  quantidadeHomologadaVencedor: number;
  valorUnitario: number;
  valorTotal: number;
  maximoAdesao: number;
  nomeUnidadeGerenciadora: string;
  nomeModalidadeCompra: string;
  idCompra: string;
  numeroControlePncpCompra: string;
  dataHoraInclusao: string;
  dataHoraAtualizacao: string;
  quantidadeEmpenhada: number;
  percentualMaiorDesconto: number;
  situacaoSicaf: string;
  dataHoraExclusao: string;
  itemExcluido: boolean;
  codigoPdm: number;
  nomePdm: string;
  codigoUnidadeGerenciadora?: string;
  numeroCompra?: string;
  anoCompra?: string;
  codigoModalidadeCompra?: string;
  dataAssinatura?: string;
  dataVigenciaInicial?: string;
  dataVigenciaFinal?: string;
}

/**
 * Consulta itens de Atas de Registro de Preços na API pública do Compras.gov.br.
 *
 * @description Executa requisição GET em `2_consultarARPItem` com limite de 100 itens por página
 * e timeout de 15s (`AbortController` + `axios.timeout`). Após o mapeamento para `ARPItem`,
 * aplica refinamento client-side para `palavraChave` e `apenasVigentesHoje`.
 *
 * @param {SearchFilters} filters - Critérios de busca validados
 * @returns {Promise<ARPItem[]>} Lista de itens normalizados
 * @throws {Error} Quando a API excede o timeout de 15s ou retorna erro HTTP/rede
 */
export async function fetchARPItems(filters: SearchFilters): Promise<ARPItem[]> {
  const params = new URLSearchParams();
  
  if (filters.codigoPdm) params.append('codigoPdm', filters.codigoPdm);
  if (filters.codigoCatmat) params.append('codigoCatmat', filters.codigoCatmat);
  if (filters.palavraChave) params.append('palavraChave', filters.palavraChave);
  if (filters.esfera && filters.esfera !== 'T') params.append('esfera', filters.esfera);
  if (filters.dataVigenciaInicialMin) params.append('dataVigenciaInicialMin', filters.dataVigenciaInicialMin);
  if (filters.dataVigenciaInicialMax) params.append('dataVigenciaInicialMax', filters.dataVigenciaInicialMax);
  
  params.append('pagina', '1');
  params.append('tamanhoPagina', String(SEARCH_PAGE_SIZE));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);
    const response = await axios.get<APIResponse>(`${API_BASE}?${params.toString()}`, {
      signal: controller.signal,
      timeout: EXTERNAL_API_TIMEOUT_MS,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    const items = response.data?.resultado || [];
    
    // Mapear campos da API para nossa interface
    let mappedItems = items.map(mapRawToARPItem);
    
    // Filtro local por palavra-chave na descriÃ§Ã£o
    if (filters.palavraChave) {
      const keyword = filters.palavraChave.toLowerCase();
      mappedItems = mappedItems.filter((item: ARPItem) => 
        item.descricaoItem?.toLowerCase().includes(keyword) ||
        item.marcaModelo?.toLowerCase().includes(keyword)
      );
    }

    // Filtro: apenas atas vigentes hoje
    if (filters.apenasVigentesHoje) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      mappedItems = mappedItems.filter((item: ARPItem) => {
        const dataFinal = new Date(item.dataVigenciaFinal);
        return dataFinal >= today;
      });
    }

    return mappedItems;
  } catch (error) {
    console.error('Erro ao buscar itens ARP:', error);
    if (axios.isCancel(error) || (error as { code?: string }).code === 'ECONNABORTED') {
      throw new Error('A API do Compras.gov.br demorou mais de 15 segundos para responder. Tente novamente.');
    }
    throw new Error('Falha ao consultar a API do Compras.gov.br');
  }
}

/**
 * Converte um registro bruto da API Compras.gov.br no contrato interno `ARPItem`.
 *
 * @description Preenche campos legados/calculados (`codigoCatmat` a partir de `codigoPdm`,
 * `valorUnitarioEstimado` espelhando `valorUnitario`, `esfera` padrão `'F'`) para manter
 * compatibilidade com os mappers de planilha e componentes de UI.
 *
 * @param {RawARPItem} raw - Objeto retornado em `resultado[]` pela API Compras.gov.br
 * @returns {ARPItem} Item padronizado no modelo de domínio da aplicação
 */
function mapRawToARPItem(raw: RawARPItem): ARPItem {
  return {
    // Campos diretos da API (Ãºnicos)
    numeroControlePncpAta: raw.numeroControlePncpAta,
    numeroAtaRegistroPreco: raw.numeroAtaRegistroPreco,
    numeroItem: raw.numeroItem,
    codigoItem: raw.codigoItem,
    descricaoItem: raw.descricaoItem,
    tipoItem: raw.tipoItem,
    quantidadeHomologadaItem: raw.quantidadeHomologadaItem,
    classificacaoFornecedor: raw.classificacaoFornecedor,
    niFornecedor: raw.niFornecedor,
    nomeRazaoSocialFornecedor: raw.nomeRazaoSocialFornecedor,
    quantidadeHomologadaVencedor: raw.quantidadeHomologadaVencedor,
    valorUnitario: raw.valorUnitario,
    valorTotal: raw.valorTotal,
    maximoAdesao: raw.maximoAdesao,
    nomeUnidadeGerenciadora: raw.nomeUnidadeGerenciadora,
    nomeModalidadeCompra: raw.nomeModalidadeCompra,
    idCompra: raw.idCompra,
    numeroControlePncpCompra: raw.numeroControlePncpCompra,
    dataHoraInclusao: raw.dataHoraInclusao,
    dataHoraAtualizacao: raw.dataHoraAtualizacao,
    quantidadeEmpenhada: raw.quantidadeEmpenhada,
    percentualMaiorDesconto: raw.percentualMaiorDesconto,
    situacaoSicaf: raw.situacaoSicaf,
    dataHoraExclusao: raw.dataHoraExclusao,
    itemExcluido: raw.itemExcluido,
    codigoPdm: raw.codigoPdm,
    nomePdm: raw.nomePdm,
    codigoUnidadeGerenciadora: raw.codigoUnidadeGerenciadora || '',
    numeroCompra: raw.numeroCompra || '',
    anoCompra: raw.anoCompra || '',
    codigoModalidadeCompra: raw.codigoModalidadeCompra || '',
    dataAssinatura: raw.dataAssinatura || '',
    dataVigenciaInicial: raw.dataVigenciaInicial || '',
    dataVigenciaFinal: raw.dataVigenciaFinal || '',
    
    // Campos calculados/mapeados para compatibilidade
    numeroAta: raw.numeroAtaRegistroPreco,
    numeroItemAta: parseInt(raw.numeroItem, 10) || 0,
    codigoPdmStr: String(raw.codigoPdm || 0),
    codigoCatmat: String(raw.codigoPdm || 0),
    marcaModelo: `${raw.tipoItem || ''} ${raw.nomePdm || ''}`.trim(),
    valorUnitarioEstimado: raw.valorUnitario || 0,
    valorUnitarioAta: raw.valorUnitario || 0,
    quantidadeAta: raw.quantidadeHomologadaItem || 0,
    uasg: raw.codigoUnidadeGerenciadora || '',
    orgaoNome: raw.nomeUnidadeGerenciadora || '',
    esfera: 'F',
    linkAtaPncp: '',
    linkEditalPncp: '',
    linkPropostaItem: '',
    contatoFornecedor: undefined,
    saldoAdesao: undefined,
  };
}

/**
 * Busca os detalhes de um item específico pelo código de controle PNCP da Ata.
 *
 * @param {string} numeroControlePncpAta - Código PNCP completo da Ata
 * @returns {Promise<ARPItem | null>} Primeiro item correspondente ou `null` em caso de ausência/falha
 */
export async function fetchARPItemDetails(numeroControlePncpAta: string): Promise<ARPItem | null> {
  try {
    const params = new URLSearchParams();
    params.append('numeroControlePncpAta', numeroControlePncpAta);
    params.append('pagina', '1');
    params.append('tamanhoPagina', '10');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);
    const response = await axios.get(`${API_BASE}?${params.toString()}`, {
      signal: controller.signal,
      timeout: EXTERNAL_API_TIMEOUT_MS,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    
    const items = response.data?.resultado || [];
    if (items.length === 0) return null;
    
    return mapRawToARPItem(items[0]);
  } catch (error) {
    console.error('Erro ao buscar detalhes do item ARP:', error);
    return null;
  }
}

/**
 * Formata uma instância `Date` no padrão `YYYY-MM-DD` para inputs HTML de data.
 *
 * @param {Date} date - Data a formatar
 * @returns {string} Data ISO truncada (`YYYY-MM-DD`)
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula o intervalo padrão de busca de vigência (últimos 12 meses até hoje).
 *
 * @returns {{ min: string; max: string }} Datas `min` e `max` no formato `YYYY-MM-DD`
 */
export function getDefaultDateRange(): { min: string; max: string } {
  const today = new Date();
  const max = formatDateForInput(today);
  
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 12);
  const min = formatDateForInput(minDate);
  
  return { min, max };
}

/**
 * Consulta a quantidade já autorizada em adesões ("caronas") para um item de Ata.
 *
 * @description Placeholder seguro até a integração do endpoint `/modulo-arp/5_consultarAdesoesItem`.
 * Retorna `0`, fazendo o cálculo assumir teto integral de 50% por órgão até consulta externa.
 *
 * @param {string} numeroControlePncpAta - Identificador PNCP da Ata
 * @returns {Promise<number>} Quantidade autorizada acumulada (atualmente `0`)
 */
export async function fetchAdesoesCaronas(): Promise<number> {
  // TODO: Implementar consulta ao endpoint /modulo-arp/5_consultarAdesoesItem
  return 0;
}

// Re-export from links.ts
export { enrichWithPncpLinks, enrichWithSaldoAdesao, fetchFornecedorContato, calcularSaldoAdesao, formatContatoPlanilha } from './links';
  