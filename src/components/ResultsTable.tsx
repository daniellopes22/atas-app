/**
 * @fileoverview Tabela plana de resultados ARP com ordenação, filtro rápido e seleção múltipla.
 *
 * @module components/ResultsTable
 */
'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { ARPItem, SheetType, SelectedItems } from '@/types';
import { convertToPncpAtaLink } from '@/lib/links';
import { Check, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

/** Propriedades de {@link ResultsTable} */
interface ResultsTableProps {
  /** Itens retornados pela busca */
  items: ARPItem[];
  /** Callback acionado sempre que o mapa de seleção muda */
  onSelectionChange: (selected: SelectedItems) => void;
  /** Tipo de aba selecionado (influencia preview de colunas) */
  sheetType: SheetType;
  /** Abre o drawer lateral com detalhes completos e saldo do item */
  onOpenDetails: (item: ARPItem) => void;
}

/**
 * Renderiza os itens encontrados em formato tabular com busca instantânea, ordenação por coluna e checkboxes.
 *
 * @param {ResultsTableProps} props
 * @returns {JSX.Element}
 */
export default function ResultsTable({ items, onSelectionChange, sheetType, onOpenDetails }: ResultsTableProps) {
  const [selected, setSelected] = useState<SelectedItems>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof ARPItem; direction: 'asc' | 'desc' } | null>(null);
  const [quickFilter, setQuickFilter] = useState('');

  const handleSelectAll = (checked: boolean) => {
    const newSelected: SelectedItems = {};
    if (checked) {
      items.forEach(item => {
        newSelected[item.numeroControlePncpAta] = true;
      });
    }
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const handleRowSelect = (key: string, checked: boolean) => {
    const newSelected = { ...selected, [key]: checked };
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSort = (key: keyof ARPItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedItems = useMemo(() => {
    const filtered = items.filter(item => `${item.marcaModelo} ${item.orgaoNome} ${item.uasg}`.toLowerCase().includes(quickFilter.toLowerCase()));
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] as any;
      const bVal = b[sortConfig.key] as any;
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig, quickFilter]);

  const setQuickSort = (key: keyof ARPItem, direction: 'asc' | 'desc') => setSortConfig({ key, direction });

  const selectedCount = Object.values(selected).filter(v => v).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  interface TableColumn {
    key: keyof ARPItem;
    label: string;
    format?: (value: any) => string;
  }

  const columns: TableColumn[] = sheetType === 'consumo' ? [
        { key: 'descricaoItem', label: 'Material' },
        { key: 'codigoCatmat', label: 'CATMAT' },
        { key: 'marcaModelo', label: 'Marca/Modelo' },
        { key: 'valorUnitarioEstimado', label: 'Vl. Unit. Est.', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
        { key: 'valorUnitarioAta', label: 'Vl. Unit. Ata', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
        { key: 'quantidadeAta', label: 'Qtd. Ata' },
        { key: 'dataVigenciaFinal', label: 'Validade', format: (v: string) => v.split('T')[0] },
        { key: 'uasg', label: 'UASG' },
        { key: 'numeroCompra', label: 'Pregão' },
        { key: 'numeroAta', label: 'Nº Ata' },
        { key: 'numeroItemAta', label: 'Item' },
  ] : sheetType === 'permanente' ? [
        { key: 'numeroControlePncpAta', label: 'ID Ata PNCP' },
        { key: 'descricaoItem', label: 'Material' },
        { key: 'marcaModelo', label: 'Marca/Modelo' },
        { key: 'quantidadeAta', label: 'Qtd. Ata' },
        { key: 'valorUnitarioAta', label: 'Vl. Unit.', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
        { key: 'dataVigenciaFinal', label: 'Validade', format: (v: string) => v.split('T')[0] },
        { key: 'uasg', label: 'UASG (Órgão)' },
                { key: 'numeroCompra', label: 'Pregão' },
                { key: 'numeroAta', label: 'Nº Ata' },
                { key: 'numeroItemAta', label: 'Item' },
  ] : [
              { key: 'descricaoItem', label: 'Material' },
              { key: 'marcaModelo', label: 'Marca/Modelo' },
              { key: 'quantidadeAta', label: 'Qtd. Ata' },
              { key: 'valorUnitarioAta', label: 'Vl. Unit.', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
              { key: 'dataVigenciaFinal', label: 'Validade', format: (v: string) => v.split('T')[0] },
              { key: 'uasg', label: 'UASG' },
              { key: 'numeroCompra', label: 'Pregão' },
              { key: 'numeroAta', label: 'Nº Ata' },
              { key: 'numeroItemAta', label: 'Item' },
  ];

  const getStatusBadge = (item: ARPItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dataFinal = new Date(item.dataVigenciaFinal);
    const vencido = dataFinal < today;
    
    if (vencido) {
      return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Vencida</span>;
    }
    if (item.saldoAdesao?.indicador === 'esgotado') {
      return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Esgotada</span>;
    }
    if (item.saldoAdesao?.indicador === 'reduzido') {
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Saldo Reduzido</span>;
    }
    return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disponível</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={allSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
            Selecionar todos ({items.length})
          </label>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button onClick={() => setQuickSort('valorUnitarioAta', 'asc')} className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-white">Menor preço</button>
          <button onClick={() => setQuickSort('dataVigenciaFinal', 'desc')} className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-white">Maior validade</button>
          <input value={quickFilter} onChange={(event) => setQuickFilter(event.target.value)} placeholder="Filtrar por marca ou órgão" className="min-w-48 rounded-lg border px-3 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{selectedCount} item(s) selecionado(s)</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
            {sheetType === 'consumo' ? 'Mat. Consumo' : sheetType === 'permanente' ? 'Mat. Permanente' : 'Contratos'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(col.key as keyof ARPItem)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedItems.map((item, index) => {
              const isSelected = selected[item.numeroControlePncpAta];
              const linkAta = convertToPncpAtaLink(item.numeroControlePncpAta);
              const daysLeft = Math.ceil((new Date(item.dataVigenciaFinal).getTime() - Date.now()) / 86_400_000);

              return (
                <React.Fragment key={item.numeroControlePncpAta}>
                  <tr
                    className={`${isSelected ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'A') {
                        handleRowSelect(item.numeroControlePncpAta, !isSelected);
                      }
                    }}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(item.numeroControlePncpAta, e.target.checked);
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-3 py-2 text-sm text-gray-900">
                        {col.key === 'numeroControlePncpAta' ? (
                          <a
                            href={linkAta}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.numeroControlePncpAta}
                          </a>
                        ) : col.key === 'descricaoItem' ? (
                          <div>
                            <div className="font-medium line-clamp-2 max-w-xs" title={item.descricaoItem}>
                              {item.descricaoItem}
                            </div>
                            {item.marcaModelo && (
                              <div className="text-xs text-gray-500 truncate max-w-xs" title={item.marcaModelo}>
                                {item.marcaModelo}
                              </div>
                            )}
                            <button onClick={(event) => { event.stopPropagation(); onOpenDetails(item); }} className="mt-1 text-xs font-medium text-blue-700 hover:underline">Ver especificações completas</button>
                          </div>
                        ) : col.key === 'marcaModelo' ? (
                          <span className="truncate max-w-xs block" title={item.marcaModelo || ''}>
                            {item.marcaModelo || '-'}
                          </span>
                        ) : col.key === 'dataVigenciaFinal' ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${daysLeft > 90 ? 'bg-green-100 text-green-800' : daysLeft >= 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{daysLeft < 0 ? 'Vencida' : `${daysLeft} dias`}</span>
                        ) : col.format ? (
                                                  col.format((item as any)[col.key])
                        ) : (
                                                  String((item as any)[col.key] ?? '-')
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-sm">
                      {getStatusBadge(item)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Nenhum resultado encontrado. Ajuste os filtros e tente novamente.
        </div>
      )}
    </div>
  );
}