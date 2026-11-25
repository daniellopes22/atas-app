/**
 * @fileoverview Route Handler `POST /api/atas/detalhes` — Consulta e enriquece um item específico da ARP.
 *
 * @module app/api/atas/detalhes/route
 * @description Contrato HTTP:
 * - **Auth**: Obrigatória via JWT NextAuth (`401` se ausente).
 * - **Body**: `{ numeroControlePncpAta: string }` validado por `detailSchema` (`400` se inválido).
 * - **Pipeline**: Compras.gov.br -> Links PNCP/Comprasnet -> BrasilAPI CNPJ -> Cálculo Lei 14.133/2021.
 * - **Response 200**: `{ item: ARPItem }` | `404` se inexistente.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchARPItemDetails, enrichWithPncpLinks, enrichWithSaldoAdesao, fetchFornecedorContato } from '@/lib/api';
import { detailSchema } from '@/lib/validation';
import { getServerAccessToken } from '@/lib/serverAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Retorna os detalhes completos e enriquecidos de um item de Ata pelo número de controle PNCP.
 *
 * @param {NextRequest} req - Requisição POST com `{ numeroControlePncpAta }`
 * @returns {Promise<NextResponse>} `{ item }` enriquecido ou erro HTTP (`400`, `401`, `404`, `500`)
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await getServerAccessToken(req))) return NextResponse.json({ error: 'Faça login para consultar detalhes.' }, { status: 401 });
    const parsed = detailSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Identificador da ata inválido.' },
        { status: 400 }
      );
    }
    const { numeroControlePncpAta } = parsed.data;

    // Buscar detalhes do item
    let item = await fetchARPItemDetails(numeroControlePncpAta);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Enriquecer com links PNCP
    item = enrichWithPncpLinks(item);

    // Buscar contato do fornecedor
    if (item.niFornecedor) {
      const contato = await fetchFornecedorContato(item.niFornecedor);
      if (contato) {
        item.contatoFornecedor = contato;
      }
    }

    // Calcular saldo de adesão (por enquanto 0 autorizados)
    const autorizados = 0; // TODO: buscar da API de adesões
    item = enrichWithSaldoAdesao(item, autorizados);

    return NextResponse.json({ item });
  } catch (error: unknown) {
    console.error('Erro na API de detalhes ARP:', error);
    return NextResponse.json(
      { error: 'Não foi possível carregar detalhes do item agora.' },
      { status: 500 }
    );
  }
}