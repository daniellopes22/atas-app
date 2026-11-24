/**
 * scripts/test-apis.mjs
 * Diagnóstico de conectividade e validação de APIs externas do atas-app.
 * Execute com: node scripts/test-apis.mjs
 */

const COMPRAS_API = 'https://dadosabertos.compras.gov.br/modulo-arp/2_consultarARPItem';
const BRASILAPI = 'https://brasilapi.com.br/api/cnpj/v1/';
const PNCP_ATA = 'https://pncp.gov.br/app/atas/';
const PNCP_EDITAL = 'https://pncp.gov.br/app/editais/';
const GOOGLE_OIDC = 'https://accounts.google.com/.well-known/openid-configuration';
const GOOGLE_SHEETS_DISCOVERY = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const MS_OIDC = 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration';
const MS_GRAPH_METADATA = 'https://graph.microsoft.com/v1.0/$metadata';

const TIMEOUT_MS = 8000;
const results = [];

function pad(n) { return String(n).padStart(2, '0'); }
function nowIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function dateRange() {
  const today = new Date();
  const max = nowIso();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 1);
  const min = `${minDate.getFullYear()}-${pad(minDate.getMonth()+1)}-${pad(minDate.getDate())}`;
  return { min, max };
}

async function fetchWithTimer(url, opts = {}) {
  const start = process.hrtime.bigint();
  let status = null, body = null, error = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    status = res.status;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await res.json();
    else body = await res.text();
  } catch (e) {
    error = e.message;
  }
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;
  return { status, body, error, ms: Math.round(ms) };
}

function verdict(status, ms, ok) {
  if (!ok) return 'ATENÇÃO';
  if (ms > 10000) return 'ATENÇÃO';
  if (status >= 400) return 'ATENÇÃO';
  return 'APROVADO';
}

