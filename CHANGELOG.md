# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-24

### Adicionado
- **Busca Compras.gov.br ARP**: Integração completa com API pública de Atas de Registro de Preços
  - Endpoint `GET /api/atas/buscar` com validação Zod (`searchSchema`)
  - Endpoint `GET /api/atas/detalhes` para detalhes de item específico (`detailSchema`)
  - Cliente HTTP Axios com timeout 15s e tratamento de erros (`src/lib/api.ts`)
  - Mapeamento de resposta bruta para `ARPItem` tipado (`mapRawToARPItem`)

- **Cálculo de Carona/Adesão (Lei 14.133/2021)**: Implementação fiel do Art. 82
  - `calcularSaldoAdesao()`: saldo = `valorTotalHomologado` - `valorTotalAdesões` - `valorTotalCaronas`
  - `enrichWithSaldoAdesao()`: enriquece lista de itens com `SaldoAdesao` (disponível, percentual, status)
  - Status derivados: `DISPONIVEL`, `INDISPONIVEL`, `ESGOTADO`, `SEM_ADENSAO`
  - Testes unitários cobrindo cenários: saldo positivo, zero, negativo, sem adesões

- **Links Oficiais PNCP e Comprasnet**: Navegação direta para fontes oficiais
  - `convertToPncpAtaLink()`: `https://pncp.gov.br/app/editais/{cnpj}/{ano}/{sequencial}`
  - `convertToPncpEditalLink()`: `https://pncp.gov.br/app/editais/{cnpj}/{ano}/{sequencial}`
  - `convertToPropostaItemLink()`: `https://comprasnet.gov.br/.../proposta/{id}`
  - Testes validando reconstrução de URLs com CNPJ limpo (apenas dígitos)

- **Enriquecimento BrasilAPI**: Consulta automática de dados de fornecedor
  - `fetchFornecedorContato(cnpj)`: busca razão social, telefone, email, endereço
  - `formatContatoPlanilha()`: formatação padronizada para exportação
  - Cache em memória para evitar rate limit

- **Seleção Granular por Item no Frontend**
  - `SearchForm`: filtros por UF, município, palavra-chave, paginação
  - `ResultsTable`: agrupamento por ata, checkbox por item, expansão de detalhes
  - `AtaGroupedResults`: visualização hierárquica (ata → itens)
  - `ItemDetailsDrawer`: painel lateral com detalhes completos do item
  - `SelectedItems` state management com `useReducer`

- **Geração de Planilha Padrão (ExcelJS 4.4)**: Workbook com 4 abas padronizadas
  - `Dashboard_Chefia`: resumo executivo com fórmulas `SOMASE`, `CONT.SE`, formatação condicional
  - `Atas - Mat. Consumo`: itens de material de consumo (22 colunas mapeadas)
  - `Atas - Mat. Permanente`: itens de material permanente (22 colunas mapeadas)
  - `Atas - Contratos`: itens de contratos/serviços (22 colunas mapeadas)
  - Fórmulas em inglês (`SUMIF`, `COUNTIF`) para compatibilidade cross-platform
  - `sanitizeSpreadsheetText()`: neutraliza `=`, `+`, `-`, `@` no início (CWE-1236)
  - Panes congelados, auto-filtro, estilos de header, larguras de coluna otimizadas

- **Integração Google Sheets + Google Drive**
  - `listUserSpreadsheets()`: lista planilhas do usuário autenticado
  - `getSpreadsheetSheets()`: lista abas de uma planilha
  - `appendRowsToSheet()`: escrita em lote com `valueInputOption: USER_ENTERED`
  - OAuth 2.0 com escopos `spreadsheets`, `drive.readonly`

- **Integração Microsoft Graph / Excel Online + OneDrive**
  - `listUserSpreadsheets()`: lista arquivos `.xlsx` no OneDrive
  - `getSpreadsheetSheets()`: lista worksheets via Graph API
  - `appendRowsToExcel()`: escrita via `workbook/worksheets/range` endpoint
  - OAuth 2.0 com escopos `Files.ReadWrite`, `Sites.ReadWrite.All`

- **Autenticação NextAuth v5 (Beta)**
  - Providers: Google Workspace, Azure AD / Entra ID
  - `trustHost: true` para compatibilidade Vercel
  - Callbacks JWT armazenando `accessToken`, `refreshToken`, `provider`, `expiresAt`
  - `getServerAccessToken()` para uso server-side em API routes
  - Middleware de proteção de rotas `(dashboard)/`

- **Exportação Local (Download Direto)**
  - `ExportButtons`: XLSX (padrão), CSV (por aba), JSON (dados brutos)
  - Geração em memória via `excelExport.ts` → `Blob` → download

- **Arquitetura Documentada (Arc42 / C4 Model)**
  - `docs/ARCHITECTURE.md`: contexto, container, component, code diagrams (Mermaid)
  - Regras de negócio Lei 14.133/2021 documentadas
  - Contratos HTTP (request/response) para todas as 7 API routes
  - ADRs: NextAuth v5, ExcelJS, Zod, Vitest, Turbopack

- **Testes Automatizados (Vitest)**
  - `tests/business-rules.test.ts`: 10 testes passando
  - Cobertura: saldo adesão, links PNCP/Comprasnet, mapeamento planilha, sanitização, formatação contato

- **Qualidade de Código**
  - TypeScript 5 strict mode (zero erros)
  - ESLint + Prettier configurados
  - TSDoc/JSDoc completo em 18 módulos (types, lib, api routes, components)
  - Conventional Commits adotados

### Corrigido
- **ExcelJS 4.4 API**: migração `freezePanes` → `views` (breaking change da lib)
- **Map iteration**: correção de `.map()` e `.length` em `Map` (usar `Array.from()` / `size`)
- **Prop destructuring**: correção em `SpreadsheetPicker` (props faltantes)
- **TSDoc syntax**: remoção de comentários malformados dentro de object literals e function bodies

### Segurança
- `.gitignore` reforçado: bloqueia `.env*`, `*.xlsx`, `*.xls`, `*.csv`, `node_modules/`, `.next/`, `.vercel/`
- `.env.example` versionado com placeholders
- Sanitização de injeção de fórmulas em exportações (CWE-1236)
- Validação Zod em todas as rotas API
- Tokens OAuth apenas no servidor (JWT criptografado HttpOnly cookie)

---

## [Unreleased]

### Planejado
- Rate limiting configurável no middleware
- Cache Redis para respostas Compras.gov.br / BrasilAPI
- Testes de integração (Playwright) para fluxos E2E
- Métricas de performance (Web Vitals)
- Internacionalização (i18n) pt-BR / en-US

---

**Legenda**:
- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Obsoleto` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para correções de vulnerabilidades