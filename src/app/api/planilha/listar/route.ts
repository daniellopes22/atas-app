/**
 * @fileoverview Route Handler `GET /api/planilha/listar` — Lista planilhas do usuário no provedor OAuth.
 *
 * @module app/api/planilha/listar/route
 * @description Contrato HTTP:
 * - **Auth**: Obrigatória (`401`).
 * - **Query**: `?provider=google|microsoft` (`400` se inválido).
 * - **Response 200**: `{ spreadsheets: ConnectedSpreadsheet[] }`.
 */
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerAccessToken } from '@/lib/serverAuth';
import { providerSchema } from '@/lib/validation';
import { listUserSpreadsheets as listGoogleSheets } from '@/lib/googleSheets';
import { listUserSpreadsheets as listMicrosoftSheets } from '@/lib/microsoftGraph';
import { ConnectedSpreadsheet } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Lista planilhas do Google Drive ou OneDrive utilizando o access token do JWT.
 *
 * @param {NextRequest} req - Requisição GET com query parameter `provider`
 * @returns {Promise<NextResponse>} `{ spreadsheets }` ou erro HTTP
 */
export async function GET(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const provider = providerSchema.safeParse(searchParams.get('provider'));
    if (!provider.success) return NextResponse.json({ error: 'Provedor inválido.' }, { status: 400 });

    let spreadsheets: ConnectedSpreadsheet[] = [];
    
    if (provider.data === 'google') spreadsheets = await listGoogleSheets(accessToken);
    else spreadsheets = await listMicrosoftSheets(accessToken);

    return NextResponse.json({ spreadsheets });
  } catch (error: unknown) {
    console.error('Erro ao listar planilhas:', error);
    return NextResponse.json(
      { error: 'Não foi possível listar as planilhas agora.' },
      { status: 500 }
    );
  }
}