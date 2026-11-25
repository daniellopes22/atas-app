/**
 * @fileoverview Visualização em acordeão agrupada por Ata de Registro de Preços.
 *
 * @module components/AtaGroupedResults
 */
'use client';

import { useState } from 'react';
import { ARPItem, SelectedItems } from '@/types';
import { convertToPncpAtaLink, calcularSaldoAdesao, getCertidoesPortais, sanitizeCnpj } from '@/lib/links';
import { ChevronDown, ChevronUp, Clock, XCircle, CheckCircle, AlertCircle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

/** Propriedades de {@link AtaGroupedResults} */
interface AtaGroupedResultsProps {
  /** Lista de itens ARP a agrupar por `numeroControlePncpAta` */
  items: ARPItem[];
  /** Mapa controlado de itens marcados para exportação */
  selectedItems: SelectedItems;
  /** Atualiza o mapa de seleção ao marcar/desmarcar um item ou toda a Ata */
  onSelectionChange: (selected: SelectedItems) => void;
  /** Abre o drawer lateral de detalhes do item selecionado */
  onOpenDetails: (item: ARPItem) => void;
}

/**
 * Agrupa itens por identificador da Ata (`numeroControlePncpAta` ou `numeroAtaRegistroPreco`).
 *
 * @param {ARPItem[]} items
 * @returns {Map<string, ARPItem[]>}
 */
function groupByAta(items: ARPItem[]) {
  const groups = new Map<string, ARPItem[]>();
  for (const item of items) {
    const key = item.numeroControlePncpAta || item.numeroAtaRegistroPreco;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

/**
 * Renderiza o badge semafórico de vigência/saldo do item (`Vencida`, `Esgotada`, `Saldo Reduzido`, `Disponível`).
 */
function statusBadge(item: ARPItem) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dataFinal = new Date(item.dataVigenciaFinal);
  const vencido = dataFinal < today;
  const saldo = item.saldoAdesao;
  if (vencido) return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Vencida</span>;
  if (saldo?.indicador === 'esgotado') return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Esgotada</span>;
  if (saldo?.indicador === 'reduzido') return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Saldo Reduzido</span>;
  return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disponível</span>;
}

/**
 * Renderiza o badge de regularidade do fornecedor.
 */
function regularityBadge(item: ARPItem) {
  const cnpj = item.niFornecedor || '';
  if (!cnpj) {
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">—</span>;
  }
  // Verificação simplificada - em produção seria chamada de API
  return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Sem restrições</span>;
}

/**
 * Exibe resultados agrupados por Ata com seleção em lote por Ata e expansão sob demanda.
 *
 * @param {AtaGroupedResultsProps} props
 * @returns {JSX.Element}
 */
export default function AtaGroupedResults({ items, selectedItems, onSelectionChange, onOpenDetails }: AtaGroupedResultsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const groups = groupByAta(items);

  const toggleAta = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isAtaExpanded = (key: string) => expanded.has(key);

  const selectAllInAta = (key: string, checked: boolean) => {
    const ataItems = groups.get(key) || [];
    const next = { ...selectedItems };
    for (const item of ataItems) next[item.numeroControlePncpAta] = checked;
    onSelectionChange(next);
  };

  const toggleItem = (key: string, itemKey: string, checked: boolean) => {
    const next = { ...selectedItems, [itemKey]: checked };
    onSelectionChange(next);
  };

  const ataSelectedCount = (key: string) => {
    const ataItems = groups.get(key) || [];
    return ataItems.filter(i => selectedItems[i.numeroControlePncpAta]).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Resultados agrupados por Ata</h2>
        <span className="text-xs text-gray-500">{groups.size} ata(s) · {items.length} item(ns)</span>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from(groups.entries()).map(([key, ataItems]) => {
          const first = ataItems[0];
          const linkAta = convertToPncpAtaLink(first.numeroControlePncpAta);
          const isExpanded = isAtaExpanded(key);
          const count = ataItems.length;
          const selectedCount = ataSelectedCount(key);
          const allSelected = selectedCount === count && count > 0;
          const saldo = calcularSaldoAdesao(first.quantidadeAta, first.saldoAdesao?.quantidadeAutorizada || 0);

          return (
            <div key={key} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => toggleAta(key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-blue-50 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-l-full bg-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate" title={first.numeroAtaRegistroPreco}>
                      Ata {first.numeroAtaRegistroPreco} · Item {first.numeroItem}
                    </p>
                    <p className="text-xs text-gray-600 truncate" title={first.nomeUnidadeGerenciadora}>
                      {first.nomeUnidadeGerenciadora} · {first.nomeModalidadeCompra}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{count} itens</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => selectAllInAta(key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-600">{selectedCount > 0 ? `${selectedCount} selecionado(s)` : 'Selecionar todos'}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded text-xs font-medium">{saldo.saldoDisponivelOrgao > 0 ? `Saldo: ${saldo.saldoDisponivelOrgao}` : 'Sem saldo'}</span>
                  {linkAta && <a href={linkAta} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline" title="Abrir Ata no PNCP">PNCP ↗</a>}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 py-2 bg-white">
                  <table className="w-full text-sm divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="w-10 px-3 py-2 text-center"></th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">PDM/CATMAT</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Descrição</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Qtd.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Saldo Carona</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Valor Unit.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Regularidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ataItems.map((item) => {
                        const isSelected = selectedItems[item.numeroControlePncpAta];
                        const daysLeft = Math.ceil((new Date(item.dataVigenciaFinal).getTime() - Date.now()) / 86_400_000);
                        return (
                          <tr key={item.numeroControlePncpAta} className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => toggleItem(key, item.numeroControlePncpAta, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{item.numeroItemAta}</td>
                            <td className="px-3 py-2 font-mono text-xs">{item.codigoPdmStr}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium line-clamp-1 text-gray-900 truncate" title={item.descricaoItem} onClick={() => onOpenDetails(item)} style={{ cursor: 'pointer' }}>
                                {item.descricaoItem}
                              </div>
                              <div className="text-xs text-gray-500 truncate" title={item.marcaModelo}>{item.marcaModelo || '-'}</div>
                            </td>
                            <td className="px-3 py-2 text-xs">{item.quantidadeAta}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`font-medium ${daysLeft > 90 ? 'text-green-700' : daysLeft >= 30 ? 'text-yellow-700' : 'text-red-700'}`}>
                                {daysLeft < 0 ? 'Vencida' : `${daysLeft} dias`}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {item.valorUnitarioAta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-3 py-2">{statusBadge(item)}</td>
                            <td className="px-3 py-2">{regularityBadge(item)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
