/**
 * @fileoverview Route Handler `/api/planilha/escrever` — Consulta abas (`GET`) e grava itens ARP (`POST`).
 *
 * @module app/api/planilha/escrever/route
 * @description Contrato HTTP:
 * - **GET**: Query `{ spreadsheetId, provider, driveId? }` (`spreadsheetQuerySchema`) -> `{ sheets: string[] }`.
 * - **POST**: Body `{ items, sheetType, spreadsheetId, sheetName, provider, driveId? }` (`spreadsheetWriteSchema`) -> `{ success, updatedRows, error? }`.
 * - **Auth**: Obrigatória via `getServerAccessToken` (`401`).
 */
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerAccessToken } from '@/lib/serverAuth';
import { spreadsheetQuerySchema, spreadsheetWriteSchema } from '@/lib/validation';
import { appendRowsToSheet, getSpreadsheetSheets } from '@/lib/googleSheets';
import { ARPItem, SheetType } from '@/types';
import { appendRowsToExcel, getSpreadsheetSheets as getExcelSheets } from '@/lib/microsoftGraph';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Anexa até 100 itens ARP na aba institucional selecionada (Google Sheets ou Excel Online).
 *
 * @param {NextRequest} req - Requisição POST validada por `spreadsheetWriteSchema`
 * @returns {Promise<NextResponse>} Resultado da gravação `{ success, updatedRows?, error? }`
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const parsed = spreadsheetWriteSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados da planilha inválidos.' }, { status: 400 });
    const { items, sheetType, spreadsheetId, sheetName, provider, driveId } = parsed.data as unknown as { items: ARPItem[]; sheetType: SheetType; spreadsheetId: string; sheetName: string; provider: 'google' | 'microsoft'; driveId?: string };

    let result;
    if (provider === 'google') {
      result = await appendRowsToSheet(
        accessToken,
        spreadsheetId,
        sheetName,
        items,
        sheetType
      );
    } else if (provider === 'microsoft') {
      result = await appendRowsToExcel(
        accessToken,
        spreadsheetId,
        sheetName,
        items,
        sheetType,
        driveId
      );
    } else {
      return NextResponse.json(
        { error: 'Provedor inválido' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao escrever na planilha:', error);
    return NextResponse.json(
      { error: 'Não foi possível gravar na planilha agora.' },
      { status: 500 }
    );
  }
}

/**
 * Lista os nomes das abas disponíveis na planilha conectada.
 *
 * @param {NextRequest} req - Requisição GET com `spreadsheetId`, `provider` e `driveId` opcional
 * @returns {Promise<NextResponse>} `{ sheets: string[] }`
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
    const parsed = spreadsheetQuerySchema.safeParse({ spreadsheetId: searchParams.get('spreadsheetId'), provider: searchParams.get('provider'), driveId: searchParams.get('driveId') || undefined });
    if (!parsed.success) return NextResponse.json({ error: 'Dados da planilha inválidos.' }, { status: 400 });
    const { spreadsheetId, provider, driveId } = parsed.data;

    let sheets: string[] = [];
    if (provider === 'google') {
      sheets = await getSpreadsheetSheets(accessToken, spreadsheetId);
    } else if (provider === 'microsoft') {
      sheets = await getExcelSheets(accessToken, spreadsheetId, driveId);
    }

    return NextResponse.json({ sheets });
  } catch (error: any) {
    console.error('Erro ao listar abas:', error);
    return NextResponse.json(
      { error: 'Não foi possível listar as abas agora.' },
      { status: 500 }
    );
  }
}