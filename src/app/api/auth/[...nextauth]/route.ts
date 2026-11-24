/**
 * @fileoverview Catch-all Route Handler do NextAuth v5 (`/api/auth/*`).
 *
 * @module app/api/auth/[...nextauth]/route
 * @description Executa obrigatoriamente em runtime `nodejs` para compatibilidade total
 * com provedores OAuth e callbacks JWT na Vercel.
 */
import { handlers } from '@/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const { GET, POST } = handlers;