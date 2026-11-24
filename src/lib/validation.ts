/**
 * @fileoverview Contratos de validação Zod (fail-closed) compartilhados por todas as API Routes.
 *
 * @module lib/validation
 * @description Garante integridade de entradas na fronteira HTTP (parâmetros de busca,
 * identificadores PNCP, IDs de planilhas contra path traversal/SSRF e limites de batch).
 */
import { z } from 'zod';

/** Identificador seguro para IDs do Google Drive / OneDrive (somente alfanumérico, `_` e `-`) */
const safeId = z.string().regex(/^[A-Za-z0-9_-]{1,200}$/);

/** Provedor de planilhas em nuvem suportado */
export const providerSchema = z.enum(['google', 'microsoft']);

/** Tipo lógico da aba de destino */
export const sheetTypeSchema = z.enum(['consumo', 'permanente', 'contratos']);

/** Nome exato da aba institucional permitido para escrita */
export const sheetNameSchema = z.enum(['Atas - Mat. Consumo', 'Atas - Mat. Permanente', 'Atas - Contratos']);

/** Schema de validação de `POST /api/atas/buscar` */
export const searchSchema = z.object({
  codigoPdm: z.string().regex(/^\d{1,12}$/).optional(),
  codigoCatmat: z.string().regex(/^\d{1,12}$/).optional(),
  palavraChave: z.string().trim().min(1).max(160).optional(),
  esfera: z.enum(['F', 'E', 'M', 'T']).default('T'),
  dataVigenciaInicialMin: z.string().date().optional(),
  dataVigenciaInicialMax: z.string().date().optional(),
  apenasVigentesHoje: z.boolean().default(true),
});

/** Schema de validação de `POST /api/atas/detalhes` (exige padrão PNCP `CNPJ-M-SEQ/ANO-SEQ`) */
export const detailSchema = z.object({
  numeroControlePncpAta: z.string().regex(/^\d{14}-\d-\d{6}\/\d{4}-\d+$/),
});

/** Schema de validação para consulta de abas de uma planilha (`GET /api/planilha/escrever`) */
export const spreadsheetQuerySchema = z.object({
  spreadsheetId: safeId,
  provider: providerSchema,
  driveId: safeId.optional(),
});

/** Schema de validação para escrita em lote (`POST /api/planilha/escrever`, máx. 100 itens) */
export const spreadsheetWriteSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
  sheetType: sheetTypeSchema,
  spreadsheetId: safeId,
  sheetName: sheetNameSchema,
  provider: providerSchema,
  driveId: safeId.optional(),
});

/** Schema de validação para criação da planilha institucional padrão (`POST /api/sheets/create`) */
export const createSpreadsheetSchema = z.object({
  title: z.string().trim().min(1).max(120),
  provider: providerSchema,
  driveId: safeId.optional(),
});