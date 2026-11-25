/**
 * @file src/types/index.ts
 * @description Tipos compartilhados da aplicação Pesquisa de Atas RP.
 * Define contratos de dados para itens de ARP, planilhas, sessão de usuário e filtros de busca.
 * @module types
 */

/**
 * Representa um item de Ata de Registro de Preços (ARP) retornado pela API de Dados Abertos do Compras.gov.br.
 * 
 * @interface ARPItem
 * @description Mapeia os campos da resposta da API `VwFtArpItemDTO` (endpoint `modulo-arp/2_consultarARPItem`)
 * e adiciona campos calculados para compatibilidade com a UI e planilhas.
 * 
 * @example
 * ```typescript
 * const item: ARPItem = {
 *   numeroControlePncpAta: "00394494000136-1-000918/2025-000004",
 *   numeroAtaRegistroPreco: "00003/2025",
 *   // ... demais campos
 * };
 * ```
 */
export interface ARPItem {
  // ========================================================
  // Campos diretos da API VwFtArpItemDTO (únicos)
  // ========================================================
  /** Identificador único da Ata no PNCP. Formato: `CNPJ-SEQUENCIAL/ANO-SEQUENCIAL` (ex: `00394494000136-1-000918/2025-000004`) */
  numeroControlePncpAta: string;
  /** Número da Ata de Registro de Preços (ex: `00003/2025`) */
  numeroAtaRegistroPreco: string;
  /** Número do item na Ata (string na API) */
  numeroItem: string;
  /** Código interno do item */
  codigoItem: number;
  /** Descrição completa do item */
  descricaoItem: string;
  /** Tipo do item (ex: `Material`, `Serviço`) */
  tipoItem: string;
  /** Quantidade homologada na Ata */
  quantidadeHomologadaItem: number;
  /** Classificação do fornecedor (ex: `ME`, `EPP`, `DEMAIS`) */
  classificacaoFornecedor: string;
  /** Número de identificação do fornecedor (CNPJ/CPF) */
  niFornecedor: string;
  /** Razão social ou nome fantasia do fornecedor */
  nomeRazaoSocialFornecedor: string;
  /** Quantidade homologada para o vencedor */
  quantidadeHomologadaVencedor: number;
  /** Valor unitário do item na Ata */
  valorUnitario: number;
  /** Valor total do item na Ata */
  valorTotal: number;
  /** Máximo de adesão permitido (percentual) */
  maximoAdesao: number;
  /** Nome da unidade gerenciadora (órgão) */
  nomeUnidadeGerenciadora: string;
  /** Nome da modalidade de compra (ex: `Pregão Eletrônico`) */
  nomeModalidadeCompra: string;
  /** ID da compra */
  idCompra: string;
  /** Número de controle PNCP da compra */
  numeroControlePncpCompra: string;
  /** Data/hora de inclusão do registro */
  dataHoraInclusao: string;
  /** Data/hora de atualização do registro */
  dataHoraAtualizacao: string;
  /** Quantidade empenhada */
  quantidadeEmpenhada: number;
  /** Percentual do maior desconto */
  percentualMaiorDesconto: number;
  /** Situação no SICAF */
  situacaoSicaf: string;
  /** Data/hora de exclusão (se aplicável) */
  dataHoraExclusao: string;
  /** Flag se item foi excluído */
  itemExcluido: boolean;
  /** Código PDM do item */
  codigoPdm: number;
  /** Nome/descrição do PDM */
  nomePdm: string;
  /** Código da unidade gerenciadora (UASG) */
  codigoUnidadeGerenciadora: string;
  /** Número da compra/pregão */
  numeroCompra: string;
  /** Ano da compra */
  anoCompra: string;
  /** Código da modalidade de compra */
  codigoModalidadeCompra: string;
  /** Data de assinatura da Ata */
  dataAssinatura: string;
  /** Data inicial de vigência da Ata (ISO 8601) */
  dataVigenciaInicial: string;
  /** Data final de vigência da Ata (ISO 8601) */
  dataVigenciaFinal: string;
  
