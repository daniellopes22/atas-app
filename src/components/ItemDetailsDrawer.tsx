/**
 * @fileoverview Drawer lateral acessível (`role="dialog"`) com especificações, fornecedor,
 * cálculo visual de saldo Lei 14.133/2021 e links PNCP/Comprasnet.
 *
 * @module components/ItemDetailsDrawer
 */
'use client';

import { ARPItem } from '@/types';
import { convertToPncpAtaLink, convertToPncpEditalLink, convertToPropostaItemLink, formatContatoPlanilha } from '@/lib/links';
import { Copy, ExternalLink, X } from 'lucide-react';

/** Propriedades de {@link ItemDetailsDrawer} */
interface ItemDetailsDrawerProps {
  /** Item ARP selecionado para inspeção; `null` mantém o drawer fechado */
  item: ARPItem | null;
  /** Callback para fechar o drawer (clique no backdrop, botão X ou tecla Escape) */
  onClose: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return <button onClick={() => navigator.clipboard.writeText(value)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50"><Copy className="h-3.5 w-3.5" />{label}</button>;
}

/**
 * Painel lateral de detalhes do item ARP com atalhos de cópia e links externos oficiais.
 *
 * @param {ItemDetailsDrawerProps} props
 * @returns {JSX.Element | null}
 */
export default function ItemDetailsDrawer({ item, onClose }: ItemDetailsDrawerProps) {
  if (!item) return null;
  const saldo = item.saldoAdesao;
  const ata = convertToPncpAtaLink(item.numeroControlePncpAta);
  const edital = convertToPncpEditalLink(item.numeroControlePncpAta);
  const proposta = convertToPropostaItemLink(item);
  const percentualUsado = saldo?.quantidadeHomologada ? Math.min(100, Math.max(0, (saldo.quantidadeAutorizada / (saldo.quantidadeHomologada * 2)) * 100)) : 0;
  const contato = item.contatoFornecedor || { cnpj: item.niFornecedor, razaoSocial: item.nomeRazaoSocialFornecedor };

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
      </div>
    </aside>
  </div>;
}
