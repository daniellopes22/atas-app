# Política de Segurança

## Versões Suportadas

| Versão | Suportada |
|--------|-----------|
| 1.0.x  | ✅ Sim    |
| < 1.0  | ❌ Não    |

## Reportando Vulnerabilidades

**NÃO** abra issues públicas para vulnerabilidades de segurança.

Envie um relatório privado para: **security@[seu-dominio].gov.br** (ou abra um *Security Advisory* privado no GitHub).

### O que incluir no relatório
- Descrição da vulnerabilidade e impacto potencial
- Passos para reproduzir (se aplicável)
- Versão/commit afetado
- Sugestão de mitigação (se houver)

### Tempo de resposta
- Confirmação de recebimento: **48 horas**
- Avaliação inicial: **5 dias úteis**
- Correção e release: conforme severidade (CRITICAL: 72h, HIGH: 7 dias, MEDIUM: 30 dias)

## Proteção de Credenciais e Tokens

### Variáveis de Ambiente Sensíveis
Todas as credenciais são gerenciadas via variáveis de ambiente **nunca commitadas**:

| Variável | Descrição | Rotação |
|----------|-----------|---------|
| `NEXTAUTH_SECRET` | Chave secreta para assinatura JWT | A cada 90 dias |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Google Workspace | Conforme política do provedor |
| `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID` | OAuth 2.0 Azure AD / Entra ID | Conforme política do provedor |
| `COMPRAS_GOV_API_URL` | Endpoint API Compras.gov.br | Não sensível (público) |
| `BRASIL_API_URL` | Endpoint BrasilAPI | Não sensível (público) |

### Boas Práticas Implementadas
1. **`.env.example`** versionado com placeholders — `.env.local`, `.env.production` **nunca** versionados
2. **NextAuth v5** com `trustHost: true` e callbacks JWT armazenando `accessToken`, `refreshToken`, `provider`, `expiresAt` apenas no token criptografado
3. **Tokens OAuth** nunca expostos no frontend — apenas no servidor (API routes, `getServerSession`)
4. **Validação Zod** em todas as rotas API — previne injection e dados malformados
5. **Sanitização de texto** (`sanitizeSpreadsheetText`) — previne injeção de fórmulas (CWE-1236) em exportações Excel
6. **Timeouts HTTP** (15s) — previne hanging requests em APIs externas
7. **Rate limiting** recomendado no proxy reverso (Vercel, Nginx, Cloudflare)

### Fluxo de Autenticação
```
Usuário → NextAuth (Google/Azure AD) → Callback → JWT criptografado (HttpOnly cookie)
                                    ↓
                            Access/Refresh tokens armazenados APENAS no JWT
                                    ↓
                            API Routes → getServerAccessToken() → Uso em APIs externas
```

## Dados Institucionais

### O que NÃO deve ser commitado/logado
- CNPJs reais de fornecedores (use mocks em testes)
- Números de processos/atas reais
- Tokens de acesso/refresh reais
- Planilhas geradas com dados reais (`.xlsx`, `.csv`)
- Logs de auditoria com dados sensíveis

### Dados em Trânsito
- HTTPS obrigatório em produção (Vercel fornece automaticamente)
- Headers de segurança: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- CSP recomendado para produção

## Dependências

- `npm audit` executado no CI
- Dependências atualizadas mensalmente via Dependabot (configure no GitHub)
- Lockfile (`package-lock.json`) versionado para builds reprodutíveis

## Checklist de Deploy Seguro

- [ ] Todas as variáveis de ambiente configuradas no Vercel (Settings → Environment Variables)
- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] Domínios de callback OAuth configurados corretamente (Google Cloud Console, Azure Portal)
- [ ] `NEXTAUTH_URL` aponta para URL de produção exata
- [ ] Variáveis dummy **não** usadas em produção
- [ ] Logs de aplicação não expõem tokens (verifique `console.log` em código)

## Contato

Para dúvidas de segurança: **security@[seu-dominio].gov.br**

Para questões gerais: abra uma [Discussion](../../discussions) ou [Issue](../../issues) (sem dados sensíveis).