  // ========================================================
  // Campos calculados/mapeados para compatibilidade
  // ========================================================
  /** Alias para `numeroAtaRegistroPreco` */
  numeroAta: string;
  /** Número do item como inteiro */
  numeroItemAta: number;
  /** Código PDM como string */
  codigoPdmStr: string;
  /** Código CATMAT (não disponível na API, usa PDM como fallback) */
  codigoCatmat: string;
  /** Marca/Modelo composto: `tipoItem + " " + nomePdm` */
  marcaModelo: string;
  /** Valor unitário estimado (não disponível na API, usa valorUnitario) */
  valorUnitarioEstimado: number;
  /** Valor unitário da Ata (alias para valorUnitario) */
  valorUnitarioAta: number;
  /** Quantidade da Ata (alias para quantidadeHomologadaItem) */
  quantidadeAta: number;
  /** UASG (alias para codigoUnidadeGerenciadora) */
  uasg: string;
  /** Nome do órgão (alias para nomeUnidadeGerenciadora) */
  orgaoNome: string;
  /** Esfera de governo: Federal (F), Estadual (E), Municipal (M). Não disponível na API, default 'F' */
  esfera: 'F' | 'E' | 'M';
  
  // ========================================================
  // Campos calculados (preenchidos via enrichers)
  // ========================================================
  /** Link reconstruído para a Ata no PNCP */
  linkAtaPncp?: string;
  /** Link reconstruído para o Edital no PNCP */
  linkEditalPncp?: string;
  /** Link reconstruído para a proposta do item no Comprasnet */
  linkPropostaItem?: string;
  /** Dados de contato do fornecedor enriquecidos via BrasilAPI */
  contatoFornecedor?: FornecedorContato;
  /** Saldo de adesão/carona calculado conforme Lei 14.133/2021 */
  saldoAdesao?: SaldoAdesao;
}

/**
 * Dados de contato do fornecedor enriquecidos via BrasilAPI CNPJ.
 * 
 * @interface FornecedorContato
 * @description Retornado pela função `fetchFornecedorContato` em `src/lib/links.ts`.
 * Usado para preencher a coluna "Fornecedor & Contatos" nas planilhas.
 */
export interface FornecedorContato {
  /** CNPJ formatado (14 dígitos) */
  cnpj: string;
  /** Razão social do fornecedor */
  razaoSocial: string;
  /** E-mail do fornecedor (se disponível na BrasilAPI) */
  email?: string;
  /** Telefone do fornecedor (se disponível na BrasilAPI) */
  telefone?: string;
}

/**
 * Estrutura do saldo de adesão/carona calculado conforme Lei 14.133/2021.
 * 
 * @interface SaldoAdesao
 * @description Implementa as regras do Art. 86, §§ 4º e 5º da Lei nº 14.133/2021:
 * - **§ 4º (Limite individual por órgão carona):** 50% da quantidade homologada, arredondado para baixo (`Math.floor(quantidadeAta / 2)`)
 * - **§ 5º (Teto global):** Dobro da quantidade homologada menos adesões já autorizadas (`(quantidadeAta * 2) - quantidadeAutorizada`)
 * - **Saldo disponível real:** Mínimo entre o limite individual e o saldo global restante
 * 
 * @example
 * ```typescript
 * // Quantidade homologada = 10, 0 autorizados
 * // limiteOrgaoCarona = 5 (50% de 10)
 * // saldoGlobalRestante = 20 (2x10 - 0)
 * // saldoDisponivelOrgao = 5 (min(5, 20))
 * const saldo = calcularSaldoAdesao(10, 0);
 * ```
 */
