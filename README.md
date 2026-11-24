# Pesquisa de Atas de Registro de Preços

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-000000?logo=next.js)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/) [![Lei 14.133/2021](https://img.shields.io/badge/Compras_públicas-Lei_14.133%2F2021-1D4ED8)](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

Aplicação web para pesquisar Atas de Registro de Preços na API de Dados Abertos do Compras.gov.br, calcular saldo de adesão, reconstruir links do PNCP e Comprasnet e enviar resultados para Google Sheets ou Excel Online.

> Sistema voltado ao apoio operacional de equipes administrativas. O cálculo de saldo usa os limites configurados no código e não substitui análise jurídica, documental ou conferência de adesões já autorizadas.

## Principais recursos

- Busca por PDM, CATMAT, palavra-chave, esfera e período de vigência.
- Filtro de atas vigentes na data atual.
- Cálculo automático do limite de 50% por órgão e do teto global de 2 vezes a quantidade homologada.
- Enriquecimento de contato do fornecedor pela BrasilAPI CNPJ.
- Reconstrução de links da Ata e do Edital no PNCP e do item no Comprasnet.
- Barra comparativa de menor preço e preço médio quando disponível na interface.
- Seleção de itens e inclusão em planilhas Google ou Excel Online.
- Exportação offline para `.xlsx`.
- Abas de destino: `Atas - Mat. Consumo`, `Atas - Mat. Permanente` e `Atas - Contratos`.

> Limitação atual: o código não consulta autorizações já realizadas. `quantidadeAutorizada` começa em zero. O campo CATMAT é mapeado a partir de PDM porque a resposta usada da API não fornece CATMAT separado.

## Guia rápido para usuários

1. Acesse o sistema e clique em **Continuar com Google** ou **Continuar com Microsoft**.
2. Clique em **Conectar Planilha** e escolha uma planilha Google no Drive ou arquivo Excel `.xlsx`, `.xls` ou `.xlsm` no OneDrive.
3. Pesquise por PDM, CATMAT ou palavra-chave. Use filtros de esfera, vigência e atas vigentes.
4. Marque itens, escolha uma aba de destino e clique em **Incluir na Planilha**. Se preferir, use a exportação offline `.xlsx`.

## Fontes de dados e arquitetura

| Integração | Informação fornecida |
|---|---|
| [Compras.gov.br Dados Abertos — módulo ARP](https://dadosabertos.compras.gov.br/) | Itens, atas, quantidades, valores, fornecedor, órgão e vigência. Cliente usa `modulo-arp/2_consultarARPItem`. |
| [PNCP](https://pncp.gov.br/) | Links reconstruídos para Ata e Edital a partir de `numeroControlePncpAta`. |
| [Comprasnet](https://cnetmobile.estaleiro.serpro.gov.br/) | Link reconstruído para acompanhamento da proposta do item. |
| [BrasilAPI CNPJ](https://brasilapi.com.br/) | Razão social, e-mail e telefone do fornecedor. |
| [Google Sheets/Drive](https://developers.google.com/sheets/api) | Lista de planilhas Google, leitura de abas e inclusão de linhas. |
| [Microsoft Graph](https://learn.microsoft.com/graph/) | Lista de arquivos Excel no OneDrive, leitura de worksheets e escrita no workbook. |

### Estrutura principal

```text
src/
├── auth.ts                         # NextAuth: Google e Azure AD
├── app/
│   ├── (auth)/login/page.tsx       # Login
│   ├── (dashboard)/buscar/page.tsx # Busca, seleção e escrita
│   └── api/                        # Rotas HTTP da aplicação
├── components/                     # Formulário, tabela, exportação e seletor
├── lib/
│   ├── api.ts                      # Cliente Compras.gov.br
│   ├── links.ts                    # PNCP, Comprasnet, BrasilAPI e saldo
│   ├── googleSheets.ts              # Google Sheets/Drive
│   ├── microsoftGraph.ts            # Excel Online/OneDrive
│   ├── sheetMapping.ts              # Mapeamento das três abas
│   └── excelExport.ts               # Exportação local XLSX
└── types/index.ts                  # Tipos compartilhados
```

### Segurança e limites conhecidos

- NextAuth mantém sessão no servidor e entrega tokens somente às rotas autenticadas.
- Credenciais ficam em variáveis de ambiente e `.env*` está ignorado pelo Git.
- Rotas validam autenticação, provedor, identificador da planilha e itens antes da escrita.
- A aplicação usa URLs externas fixas para integrações conhecidas.
- Fórmulas e conteúdo de planilhas exigem revisão antes de uso institucional; não trate entrada externa como fórmula confiável.
- Não há implementação identificável de bloqueio geral contra SSRF ou deduplicação de linhas no código atual; não documentar esses recursos como existentes.

## Implantação para administrador

### Etapa A — Google Cloud Console

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e crie ou selecione um projeto.
2. Ative **Google Sheets API**, **Google Drive API** e **Google Picker API**. A implementação atual usa diretamente Sheets e Drive; Picker deve ser ativado apenas se versão futura do seletor precisar dele.
3. Configure **APIs e serviços → Tela de consentimento OAuth**. Adicione os escopos usados pelo código:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
   - `openid email profile`
4. Em **Credenciais**, crie um **ID do cliente OAuth → Aplicativo da Web**.
5. Adicione estes URIs de redirecionamento autorizados:
   - `https://<seu-dominio>.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
6. Copie Client ID e Client Secret para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
7. Crie uma chave de API se a versão implantada usar Google Picker. O código atual não lê variável `GOOGLE_API_KEY`.

### Etapa B — Microsoft Entra ID / Azure Portal

1. Abra [Microsoft Entra](https://entra.microsoft.com/) → **Registros de aplicativo** → **Novo registro**.
2. Cadastre plataforma **Web** com:
   - `https://<seu-dominio>.vercel.app/api/auth/callback/azure-ad`
   - `http://localhost:3000/api/auth/callback/azure-ad`
3. Em **Permissões de API → Microsoft Graph → Delegadas**, adicione `Files.ReadWrite.All` e `User.Read`. O código também solicita `openid email profile offline_access`.
4. Em **Certificados e segredos**, crie um **Client Secret** e copie o valor imediatamente.
5. Copie IDs e segredo para `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` e `AZURE_AD_TENANT_ID`. Use `common` para o tenant padrão aceito pelo código.

### Etapa C — Vercel

1. Publique o repositório no GitHub.
2. Abra [Vercel](https://vercel.com/new), importe o repositório e mantenha framework **Next.js**.
3. Cadastre variáveis em **Settings → Environment Variables**:

| Variável | Obrigatória | Onde obter |
|---|---:|---|
| `NEXTAUTH_URL` | Sim | URL final do deploy, ex: `https://seu-app.vercel.app` (usado pelo NextAuth para callbacks). |
| `NEXTAUTH_SECRET` | Sim | Gere com `openssl rand -base64 32`. Nunca publique. |
| `GOOGLE_CLIENT_ID` | Sim para Google | Google Cloud Console → credencial OAuth. |
| `GOOGLE_CLIENT_SECRET` | Sim para Google | Google Cloud Console → credencial OAuth. |
| `AZURE_AD_CLIENT_ID` | Sim para Microsoft | Entra → ID do aplicativo (cliente). |
| `AZURE_AD_CLIENT_SECRET` | Sim para Microsoft | Entra → valor de Client Secret. |
| `AZURE_AD_TENANT_ID` | Não | ID do tenant; `common` é padrão no código. |

### Callback URLs obrigatórias

| Provedor | URL de Callback |
|---|---|
| Google | `https://<seu-dominio>.vercel.app/api/auth/callback/google` |
| Microsoft (Azure AD) | `https://<seu-dominio>.vercel.app/api/auth/callback/azure-ad` |

> Configure **exatamente** estas URLs nos respectivos consoles OAuth. Substitua `<seu-dominio>` pelo domínio Vercel real após o primeiro deploy.

4. Faça o deploy.
5. Substitua `<seu-dominio>` pelo domínio Vercel real nos dois provedores OAuth.
6. Redeploy após alterar variáveis ou callbacks.

> O arquivo `src/auth.ts` lê exatamente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` e `NEXTAUTH_SECRET`. Não existe `GOOGLE_API_KEY` usada pela aplicação atual.

## Modelo das planilhas

A planilha conectada deve possuir a aba escolhida com o nome exato. O sistema valida a existência da aba antes de escrever no Google Sheets. Para Excel Online, mantenha worksheets com esses nomes:

- `Atas - Mat. Consumo`
- `Atas - Mat. Permanente`
- `Atas - Contratos`

A planilha anexada ao projeto pode servir como modelo operacional. Faça cópia antes de testar escrita automática.

## Execução local

Requisito: Node.js compatível com Next.js 16 e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
npm run build
```

> Scripts disponíveis: `dev`, `build`, `start`, `lint` e `test` (executa `vitest run`).

Abra `http://localhost:3000`.

No Windows PowerShell, copie o ambiente com:

```powershell
Copy-Item .env.example .env.local
```

> Nunca envie `.env.local`, segredos OAuth, tokens ou planilhas locais `*.xlsx`, `*.xls` e `*.xlsm` ao repositório. O `.gitignore` já protege `.env*`; confirme a proteção de planilhas antes do primeiro commit.

## Scripts disponíveis

| Comando | Uso |
|---|---|
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build de produção |
| `npm run start` | Executar build de produção |
| `npm run lint` | Verificar lint |

## Licença e contribuição

Copyright © 2026 **Daniel Lopes Ferreira**.

Este projeto é software livre licenciado sob a **GNU General Public License v3.0 (GPL-3.0)** — padrão adotado pelo **Software Público Brasileiro** (Portaria STI/MP nº 46/2016 e Lei nº 9.609/1998). Você pode usar, estudar, modificar e redistribuir este código, desde que eventuais obras derivadas permaneçam sob a mesma licença livre. Consulte o texto integral em [`LICENSE`](./LICENSE).

Contribuições são bem-vindas via Pull Request seguindo o checklist de [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md). Para vulnerabilidades de segurança, consulte [`SECURITY.md`](./SECURITY.md).

## Solução de problemas

- **Login falha:** confira variáveis, callbacks exatos e relógio do ambiente.
- **Planilha não aparece:** confirme provedor, permissões delegadas e arquivo no Drive/OneDrive correto.
- **Aba não encontrada:** use um dos três nomes exatos.
- **Saldo inesperado:** o código assume autorizações iguais a zero e aplica `Math.floor(quantidadeAta / 2)`.
- **`npm test` falha:** verifique se `vitest` está instalado (`npm install`) e rode `npx vitest run` para diagnóstico.

## Rotas internas

| Método | Rota | Função |
|---|---|---|
| `GET`, `POST` | `/api/auth/[...nextauth]` | OAuth e sessão |
| `POST` | `/api/atas/buscar` | Pesquisa ARP |
| `POST` | `/api/atas/detalhes` | Detalhes e enriquecimento |
| `GET` | `/api/planilha/listar` | Lista planilhas do provedor |
| `POST` | `/api/planilha/escrever` | Escreve itens na planilha |
| `POST` | `/api/sheets/create` | Cria planilha padrão institucional (Google/Microsoft) |

## Funcionalidades avançadas implementadas

### Planilha Padrão Institucional (`/api/sheets/create`)
Gera em memória um workbook `.xlsx` com **4 abas** prontas para uso:
- **`Dashboard_Chefia`** — Resumo executivo com fórmulas `COUNTA`, `COUNTIF`, `COUNTIFS`, `SUM` referenciando as abas de dados. Inclui totais gerais, formatação monetária (R$) e congelamento de painéis.
- **`Atas - Mat. Consumo`** — 17 colunas padronizadas (ID Controle PNCP, Status Vigência, Órgão, Nº Ata, Código PDM/CATMAT, Descrição, Unidade, Qtd. Homologada, Limite Carona 50%, Saldo Disponível, Valor Unitário, Valor Total, Fim Vigência, Fornecedor & Contatos, Link Ata PNCP, Link Proposta Comprasnet, Data Inclusão).
- **`Atas - Mat. Permanente`** — Mesma estrutura da aba Consumo.
- **`Atas - Contratos`** — Mesma estrutura da aba Consumo.

Compatível com **Google Sheets** (importação via Drive API) e **Excel Online** (OneDrive/SharePoint via Microsoft Graph). Sem checkboxes internos, com cabeçalhos estilizados (azul marinho), linhas alternadas, auto-filtro e congelamento de cabeçalho.

### Visualização Dupla de Resultados
- **Agrupado por Ata** (acordeão expansível): Cabeçalho da ata com checkbox "Selecionar todos", contador de itens, saldo de carona e link PNCP. Expansão mostra tabela detalhada com checkboxes individuais por item.
- **Lista Corrida** (`ResultsTable`): Tabela única com ordenação por coluna, filtro rápido local, seleção múltipla e badge de status (Vigente/Esgotada/Reduzido/Vencida).

### Seleção Persistente
Seleção de itens mantida entre buscas e trocas de visualização (agrupado/lista). Estado gerenciado no componente pai (`BuscarPage`) via `selectedItems: Record<string, boolean>`.

### Barra de Ação Fixa (Sticky Action Bar)
Componente `ExportButtons` fixo no rodapé quando há itens selecionados:
- Dropdown para escolher aba de destino (Consumo/Permanente/Contratos)
- Botão **Adicionar Selecionados à Planilha** (verifica duplicidades via `numeroControlePncpAta`)
- Botão **+ Nova Planilha Padrão** (abre modal para nome e provedor)
- Botão **Baixar Excel dos Selecionados** (exportação local `.xlsx`)
- Botão **Limpar Seleção**

### Enriquecimento de Dados
- **BrasilAPI CNPJ**: Busca razão social, e-mail e telefone do fornecedor com fallback gracioso (não bloqueia fluxo se API falhar).
- **Links PNCP**: Reconstrução de Ata (`/app/atas/{cnpj}/{ano}/{seqCompra}/{seqAta}`) e Edital (`/app/editais/{cnpj}/{ano}/{seqCompra}`) removendo zeros à esquerda das sequências.
- **Link Comprasnet**: Monta URL com UASG (6 dígitos), prefixo `05` e Pregão (9 dígitos) + número do item.

### Cálculo de Saldo (Lei 14.133/2021)
```typescript
limiteOrgaoCarona = Math.floor(quantidadeAta / 2)        // Art. 86, § 4º — 50% por órgão
saldoGlobalRestante = (quantidadeAta * 2) - autorizados   // Art. 86, § 5º — teto global 2x
saldoDisponivelOrgao = min(limiteOrgaoCarona, saldoGlobalRestante)
```
Indicadores: `disponivel` (verde), `reduzido` (amarelo ≤ 20% do limite), `esgotado` (vermelho = 0), `vencido` (vermelho se data final < hoje).

### Segurança e Compatibilidade Vercel
- `export const runtime = 'nodejs'` e `export const maxDuration = 60` em **todas** as rotas de API.
- `trustHost: true` no NextAuth (`src/auth.ts`).
- Ausência de `fs.writeFile` / gravação em disco.
- Ausência de `http://localhost:3000` hardcoded (usa `NEXTAUTH_URL` dinâmico).
- `.gitignore` bloqueia `.env*`, `node_modules/`, `.next/`, `coverage/`, `*.xlsx`, `*.xls`, `*.xlsm`, `*.csv`.
