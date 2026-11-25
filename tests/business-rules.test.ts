import { describe, expect, it } from 'vitest';
import {
  calcularSaldoAdesao,
  convertToPncpAtaLink,
  convertToPncpEditalLink,
  convertToPropostaItemLink,
  formatContatoPlanilha,
} from '../src/lib/links';
import {
  getConsumoHeaders,
  getContratoHeaders,
  getPermanenteHeaders,
  mapToConsumoRow,
  mapToContratoRow,
  mapToPermanenteRow,
  rowsToSheetValues,
} from '../src/lib/sheetMapping';
import type { ARPItem } from '../src/types';

const item: ARPItem = {
  numeroControlePncpAta: '00394494000136-1-000918/2025-000004',
  numeroAtaRegistroPreco: '00012/2025', numeroItem: '04', codigoItem: 1,
  descricaoItem: '=ITEM PERIGOSO', tipoItem: 'Marca', quantidadeHomologadaItem: 100,
  classificacaoFornecedor: '', niFornecedor: '00394494000136', nomeRazaoSocialFornecedor: 'Fornecedor',
  quantidadeHomologadaVencedor: 100, valorUnitario: 12.5, valorTotal: 1250,
  maximoAdesao: 0, nomeUnidadeGerenciadora: 'UFRRJ', nomeModalidadeCompra: '', idCompra: '',
  numeroControlePncpCompra: '', dataHoraInclusao: '', dataHoraAtualizacao: '', quantidadeEmpenhada: 0,
  percentualMaiorDesconto: 0, situacaoSicaf: '', dataHoraExclusao: '', itemExcluido: false,
  codigoPdm: 6661, nomePdm: 'Material', codigoUnidadeGerenciadora: '153178', numeroCompra: '900142025',
  anoCompra: '2025', codigoModalidadeCompra: '', dataAssinatura: '',
  dataVigenciaInicial: '2025-01-01T00:00:00Z', dataVigenciaFinal: '2026-12-31T00:00:00Z',
  numeroAta: '00012/2025', numeroItemAta: 4, codigoPdmStr: '6661', codigoCatmat: '6661',
  marcaModelo: '+modelo', valorUnitarioEstimado: 10, valorUnitarioAta: 12.5, quantidadeAta: 100,
  uasg: '153178', orgaoNome: 'UFRRJ', esfera: 'F',
};

describe('Lei 14.133/2021: saldo de adesão', () => {
  it('calcula 50% individual e teto global 2x', () => {
    expect(calcularSaldoAdesao(100, 0)).toMatchObject({ limiteOrgaoCarona: 50, saldoGlobalRestante: 200, saldoDisponivelOrgao: 50, indicador: 'disponivel' });
  });

  it('arredonda quantidade ímpar para baixo', () => {
    expect(calcularSaldoAdesao(15, 0).limiteOrgaoCarona).toBe(7);
  });

  it('limita saldo pelo teto global remanescente', () => {
    expect(calcularSaldoAdesao(100, 180)).toMatchObject({ saldoGlobalRestante: 20, saldoDisponivelOrgao: 20, indicador: 'disponivel' });
  });

  it('marca saldo esgotado ao atingir teto global', () => {
    expect(calcularSaldoAdesao(100, 200)).toMatchObject({ saldoDisponivelOrgao: 0, indicador: 'esgotado' });
  });
});

describe('links públicos', () => {
  it('reconstrói links PNCP removendo zeros de sequências', () => {
    expect(convertToPncpAtaLink(item.numeroControlePncpAta)).toBe('https://pncp.gov.br/app/atas/00394494000136/2025/918/4');
    expect(convertToPncpEditalLink(item.numeroControlePncpAta)).toBe('https://pncp.gov.br/app/editais/00394494000136/2025/918');
  });

  it('rejeita controle PNCP inválido sem lançar erro', () => {
    expect(convertToPncpAtaLink('inválido')).toBe('');
    expect(convertToPncpEditalLink('')).toBe('');
  });

  it('monta link Comprasnet com padding e item', () => {
    expect(convertToPropostaItemLink(item)).toBe('https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/04?compra=15317805900142025');
  });
});

describe('mapeamento de planilhas', () => {
  it('mantém posições e quantidade de colunas das três abas', () => {
    const consumo = mapToConsumoRow(item, 42);
    const permanente = mapToPermanenteRow(item, 42);
    const contratos = mapToContratoRow(item, 42);
    expect(rowsToSheetValues([consumo], getConsumoHeaders())[0]).toHaveLength(24);
    expect(rowsToSheetValues([permanente], getPermanenteHeaders())[0]).toHaveLength(24);
    expect(rowsToSheetValues([contratos], getContratoHeaders())[0]).toHaveLength(25);
    expect(consumo.saldoAdesao).toBe(50);
    expect(permanente.dispAdesao).toBe(50);
    expect(contratos.saldoAdesao).toBe(50);
  });

  it('neutraliza texto que pode virar fórmula', () => {
    const row = mapToConsumoRow(item, 42);
    expect(row.material).toBe("'=ITEM PERIGOSO");
    expect(row.marcaModelo).toBe("'+modelo");
  });

  it('formata contato completo e previsível', () => {
    expect(formatContatoPlanilha({ cnpj: '00394494000136', razaoSocial: 'Fornecedor', email: 'a@b.gov.br', telefone: '21999999999' }))
      .toBe('CNPJ: 00394494000136\nRAZÃO SOCIAL: Fornecedor\nE-MAIL: a@b.gov.br\nTELEFONE: 21999999999');
  });
});