export interface SaldoAdesao {
  /** Quantidade homologada na Ata (base para cálculos) */
  quantidadeHomologada: number;
  /** Limite de 50% por órgão carona (Art. 86, § 4º) - arredondado para baixo */
  limiteOrgaoCarona: number;
  /** Quantidade já autorizada para adesão (atualmente 0 - stub) */
  quantidadeAutorizada: number;
  /** Saldo global restante = (quantidadeAta * 2) - autorizados (Art. 86, § 5º) */
  saldoGlobalRestante: number;
  /** Saldo real disponível para o órgão = min(limiteOrgaoCarona, saldoGlobalRestante) */
  saldoDisponivelOrgao: number;
  /** Indicador visual: 'disponivel' (verde), 'reduzido' (amarelo ≤20%), 'esgotado' (vermelho = 0), 'vencido' (vermelho se data final < hoje) */
  indicador: 'disponivel' | 'reduzido' | 'esgotado' | 'vencido';
}

/**
 * Filtros de busca para consulta de itens ARP na API do Compras.gov.br.
 * 
 * @interface SearchFilters
 * @description Mapeia diretamente aos parâmetros de query do endpoint `modulo-arp/2_consultarARPItem`.
 * O filtro `apenasVigentesHoje` é aplicado localmente após a resposta da API.
 */
export interface SearchFilters {
  /** Código PDM para busca exata */
  codigoPdm?: string;
  /** Código CATMAT para busca exata (não disponível na API, mapeado de PDM) */
  codigoCatmat?: string;
  /** Palavra-chave para busca textual na descrição/marca (aplicado localmente) */
  palavraChave?: string;
  /** Esfera de governo: Federal (F), Estadual (E), Municipal (M), Todas (T) */
  esfera: 'F' | 'E' | 'M' | 'T';
  /** Data inicial mínima de vigência (YYYY-MM-DD) */
  dataVigenciaInicialMin?: string;
  /** Data inicial máxima de vigência (YYYY-MM-DD) */
  dataVigenciaInicialMax?: string;
  /** Se true, filtra apenas atas com dataVigenciaFinal >= hoje (aplicado localmente) */
  apenasVigentesHoje: boolean;
}

/**
 * Mapa de seleção de itens para exportação/escrita em planilha.
 * 
 * @interface SelectedItems
 * @description Chave = `numeroControlePncpAta` do item, Valor = boolean (selecionado).
 * Mantido no estado do componente pai (`BuscarPage`) para persistir seleção entre buscas e trocas de visualização.
 */
export interface SelectedItems {
  [key: string]: boolean;
}

/**
 * Estrutura de linha para a aba "Atas - Mat. Consumo" (17 colunas A-Q + extras).
 * 
 * @interface SheetRowConsumo
 * @description Mapeamento direto para escrita no Google Sheets / Excel Online.
 * Colunas com fórmulas (D, G, H, O, Q) são preenchidas como valores calculados;
 * a planilha padrão institucional (`spreadsheet-template.ts`) define as fórmulas nativas.
 * 
 * @see {@link mapToConsumoRow} em `src/lib/sheetMapping.ts`
 * @see {@link buildStandardWorkbook} em `src/lib/spreadsheet-template.ts`
 */
export interface SheetRowConsumo {
  /** Col A - Descrição do material (sanitizada contra formula injection) */
  material: string;
  /** Col B - Código CATMAT (fallback para PDM) */
  catmat: string;
  /** Col C - Marca/Modelo (sanitizada) */
  marcaModelo: string;
  /** Col D - Quantidade para adesão = floor(quantidadeAta / 2) */
  quant: number;
  /** Col E - Valor unitário estimado (não disponível na API, usa valor da Ata) */
  valorUnitEstimado: number;
  /** Col F - Valor unitário da Ata */
  valorUnitAta: number;
  /** Col G - Valor total = F * D (fórmula na planilha padrão) */
  valorTotalAta: number;
  /** Col H - Diferença % = (F-E)/E (fórmula na planilha padrão) */
  diferenca: number;
  /** Col I - UASG + Nome do órgão (sanitizada) */
  uasg: string;
  /** Col J - Número do Pregão/Compra (sanitizada) */
  pregao: string;
  /** Col K - Número da Ata (sanitizada) */
  numAta: string;
  /** Col L - Número do item na Ata */
  item: number;
  /** Col M - Data final de vigência (YYYY-MM-DD) */
  validadeAta: string;
  /** Col N - Quantidade homologada na Ata */
  quantAta: number;
  /** Col O - Quantidade disponível para adesão = N/2 (fórmula na planilha padrão) */
  quantDispAdesao: number;
  /** Col P - Quantidade já autorizada (atualmente 0 - stub) */
  autorizados: number;
  /** Col Q - Saldo para adesão calculado (fórmula na planilha padrão) */
  saldoAdesao: number;
  /** Col R - Contato do fornecedor formatado (sanitizada) */
  contato: string;
  /** Col S - Link da Ata no PNCP */
  linkAtaPncp: string;
  /** Col T - Link do saldo de adesão (aponta para PNCP) */
  linkSaldoAdesao: string;
  /** Col U - Link do Edital no PNCP */
  linkEditalPncp: string;
  /** Col V - Link da proposta do item no Comprasnet */
  linkPropostaItem: string;
  /** Col W - Status: 'Disponível', 'Saldo Reduzido', 'Esgotado', 'Vencido' */
  status: string;
  /** Col X - Resumo de regularidade do fornecedor (TCU/Compras.gov) */
  regularidade: string;
}

