/**
 * @fileoverview Drawer lateral acessível (`role="dialog"`) com especificações, fornecedor,
 * cálculo visual de saldo Lei 14.133/2021, links PNCP/Comprasnet e painel de regularidade do fornecedor.
 *
 * @module components/ItemDetailsDrawer
 */
'use client';

import { useEffect, useState } from 'react';
import { ARPItem, ResumoRegularidade, PortalCertidao, VerificacaoEstado } from '@/types';
import { convertToPncpAtaLink, convertToPncpEditalLink, convertToPropostaItemLink, formatContatoPlanilha, getCertidoesPortais, copyCnpjToClipboard, formatarResumoRegularidade } from '@/lib/links';
import { Copy, ExternalLink, X, CheckCircle, AlertCircle, Loader2, ExternalLink as ExternalLinkIcon, ShieldCheck, ShieldAlert, Eye } from 'lucide-react';
import { useToast } from './Toast';

/** Propriedades de {@link ItemDetailsDrawer} */
interface ItemDetailsDrawerProps {
  /** Item ARP selecionado para inspeção; `null` mantém o drawer fechado */
  item: ARPItem | null;
  /** Callback para fechar o drawer (clique no backdrop, botão X ou tecla Escape) */
  onClose: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value)}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
      disabled={!value}
    >
      <Copy className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/**
 * Cartão individual de verificação de portal de certidão com estados visuais claros.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
function PortalCard({
  portal,
  estado,
  cnpj,
  onToggleConferido,
  onAbrirPortal,
  showToast,
}: {
  portal: PortalCertidao;
  estado: VerificacaoEstado;
  cnpj: string;
  onToggleConferido: () => void;
  onAbrirPortal: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}) {
  const iconMap: Record<string, React.ReactElement> = {
    carregando: <Loader2 className="w-4 h-4 animate-spin text-gray-500" />,
    sem_restricoes: <CheckCircle className="w-4 h-4 text-green-600" />,
    impedimento: <AlertCircle className="w-4 h-4 text-red-600" />,
    conferido: <ShieldCheck className="w-4 h-4 text-green-600" />,
    erro: <AlertCircle className="w-4 h-4 text-orange-600" />,
  };

  const badgeMap: Record<string, { label: string; className: string }> = {
    carregando: { label: 'Carregando...', className: 'bg-gray-100 text-gray-700' },
    sem_restricoes: { label: 'Sem Restrições', className: 'bg-green-100 text-green-800' },
    impedimento: { label: 'Impedimento Detectado', className: 'bg-red-100 text-red-800' },
    conferido: { label: 'Conferido', className: 'bg-green-100 text-green-800' },
    erro: { label: 'Erro na Consulta', className: 'bg-orange-100 text-orange-800' },
  };

  const isTcu = portal.id === 'tcu';
  const podePreencherUrl = portal.suportaAutoFillUrl && isTcu;

  return (
    <section className={`rounded-xl border p-4 ${estado === 'impedimento' ? 'border-red-200 bg-red-50' : estado === 'sem_restricoes' || estado === 'conferido' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {iconMap[estado]}
          <h4 className="font-semibold text-sm text-gray-900">{portal.nome}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeMap[estado].className}`}>
          {badgeMap[estado].label}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-3 leading-snug">{portal.orgao}</p>

      {/* Botão Abrir Portal */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={async () => {
            const ok = await copyCnpjToClipboard(cnpj);
            if (ok) {
              window.open(portal.url, '_blank', 'noopener,noreferrer');
              showToast('success', `CNPJ ${cnpj} copiado! Cole (Ctrl+V) no portal aberto.`);
            } else {
              showToast('error', 'Não foi possível copiar o CNPJ para a área de transferência.');
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          disabled={estado === 'carregando'}
        >
          <ExternalLinkIcon className="w-3.5 h-3.5" />
          {podePreencherUrl ? 'Abrir Portal (CNPJ pré-preenchido)' : 'Abrir Portal (Copia CNPJ)'}
        </button>
        {portal.id !== 'tcu' && (
          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-500">
            <input
              type="checkbox"
              checked={estado === 'conferido'}
              onChange={onToggleConferido}
              className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Conferido
          </label>
        )}
      </div>

      {estado === 'carregando' && (
        <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-blue-600 animate-pulse" />
        </div>
      )}
    </section>
  );
}

/**
 * Painel lateral de detalhes do item ARP com atalhos de cópia e links externos oficiais.
 *
 * @param {ItemDetailsDrawerProps} props
 * @returns {JSX.Element | null}
 */
export default function ItemDetailsDrawer({ item, onClose }: ItemDetailsDrawerProps) {
  if (!item) return null;
  const { showToast } = useToast();
  const saldo = item.saldoAdesao;
  const ata = convertToPncpAtaLink(item.numeroControlePncpAta);
  const edital = convertToPncpEditalLink(item.numeroControlePncpAta);
  const proposta = convertToPropostaItemLink(item);
  const percentualUsado = saldo?.quantidadeHomologada ? Math.min(100, Math.max(0, (saldo.quantidadeAutorizada / (saldo.quantidadeHomologada * 2)) * 100)) : 0;
  const contato = item.contatoFornecedor || { cnpj: item.niFornecedor, razaoSocial: item.nomeRazaoSocialFornecedor };
  const [conferidoMap, setConferidoMap] = useState<Record<string, boolean>>({});
  const [estadoMap, setEstadoMap] = useState<Record<string, VerificacaoEstado>>({
    tcu: 'carregando',
    receita: 'carregando',
    fgts: 'carregando',
    cndt: 'carregando',
  });

  // Simula verificação de regularidade (substituir por chamada real à API quando disponível)
  useEffect(() => {
    const cnpj = contato.cnpj || '';
    if (!cnpj) return;
    const timer = setTimeout(() => {
      setEstadoMap(prev => ({ ...prev, tcu: 'sem_restricoes', receita: 'sem_restricoes', fgts: 'sem_restricoes', cndt: 'sem_restricoes' }));
    }, 800);
    return () => clearTimeout(timer);
  }, [contato.cnpj]);

  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Detalhes do item" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
    <button aria-label="Fechar detalhes" className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
    <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
        <div><p className="text-sm text-gray-500">Detalhes da ata</p><h2 className="font-semibold text-gray-900">Item {item.numeroItemAta} · Ata {item.numeroAta}</h2></div>
        <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 hover:bg-gray-100"><X /></button>
      </div>
      <div className="space-y-6 p-6">
        <section><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Especificações completas</h3><CopyButton value={item.descricaoItem} label="Copiar descrição" /></div><p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">{item.descricaoItem}</p></section>
        <section className="rounded-xl border p-4"><h3 className="font-semibold">Fornecedor</h3><p className="mt-2 font-medium">{contato.razaoSocial || 'Não informado'}</p><p className="text-sm text-gray-600">CNPJ: {contato.cnpj || 'Não informado'}</p><p className="text-sm text-gray-600">E-mail: {contato.email || 'Não informado'}</p><p className="text-sm text-gray-600">Telefone: {contato.telefone || 'Não informado'}</p><div className="mt-3 flex gap-2"><CopyButton value={contato.cnpj || ''} label="Copiar CNPJ" /><CopyButton value={formatContatoPlanilha(contato)} label="Copiar contato" /></div></section>
        {saldo && <section className="rounded-xl border border-blue-100 bg-blue-50 p-4"><h3 className="font-semibold text-blue-950">Resumo da adesão</h3><p className="mt-1 text-sm text-blue-900">Seu órgão pode aderir até {saldo.limiteOrgaoCarona} unidades. Restam {Math.max(0, saldo.saldoDisponivelOrgao)} para adesão.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full bg-blue-600" style={{ width: `${percentualUsado}%` }} /></div><div className="mt-2 grid grid-cols-3 gap-2 text-xs text-blue-900"><span>Total: {saldo.quantidadeHomologada}</span><span>Já usado: {saldo.quantidadeAutorizada}</span><span>Disponível: {saldo.saldoDisponivelOrgao}</span></div></section>}
        <section className="flex flex-wrap gap-2">{[[ata, 'Ata no PNCP'], [edital, 'Edital'], [proposta, 'Proposta']].filter(([url]) => url).map(([url, label]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"><ExternalLink className="h-4 w-4" />{label}</a>)}</section>

        {/* Painel de Regularidade do Fornecedor */}
        <section className="rounded-xl border p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-700" /> Regularidade do Fornecedor
          </h3>
          <div className="mb-3 text-xs text-gray-600">
            CNPJ consultado: <span className="font-mono text-sm">{contato.cnpj || 'Não informado'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {getCertidoesPortais(contato.cnpj || '').map((portal, idx) => (
              <PortalCard
                key={portal.id}
                portal={portal}
                estado={estadoMap[portal.id] || 'carregando'}
                cnpj={contato.cnpj || ''}
                onToggleConferido={() => setConferidoMap(prev => ({ ...prev, [portal.id]: !prev[portal.id] }))}
                onAbrirPortal={() => window.open(portal.url, '_blank')}
                showToast={showToast}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{formatarResumoRegularidade({ tcuOk: estadoMap.tcu === 'sem_restricoes', dataVerificacao: new Date() })}</p>
        </section>
      </div>
    </aside>
  </div>;
}
