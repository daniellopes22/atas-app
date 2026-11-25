/**
 * @fileoverview Route Handler `POST /api/atas/buscar` — Pesquisa itens de Atas de Registro de Preços.
 *
 * @module app/api/atas/buscar/route
 * @description Contrato HTTP:
 * - **Auth**: Obrigatória via JWT NextAuth (`401` se ausente).
 * - **Body**: JSON validado por `searchSchema` (`400` se inválido).
 * - **Response 200**: `{ items: ARPItem[], total: number }`.
 * - **Response 500**: Erro genérico sem vazamento de stack trace.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchARPItems, getDefaultDateRange } from '@/lib/api';
import { SearchFilters } from '@/types';
import { searchSchema } from '@/lib/validation';
import { getServerAccessToken } from '@/lib/serverAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Executa a pesquisa de itens ARP no portal Compras.gov.br com filtros validados.
 *
 * @param {NextRequest} req - Requisição POST contendo `SearchFilters` em JSON
 * @returns {Promise<NextResponse>} Resposta JSON `{ items, total }` ou erro HTTP
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await getServerAccessToken(req))) return NextResponse.json({ error: 'Faça login para pesquisar atas.' }, { status: 401 });
    const parsed = searchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados de pesquisa inválidos.' }, { status: 400 });
    const { codigoPdm, codigoCatmat, palavraChave, esfera, dataVigenciaInicialMin, dataVigenciaInicialMax, apenasVigentesHoje } = parsed.data;

    // Valores padrão para datas se não informadas
    const { min, max } = getDefaultDateRange();
    
    const filters: SearchFilters = {
      codigoPdm,
      codigoCatmat,
      palavraChave,
      esfera: esfera || 'T',
      dataVigenciaInicialMin: dataVigenciaInicialMin || min,
      dataVigenciaInicialMax: dataVigenciaInicialMax || max,
      apenasVigentesHoje: apenasVigentesHoje !== false,
    };

    const items = await fetchARPItems(filters);
    
    return NextResponse.json({ items, total: items.length });
  } catch (error: unknown) {
    console.error('Erro na API de busca ARP:', error);
    return NextResponse.json(
      { error: 'Não foi possível consultar o Portal de Compras agora. Tente novamente.' },
      { status: 500 }
    );
  }
}