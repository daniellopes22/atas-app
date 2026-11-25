/**
 * @fileoverview Route Handler `POST /api/sheets/create` — Provisiona a planilha institucional padrão na nuvem.
 *
 * @module app/api/sheets/create/route
 * @description Contrato HTTP:
 * - **Auth**: Obrigatória via JWT NextAuth (`401`).
 * - **Body**: `{ title, provider, driveId? }` validado por `createSpreadsheetSchema`.
 * - **Efeito**: Gera `.xlsx` em memória via `generateStandardWorkbookBuffer()` e realiza upload para
 *   Google Drive (convertendo para Google Spreadsheet) ou OneDrive/SharePoint via Microsoft Graph.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getServerAccessToken } from '@/lib/serverAuth';
import { createSpreadsheetSchema } from '@/lib/validation';
import { generateStandardWorkbookBuffer, getStandardSheetNames } from '@/lib/spreadsheet-template';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Cria uma nova planilha padrão (4 abas + Dashboard_Chefia) na conta conectada do usuário.
 *
 * @param {NextRequest} req - Requisição POST com `title`, `provider` e `driveId` opcional
 * @returns {Promise<NextResponse>} Metadados da planilha criada (`spreadsheetId`, `webViewLink`, `sheets`)
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: 'Faça login para criar planilha.' }, { status: 401 });
    }

    const parsed = createSpreadsheetSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos para criação da planilha.' }, { status: 400 });
    }
    const { title, provider, driveId } = parsed.data;

    const buffer = await generateStandardWorkbookBuffer();
    const sheetNames = getStandardSheetNames();

    if (provider === 'google') {
      const { google } = await import('googleapis');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      };

      const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Readable.from(buffer),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink',
      });

      const file = response.data;
      return NextResponse.json({
        success: true,
        provider: 'google',
        spreadsheetId: file.id,
        spreadsheetName: file.name,
        webViewLink: file.webViewLink,
        sheets: sheetNames,
        message: 'Planilha padrão criada no Google Drive.',
      });
    }

    if (provider === 'microsoft') {
      const base = driveId
        ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(title)}.xlsx:/content`
        : `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(title)}.xlsx:/content`;

      const writeResponse = await fetch(base, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: buffer as unknown as BodyInit,
      });

      if (!writeResponse.ok) {
        const errorText = await writeResponse.text();
        return NextResponse.json(
          { error: `Erro ao criar no OneDrive: ${errorText}` },
          { status: writeResponse.status },
        );
      }

      const file = await writeResponse.json();
      return NextResponse.json({
        success: true,
        provider: 'microsoft',
        spreadsheetId: file.id,
        spreadsheetName: file.name,
        webViewLink: file.webUrl,
        sheets: sheetNames,
        message: 'Planilha padrão criada no OneDrive.',
      });
    }

    return NextResponse.json({ error: 'Provedor inválido.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Erro ao criar planilha padrão:', error);
    return NextResponse.json(
      { error: 'Não foi possível criar a planilha padrão agora.' },
      { status: 500 },
    );
  }
}