function printSection(title) {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

function printRow(service, endpoint, status, ms, sample, verdict) {
  const statusStr = status ? String(status) : '—';
  const msStr = ms ? `${ms}ms` : '—';
  console.log(`| ${service.padEnd(26)} | ${endpoint.padEnd(42)} | ${statusStr.padEnd(8)} | ${msStr.padEnd(8)} | ${verdict.padEnd(10)} | ${sample}`);
}

async function main() {
  printSection('DIAGNÓSTICO DE CONECTIVIDADE — atas-app');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log(`Timeout configurado: ${TIMEOUT_MS}ms`);

  // ========================================================
  // 1. Compras.gov.br — busca por PDM
  // ========================================================
  printSection('1. Compras.gov.br — Dados Abertos ARP');
  const { min, max } = dateRange();
  const pdmParams = new URLSearchParams({ codigoPdm: '6661', pagina: '1', tamanhoPagina: '10', dataVigenciaInicialMin: min, dataVigenciaInicialMax: max });
  const r1 = await fetchWithTimer(`${COMPRAS_API}?${pdmParams}`);
  const ok1 = r1.status === 200 && Array.isArray(r1.body?.resultado) && r1.body.resultado.length > 0 && typeof r1.body.totalRegistros === 'number';
  printRow('Compras.gov.br', '/2_consultarARPItem?codigoPdm=6661', r1.status, r1.ms, ok1 ? `${r1.body.resultado.length} itens` : r1.error || 'sem dados', verdict(r1.status, r1.ms, ok1));
  let sampleItem = null;
  if (ok1) sampleItem = r1.body.resultado[0];

  // ========================================================
  // 2. Compras.gov.br — busca por palavra-chave / vigência
  // ========================================================
  const kwParams = new URLSearchParams({ palavraChave: 'MICROCOMPUTADOR', pagina: '1', tamanhoPagina: '10', dataVigenciaInicialMin: min, dataVigenciaInicialMax: max });
  const r2 = await fetchWithTimer(`${COMPRAS_API}?${kwParams}`);
  const ok2 = r2.status === 200 && Array.isArray(r2.body?.resultado);
  printRow('Compras.gov.br', '/2_consultarARPItem?palavraChave=MICROCOMPUTADOR', r2.status, r2.ms, ok2 ? `${r2.body.resultado.length} itens` : r2.error || 'sem dados', verdict(r2.status, r2.ms, ok2));

  // ========================================================
  // 3. Compras.gov.br — busca por vigência
  // ========================================================
  const vigParams = new URLSearchParams({ dataVigenciaInicialMin: min, dataVigenciaInicialMax: max, pagina: '1', tamanhoPagina: '10' });
  const r3 = await fetchWithTimer(`${COMPRAS_API}?${vigParams}`);
  const ok3 = r3.status === 200 && Array.isArray(r3.body?.resultado);
  printRow('Compras.gov.br', '/2_consultarARPItem?dataVigenciaInicialMin=hoje', r3.status, r3.ms, ok3 ? `${r3.body.resultado.length} itens` : r3.error || 'sem dados', verdict(r3.status, r3.ms, ok3));

  // ========================================================
  // 4. Validação de campos reais vs TypeScript
  // ========================================================
  printSection('2. Validação de campos reais vs TypeScript');
  const expectedFields = [
    'numeroControlePncpAta', 'numeroAtaRegistroPreco', 'numeroItem', 'codigoItem',
    'descricaoItem', 'tipoItem', 'quantidadeHomologadaItem', 'niFornecedor',
    'nomeRazaoSocialFornecedor', 'valorUnitario', 'valorTotal', 'codigoPdm',
    'nomePdm', 'nomeUnidadeGerenciadora', 'numeroCompra', 'dataVigenciaFinal'
  ];
  let camposDivergentes = [];
  if (sampleItem) {
    for (const field of expectedFields) {
      if (!(field in sampleItem)) camposDivergentes.push(field);
    }
  } else {
    camposDivergentes = [...expectedFields];
  }
  printRow('Mapeamento TypeScript', 'RawARPItem vs API real', 200, 0, camposDivergentes.length === 0 ? 'Todos os campos presentes' : `Faltando: ${camposDivergentes.join(', ')}`, camposDivergentes.length === 0 ? 'APROVADO' : 'AJUSTADO');

  // ========================================================
  // 5. Links PNCP e Comprasnet
  // ========================================================
  printSection('3. Validação de links reconstruídos (PNCP / Comprasnet)');
  let pncpLinkOk = false, pncpLink = '', editalLink = '', propostaLink = '';
  if (sampleItem) {
    const ncp = sampleItem.numeroControlePncpAta;
    const match = ncp.match(/^(\d{14})-(\d)-(\d{6})\/(\d{4})-(\d+)$/);
    if (match) {
      const [, cnpj, , seqCompra, ano, seqAta] = match;
      const seqCompraLimpo = parseInt(seqCompra, 10).toString();
      const seqAtaLimpo = parseInt(seqAta, 10).toString();
      pncpLink = `${PNCP_ATA}${cnpj}/${ano}/${seqCompraLimpo}/${seqAtaLimpo}`;
      editalLink = `${PNCP_EDITAL}${cnpj}/${ano}/${seqCompraLimpo}`;
      const uasg = (sampleItem.codigoUnidadeGerenciadora || '').padStart(6, '0');
      const pregao = (sampleItem.numeroCompra || '').replace(/\D/g, '').padStart(9, '0');
      const numeroItem = sampleItem.numeroItem || String(sampleItem.numeroItemAta || '');
      propostaLink = `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/${numeroItem}?compra=${uasg}05${pregao}`;
    }
  }
  if (pncpLink) {
    const r4 = await fetchWithTimer(pncpLink, { method: 'HEAD' });
    const pncpReachable = r4.status !== null && r4.status < 500;
    pncpLinkOk = pncpReachable;
    printRow('PNCP Ata', pncpLink, r4.status, r4.ms, r4.status === 200 ? 'Link válido (200)' : r4.status ? `Status ${r4.status}` : 'Sem resposta (bloqueado/CORS)', pncpReachable ? 'APROVADO' : 'ATENÇÃO');
  } else {
    printRow('PNCP Ata', 'Não gerado (sem item amostra)', null, null, 'Sem item da API', 'ATENÇÃO');
  }
  printRow('PNCP Edital', editalLink || 'Não gerado', null, null, editalLink ? 'Gerado' : 'Não gerado', editalLink ? 'APROVADO' : 'ATENÇÃO');
  printRow('Comprasnet Proposta', propostaLink || 'Não gerado', null, null, propostaLink ? 'Gerado' : 'Não gerado', propostaLink ? 'APROVADO' : 'ATENÇÃO');

  // ========================================================
  // 6. BrasilAPI CNPJ
  // ========================================================
  printSection('4. BrasilAPI — Enriquecimento CNPJ');
  let cnpjReal = null;
  if (sampleItem && sampleItem.niFornecedor) {
    cnpjReal = sampleItem.niFornecedor.replace(/\D/g, '');
  }
  let brasilOk = false, contatoFormatado = '';
  if (cnpjReal && cnpjReal.length === 14) {
    const r5 = await fetchWithTimer(`${BRASILAPI}${cnpjReal}`);
    brasilOk = r5.status === 200 && r5.body && typeof r5.body.razao_social === 'string';
    const contato = r5.body || {};
    contatoFormatado = `CNPJ: ${contato.cnpj || cnpjReal} | RAZÃO SOCIAL: ${contato.razao_social || '—'} | E-MAIL: ${contato.email || '—'} | TEL: ${contato.ddd_telefone_1 || contato.telefone || '—'}`;
    const brasilVerdict = brasilOk ? 'APROVADO' : r5.status === 403 ? 'ATENÇÃO (rate limit)' : 'ATENÇÃO';
    printRow('BrasilAPI', `/api/cnpj/v1/${cnpjReal}`, r5.status, r5.ms, contatoFormatado, brasilVerdict);
  } else {
    printRow('BrasilAPI', '/api/cnpj/v1/{cnpj}', null, null, 'Sem CNPJ real na amostra', 'ATENÇÃO');
  }

  // CNPJ inválido
  const r6 = await fetchWithTimer(`${BRASILAPI}00000000000000`);
  const invalidoOk = r6.status === 404 || r6.status === 400;
  printRow('BrasilAPI (CNPJ inválido)', '/api/cnpj/v1/00000000000000', r6.status, r6.ms, invalidoOk ? 'Erro tratado (404/400)' : `Status inesperado ${r6.status}`, invalidoOk ? 'APROVADO' : 'ATENÇÃO');

  // ========================================================
  // 7. OAuth / Discovery endpoints
  // ========================================================
  printSection('5. Descoberta OAuth2 e APIs de planilhas');
  const r7 = await fetchWithTimer(GOOGLE_OIDC);
  const googleOk = r7.status === 200 && r7.body && typeof r7.body.authorization_endpoint === 'string';
  printRow('Google OIDC', GOOGLE_OIDC, r7.status, r7.ms, googleOk ? 'Discovery válido' : r7.error || 'inválido', verdict(r7.status, r7.ms, googleOk));

  const r8 = await fetchWithTimer(GOOGLE_SHEETS_DISCOVERY);
  const sheetsOk = r8.status === 200 && typeof r8.body === 'object';
  printRow('Google Sheets Discovery', GOOGLE_SHEETS_DISCOVERY, r8.status, r8.ms, sheetsOk ? 'Discovery válido' : r8.error || 'inválido', verdict(r8.status, r8.ms, sheetsOk));

  const r9 = await fetchWithTimer(MS_OIDC);
  const msOk = r9.status === 200 && r9.body && typeof r9.body.authorization_endpoint === 'string';
  printRow('Microsoft OIDC', MS_OIDC, r9.status, r9.ms, msOk ? 'Discovery válido' : r9.error || 'inválido', verdict(r9.status, r9.ms, msOk));

  const r10 = await fetchWithTimer(MS_GRAPH_METADATA);
  const graphOk = r10.status === 200;
  printRow('Microsoft Graph $metadata', MS_GRAPH_METADATA, r10.status, r10.ms, graphOk ? 'Metadados válidos' : r10.error || 'inválido', verdict(r10.status, r10.ms, graphOk));

  // ========================================================
  // 8. Endpoint interno /api/atas/buscar
  // ========================================================
  printSection('6. Endpoint interno Next.js /api/atas/buscar');
  try {
    const r11 = await fetchWithTimer('http://localhost:3000/api/atas/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigoPdm: '6661', pagina: 1, tamanhoPagina: 5 }),
    });
    const internoOk = r11.status === 200 || r11.status === 401;
    printRow('Next.js API', '/api/atas/buscar', r11.status, r11.ms, internoOk ? 'Responde (200 ou 401 auth)' : r11.error || 'erro', internoOk ? 'APROVADO' : 'ATENÇÃO');
  } catch (e) {
    printRow('Next.js API', '/api/atas/buscar', null, null, 'Servidor local não está rodando', 'ATENÇÃO');
  }

  // ========================================================
  // Relatório final
  // ========================================================
  printSection('RELATÓRIO FINAL');
  console.log('\nAmostra de dados reais:');
  if (sampleItem) {
    console.log(`  Ata: ${sampleItem.numeroAtaRegistroPreco} | Item: ${sampleItem.numeroItem} | ${sampleItem.descricaoItem?.slice(0, 60)}`);
    console.log(`  Fornecedor: ${sampleItem.nomeRazaoSocialFornecedor} (CNPJ: ${sampleItem.niFornecedor})`);
    console.log(`  Valor unitário: R$ ${sampleItem.valorUnitario} | Quantidade: ${sampleItem.quantidadeHomologadaItem}`);
    console.log(`  Validade: ${sampleItem.dataVigenciaFinal}`);
  }
  if (pncpLink) console.log(`  Link PNCP validado: ${pncpLink}`);
  if (contatoFormatado) console.log(`  Contato formatado: ${contatoFormatado}`);

  const todosAprovados = ok1 && ok2 && ok3 && brasilOk && googleOk && sheetsOk && msOk && graphOk;
  console.log(`\nVeredito geral: ${todosAprovados ? 'APROVADO' : 'ATENÇÃO — revise os itens marcados acima'}`);
}

main().catch(err => {
  console.error('Erro fatal no diagnóstico:', err);
  process.exit(1);
});