/**
 * Estrutura de linha para a aba "Atas - Mat. Permanente" (23 colunas A-W).
 * 
 * @interface SheetRowPermanente
 * @description Estrutura específica para materiais permanentes com campos adicionais
 * de gestão contratual (SIPAC, nota de empenho, dias para encerramento).
 * 
 * @see {@link mapToPermanenteRow} em `src/lib/sheetMapping.ts`
 */
export interface SheetRowPermanente {
  /** Col A - Link da Ata no PNCP (ID) */
  idAtaPncp: string;
  /** Col B - Descrição do material (sanitizada) */
  material: string;
  /** Col C - Marca/Modelo (sanitizada) */
  marcaModelo: string;
  /** Col D - Quantidade homologada na Ata */
  quantAta: number;
  /** Col E - Disponíveis p/ adesão = ROUNDDOWN(D/2,0) (fórmula na planilha padrão) */
  dispAdesao: number;
  /** Col F - Valor unitário da Ata */
  valorUnitario: number;
  /** Col G - Valor total máx. adesão = E * F (fórmula na planilha padrão) */
  valorTotal: number;
  /** Col H - UASG + Órgão (sanitizada) */
  uasg: string;
  /** Col I - Pregão (sanitizada) */
  pregao: string;
  /** Col J - Número da Ata (sanitizada) */
  numAta: string;
  /** Col K - Item (string) */
  item: string;
  /** Col L - Validade da Ata (YYYY-MM-DD) */
  validadeAta: string;
  /** Col M - Processo SIPAC (vazio - preenchimento manual) */
  processoSipac: string;
  /** Col N - Contato do fornecedor formatado (sanitizada) */
  contato: string;
  /** Col O - Status */
  status: string;
  /** Col P - Link saldo de adesão */
  linkSaldoAdesao: string;
  /** Col Q - Link item PNCP */
  linkItemPncp: string;
  /** Col R - Link proposta */
  linkProposta: string;
  /** Col S - Nota de empenho (vazio) */
  notaEmpenho: string;
  /** Col T - Contrato (vazio) */
  contrato: string;
  /** Col U - Vigência (YYYY-MM-DD) */
  vigencia: string;
  /** Col V - Gestão do contrato (vazio) */
  gestaoContrato: string;
  /** Col W - Dias p/ encerramento (vazio) */
  diasEncerramento: string;
  /** Col X - Resumo de regularidade do fornecedor (TCU/Compras.gov) */
  regularidade: string;
}

/**
 * Estrutura de linha para a aba "Atas - Contratos" (25 colunas A-Y).
 * 
 * @interface SheetRowContrato
 * @description Estrutura para contratos com campos de gestão (SEI, dias encerramento).
 * Inclui link para pesquisa de atas no sistema de contratos.
 * 
 * @see {@link mapToContratoRow} em `src/lib/sheetMapping.ts`
 */
