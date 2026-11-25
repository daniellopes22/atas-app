import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeCnpj,
  getCertidoesPortais,
  formatarResumoRegularidade,
} from '../src/lib/certidoes-links';

describe('sanitizeCnpj', () => {
  it('deve retornar CNPJ limpo sem máscara quando já tem 14 dígitos', () => {
    expect(sanitizeCnpj('00000000000100')).toBe('00000000000100');
  });

  it('deve remover máscara, espaços e pontuação', () => {
    expect(sanitizeCnpj('00.000.000/0000-00')).toBe('00000000000000');
    expect(sanitizeCnpj('  00 000 000 0000 00  ')).toBe('00000000000000');
    expect(sanitizeCnpj('00.000.000/0000-00  ')).toBe('00000000000000');
  });

  it('deve lançar erro quando não houver exatamente 14 dígitos', () => {
    expect(() => sanitizeCnpj('00.000.000/0000-0')).toThrow(/14 dígitos/);
    expect(() => sanitizeCnpj('00.000.000/0000-001')).toThrow(/14 dígitos/);
    expect(() => sanitizeCnpj('abc')).toThrow(/14 dígitos/);
    expect(() => sanitizeCnpj('')).toThrow(/14 dígitos/);
  });
});

describe('getCertidoesPortais', () => {
  const cnpjLimpo = '00000000000100';

  it('deve retornar exatamente 4 portais', () => {
    const portais = getCertidoesPortais(cnpjLimpo);
    expect(portais).toHaveLength(4);
  });

  it('TCU deve ter URL com ?cnpj= e suportar autoFill', () => {
    const portais = getCertidoesPortais(cnpjLimpo);
    const tcu = portais.find(p => p.id === 'tcu');
    expect(tcu).toBeDefined();
    expect(tcu?.url).toBe(`https://certidoes-apf.apps.tcu.gov.br/#/certidoes?cnpj=${cnpjLimpo}`);
    expect(tcu?.suportaAutoFillUrl).toBe(true);
    expect(tcu?.orgao).toContain('TCU');
  });

  it('Receita/PGFN deve usar domínio oficial da Receita Federal', () => {
    const portais = getCertidoesPortais(cnpjLimpo);
    const receita = portais.find(p => p.id === 'receita');
    expect(receita?.url).toContain('receita.fazenda.gov.br');
    expect(receita?.suportaAutoFillUrl).toBe(false);
  });

  it('FGTS/CRF deve usar domínio oficial da CAIXA', () => {
    const portais = getCertidoesPortais(cnpjLimpo);
    const fgts = portais.find(p => p.id === 'fgts');
    expect(fgts?.url).toContain('caixa.gov.br');
    expect(fgts?.suportaAutoFillUrl).toBe(false);
  });

  it('CNDT/TST deve usar domínio oficial do TST', () => {
    const portais = getCertidoesPortais(cnpjLimpo);
    const cndt = portais.find(p => p.id === 'cndt');
    expect(cndt?.url).toContain('tst.jus.br');
    expect(cndt?.suportaAutoFillUrl).toBe(false);
  });

  it('deve lançar erro se CNPJ inválido for passado', () => {
    expect(() => getCertidoesPortais('00.000.000/0000-0')).toThrow(/14 dígitos/);
  });
});

describe('formatarResumoRegularidade', () => {
  it('deve retornar texto de sem restrições quando TCU OK', () => {
    const resultado = formatarResumoRegularidade({ tcuOk: true });
    expect(resultado).toContain('Sem restrições TCU/Compras.gov');
    expect(resultado).toContain('| Situação:');
  });

  it('deve retornar texto de ALERTA quando houver impedimento', () => {
    const resultado = formatarResumoRegularidade({ tcuOk: false, detalheImpedimento: 'CEIS - Empresa inidônea' });
    expect(resultado).toContain('ALERTA');
    expect(resultado).toContain('Consta restrição TCU/Compras.gov');
    expect(resultado).toContain('CEIS - Empresa inidônea');
  });

  it('deve incluir a data formatada em pt-BR', () => {
    const resultado = formatarResumoRegularidade({ tcuOk: true, dataVerificacao: new Date('2026-11-25T10:30:00') });
    expect(resultado).toContain('25/11/2026');
  });
});