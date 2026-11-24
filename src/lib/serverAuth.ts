/**
 * @fileoverview Helper server-side para extrair com segurança o OAuth access token do JWT NextAuth.
 *
 * @module lib/serverAuth
 */
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

/**
 * Extrai o `accessToken` OAuth diretamente do token JWT HTTP-only da requisição no servidor.
 *
 * @description Evita o tráfego de tokens OAuth em payloads enviados pelo cliente, mitigando
 * exposição via XSS ou spoofing de headers.
 *
 * @param {NextRequest} request - Requisição recebida pelo Route Handler Next.js
 * @returns {Promise<string | null>} Access token válido ou `null` se não autenticado
 */
export async function getServerAccessToken(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return typeof token?.accessToken === 'string' ? token.accessToken : null;
}