export interface SheetRowContrato {
  /** Col A - Material (sanitizada) */
  material: string;
  /** Col B - Marca/Modelo (sanitizada) */
  marcaModelo: string;
  /** Col C - Quantidade para adesão = floor(quantidadeAta / 2) */
  quant: number;
  /** Col D - Valor unitário */
  valorUnitario: number;
  /** Col E - Valor total = C * D */
  valorTotal: number;
  /** Col F - UASG (sanitizada) */
  uasg: string;
  /** Col G - Pregão (sanitizada) */
  pregao: string;
  /** Col H - Número da Ata (sanitizada) */
  numAta: string;
  /** Col I - Item (string) */
  item: string;
  /** Col J - Validade da Ata (YYYY-MM-DD) */
  validadeAta: string;
  /** Col K - Quantidade homologada na Ata */
  quantAta: number;
  /** Col L - Quantidade disponível p/ adesão */
  quantDispAdesao: number;
  /** Col M - Autorizados (0) */
  autorizados: number;
  /** Col N - Saldo p/ adesão */
  saldoAdesao: number;
  /** Col O - Processo SEI (vazio) */
  processoSei: string;
  /** Col P - Contato formatado (sanitizada) */
  contato: string;
  /** Col Q - Status */
  status: string;
  /** Col R - Link pesquisa atas no sistema de contratos */
  linkPesquisaAtas: string;
  /** Col S - Link item PNCP */
  linkItemPncp: string;
  /** Col T - Nota de empenho (vazio) */
  notaEmpenho: string;
  /** Col U - Contrato (vazio) */
  contrato: string;
  /** Col V - Vigência (YYYY-MM-DD) */
  vigencia: string;
  /** Col W - Gestão do contrato (vazio) */
  gestaoContrato: string;
  /** Col X - Dias p/ encerramento (vazio) */
  diasEncerramento: string;
  /** Col Y - Resumo de regularidade do fornecedor (TCU/Compras.gov) */
  regularidade: string;
}

/**
 * Tipo de aba de planilha suportada pelo sistema.
 * 
 * @type SheetType
 * @description Correspondente às três abas de dados da planilha padrão institucional:
 * - `consumo` → "Atas - Mat. Consumo"
 * - `permanente` → "Atas - Mat. Permanente"
 * - `contratos` → "Atas - Contratos"
 */
export type SheetType = 'consumo' | 'permanente' | 'contratos';

/**
 * Representa uma planilha conectada (Google Sheets ou Excel Online).
 * 
 * @interface ConnectedSpreadsheet
 * @description Retornado pelas APIs de listagem (`/api/planilha/listar`).
 * O campo `sheets` contém os nomes das abas/worksheets disponíveis.
 */
export interface ConnectedSpreadsheet {
  /** ID único da planilha (fileId no Google Drive / itemId no OneDrive) */
  id: string;
  /** Nome do arquivo */
  name: string;
  /** Provedor de armazenamento */
  provider: 'google' | 'microsoft';
  /** Lista de nomes das abas/worksheets */
  sheets: string[];
  /** Aba atualmente selecionada pelo usuário */
  selectedSheet?: string;
  /** ID do drive (SharePoint/OneDrive) quando aplicável */
  driveId?: string;
}

/**
 * Sessão do usuário autenticado com tokens OAuth.
 * 
 * @interface UserSession
 * @description Estendida pelo NextAuth em `src/auth.ts` via module augmentation.
 * Contém tokens de acesso/refresh para chamadas às APIs do Google/Microsoft Graph.
 */
export interface UserSession {
  /** Provedor de autenticação usado */
  provider: 'google' | 'microsoft';
  /** Access token OAuth 2.0 para APIs (Google Sheets / Microsoft Graph) */
  accessToken: string;
  /** Refresh token (se disponível, para renovação offline) */
  refreshToken?: string;
  /** Timestamp de expiração do access token (ms desde epoch) */
  expiresAt: number;
  /** Planilha conectada atualmente (se houver) */
  spreadsheet?: ConnectedSpreadsheet;
}

// ========================================================
// Tipos para Triagem de Regularidade do Fornecedor
// ========================================================

