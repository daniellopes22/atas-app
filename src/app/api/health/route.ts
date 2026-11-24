/**
 * @fileoverview Endpoint público de healthcheck (`GET /api/health`) para monitoramento e readiness probes.
 *
 * @module app/api/health/route
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Retorna status operacional, timestamp ISO e versão do serviço.
 *
 * @returns {Promise<NextResponse>} JSON `{ status: 'ok', service, timestamp, version }`
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'atas-app',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  });
}
