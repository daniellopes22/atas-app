---
name: Bug Report
about: Reporte instabilidades ou falhas nas integrações e funcionalidades
title: '[BUG] '
labels: ['bug', 'triage']
assignees: ''
---

## Descrição do Bug
<!-- Descreva claramente o que está acontecendo -->

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Observe o erro

## Comportamento Esperado
<!-- O que deveria acontecer -->

## Comportamento Atual
<!-- O que está acontecendo de errado -->

## API/Integração Afetada
- [ ] **Compras.gov.br ARP API** (busca de itens, detalhes, adesões)
- [ ] **PNCP** (links de atas, editais, contratos)
- [ ] **Comprasnet** (links de propostas/itens)
- [ ] **BrasilAPI** (consulta CNPJ, dados de fornecedor)
- [ ] **Google Sheets API** (listagem, leitura, escrita)
- [ ] **Microsoft Graph / Excel Online** (listagem, leitura, escrita)
- [ ] **NextAuth** (login Google, Azure AD, callbacks)
- [ ] **Geração de Planilha** (ExcelJS, template, mapeamento)
- [ ] **Frontend/React** (componentes, formulários, tabelas)

## Logs / Evidências
```
Cole aqui logs relevantes, stack traces, ou respostas de API (sem tokens!)
```

## Ambiente
- OS: [ex: Windows 11, Ubuntu 22.04, macOS 14]
- Node.js: [ex: 20.18.0]
- Navegador: [ex: Chrome 131, Firefox 133]
- Branch: [ex: main, feature/xyz]

## Contexto Adicional
- Frequência: [Sempre / Intermitente / Uma vez]
- Impacto: [Bloqueia fluxo principal / Degrada UX / Cosmético]
- Workaround conhecido: [Sim / Não - descreva se houver]

## Checklist de Investigação
- [ ] Verifiquei se a API externa está operacional (status page, teste manual)
- [ ] Verifiquei se tokens OAuth estão válidos e não expirados
- [ ] Verifiquei rate limits das APIs governamentais
- [ ] Testei localmente com `npm run build && npm test`
- [ ] Confirmei que não é regressão de commit recente (`git log --oneline -10`)

---

**Importante**: Não inclua tokens reais, chaves de API, CNPJs reais de fornecedores, ou dados sensíveis institucionais. Use dados de exemplo/mockados.