/**
 * Estados possíveis de uma verificação de certidão/regularidade.
 * 
 * @type VerificacaoEstado
 * @description 'carregando' - consulta em andamento
 *              'sem_restricoes' - verificação automática confirmou ausência de impedimentos
 *              'impedimento' - verificação automática encontrou restrição
 *              'conferido' - servidor marcou manualmente como verificado no portal
 *              'erro' - falha na consulta automática (API indisponível)
 */
export type VerificacaoEstado = 'carregando' | 'sem_restricoes' | 'impedimento' | 'conferido' | 'erro';

/**
 * Resultado da verificação de regularidade em um portal específico.
 * 
 * @interface VerificacaoPortal
 * @description Usado para exibir o estado de cada um dos 4 portais na UI.
 */
export interface VerificacaoPortal {
  /** Identificador do portal (tcu, receita, fgts, cndt) */
  id: 'tcu' | 'receita' | 'fgts' | 'cndt';
  /** Nome amigável para exibição */
  nome: string;
  /** Estado atual da verificação */
  estado: VerificacaoEstado;
  /** Detalhe do impedimento encontrado (se estado === 'impedimento') */
  detalheImpedimento?: string;
  /** Se o servidor marcou manualmente como conferido */
  conferidoManualmente?: boolean;
  /** Data/hora da última verificação (ISO 8601) */
  verificadoEm?: string;
}

/**
 * Resumo consolidado de regularidade do fornecedor.
 * 
 * @interface ResumoRegularidade
 * @description Agrega o estado dos 4 portais para exibição na UI e gravação na planilha.
 */
export interface ResumoRegularidade {
  /** CNPJ sanitizado do fornecedor (14 dígitos) */
  cnpj: string;
  /** Razão social do fornecedor */
  razaoSocial: string;
  /** Estado geral: 'sem_restricoes' se TCU/Compras.gov OK, 'impedimento' se houver restrição, 'pendente' se APIs falharam */
  estadoGeral: 'sem_restricoes' | 'impedimento' | 'pendente';
  /** Estado de cada portal individual */
  portais: VerificacaoPortal[];
  /** Data/hora da última verificação completa (ISO 8601) */
  atualizadoEm: string;
  /** Texto formatado para gravação na planilha compartilhada */
  textoParaPlanilha: string;
}

/**
 * Configuração de um portal de certidão (re-exportado de certidoes-links para tipagem).
 * 
 * @interface PortalCertidao
 */
export interface PortalCertidao {
  id: 'tcu' | 'receita' | 'fgts' | 'cndt';
  nome: string;
  url: string;
  suportaAutoFillUrl: boolean;
  orgao: string;
}

/** Situação cadastral no SICAF */
export type SicafSituacao = 'NAO_ENCONTRADO' | 'REGULAR' | 'PENDENTE' | 'SUSPENSO' | 'BAIXADO' | 'INAPTO' | 'CADASTRADO' | 'IMPEDIDO';

/**
 * Resultado da validação no SICAF (sistema de cadastro de fornecedores).
 * 
 * @interface SicafValidation
 */
export interface SicafValidation {
  cnpj: string;
  situacaoSicaf: SicafSituacao;
  dataConsulta: string;
  validadoEm?: string;
  fonte?: string;
  detalhes?: string;
  erro?: string;
  situacaoCadastralRFB?: string;
}

/**
 * Resultado da consulta de pendências no TCU (Tribunal de Contas da União).
 * 
 * @interface TcuConsultaResultado
 */
export interface TcuConsultaResultado {
  cnpj: string;
  temPendencia: boolean;
  tipoPendencia?: string;
  descricaoPendencia?: string;
  dataConsulta: string;
  status?: string;
  consultadoEm?: string;
}

/**
 * Estado completo das certidões de um fornecedor.
 * 
 * @interface FornecedorCertidoes
 */
export interface FornecedorCertidoes {
  cnpj: string;
  razaoSocial: string;
  tcu: TcuConsultaResultado;
  sicaf: SicafValidation;
  receitaConferida?: boolean;
  fgtsConferida?: boolean;
  cndtConferida?: boolean;
  atualizadoEm: string;
}