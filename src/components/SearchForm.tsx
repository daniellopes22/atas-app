/**
 * @fileoverview Formulário de pesquisa de Atas de Registro de Preços com filtros básicos e avançados.
 *
 * @module components/SearchForm
 */
'use client';

import { useState } from 'react';
import { SearchFilters } from '@/types';
import { getDefaultDateRange } from '@/lib/api';
import { Calendar, Search, Filter, X } from 'lucide-react';

/** Propriedades de {@link SearchForm} */
interface SearchFormProps {
  /** Callback disparado ao submeter os filtros preenchidos */
  onSearch: (filters: SearchFilters) => void;
  /** Indica estado de carregamento para desabilitar o botão de submissão */
  isLoading: boolean;
}

/**
 * Formulário interativo para busca de itens ARP por PDM, CATMAT, palavra-chave, esfera e vigência.
 *
 * @param {SearchFormProps} props
 * @returns {JSX.Element}
 */
export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const { min, max } = getDefaultDateRange();
    return {
      esfera: 'F',
      apenasVigentesHoje: true,
      dataVigenciaInicialMin: min,
      dataVigenciaInicialMax: max,
    };
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleClear = () => {
    const { min, max } = getDefaultDateRange();
    setFilters({
      esfera: 'F',
      apenasVigentesHoje: true,
      dataVigenciaInicialMin: min,
      dataVigenciaInicialMax: max,
      codigoPdm: '',
      codigoCatmat: '',
      palavraChave: '',
    });
  };

  const applyKeywordExample = (palavraChave: string) => {
    setFilters(prev => ({ ...prev, palavraChave }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      {/* Linha 1: Filtros principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="codigoPdm" className="block text-sm font-medium text-gray-700 mb-1">
            Código PDM
          </label>
          <input
            type="text"
            id="codigoPdm"
            name="codigoPdm"
            value={filters.codigoPdm || ''}
            onChange={handleChange}
            placeholder="Ex: 6661"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="codigoCatmat" className="block text-sm font-medium text-gray-700 mb-1">
            Código CATMAT
          </label>
          <input
            type="text"
            id="codigoCatmat"
            name="codigoCatmat"
            value={filters.codigoCatmat || ''}
            onChange={handleChange}
            placeholder="Ex: 382959"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="palavraChave" className="block text-sm font-medium text-gray-700 mb-1">
            Palavra-chave na descrição
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="palavraChave"
              name="palavraChave"
              value={filters.palavraChave || ''}
              onChange={handleChange}
              placeholder="Ex: MICROCOMPUTADOR, NOTEBOOK, IMPRESSORA..."
              className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="self-center text-gray-500">Testar com:</span>
            <button type="button" onClick={() => setFilters(prev => ({ ...prev, codigoPdm: '6661' }))} className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">PDM 6661</button>
            <button type="button" onClick={() => applyKeywordExample('MICROCOMPUTADOR')} className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">Microcomputador</button>
            <button type="button" onClick={() => applyKeywordExample('NOTEBOOK')} className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">Notebook</button>
            <button type="button" onClick={() => applyKeywordExample('MONITOR')} className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">Monitor</button>
          </div>
        </div>
      </div>

      {/* Linha 2: Esfera e Datas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="esfera" className="block text-sm font-medium text-gray-700 mb-1">
            Esfera
          </label>
          <select
            id="esfera"
            name="esfera"
            value={filters.esfera}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="F">Federal (F)</option>
            <option value="E">Estadual (E)</option>
            <option value="M">Municipal (M)</option>
            <option value="T">Todas</option>
          </select>
        </div>

        <div>
          <label htmlFor="dataVigenciaInicialMin" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Vigência Inicial Mínima
          </label>
          <input
            type="date"
            id="dataVigenciaInicialMin"
            name="dataVigenciaInicialMin"
            value={filters.dataVigenciaInicialMin || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dataVigenciaInicialMax" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Vigência Inicial Máxima
          </label>
          <input
            type="date"
            id="dataVigenciaInicialMax"
            name="dataVigenciaInicialMax"
            value={filters.dataVigenciaInicialMax || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center cursor-pointer w-full">
            <input
              type="checkbox"
              name="apenasVigentesHoje"
              checked={filters.apenasVigentesHoje}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Apenas atas vigentes hoje (dataVigenciaFinal ≥ hoje)</span>
          </label>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Search className="w-5 h-5" />
          {isLoading ? 'Buscando...' : 'Buscar Atas'}
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpar
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors ml-auto"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
        </button>
      </div>
    </form>
  );
}