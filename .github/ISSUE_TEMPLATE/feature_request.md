---
name: Feature Request
about: Solicite novas colunas, filtros, integrações ou melhorias
title: '[FEATURE] '
labels: ['enhancement', 'triage']
assignees: ''
---

## Resumo da Feature
<!-- Descreva em uma frase o que deseja adicionar -->

## Problema / Oportunidade
<!-- Qual dor resolve? Qual valor agrega? -->
- Contexto: [ex: usuários precisam filtrar por UASG, ou exportar coluna X]
- Impacto estimado: [Alto / Médio / Baixo]

## Solução Proposta
<!-- Descreva a implementação ideal -->

### Novas Colunas na Planilha (se aplicável)
| Aba | Nova Coluna | Fonte de Dados | Tipo | Obrigatória? |
|-----|-------------|----------------|------|--------------|
| Atas - Mat. Consumo | Ex: `valorUnitario` | `ARPItem.valorUnitario` | Number | Sim |

### Novos Filtros de Busca (se aplicável)
| Filtro | Campo API | Tipo | Descrição |
|--------|-----------|------|-----------|
| Ex: `uasg` | `ARPItem.uasg` | String | Filtrar por UASG específica |

### Novas Integrações / APIs (se aplicável)
- [ ] Nova API governamental: [nome e documentação]
- [ ] Novo provedor OAuth: [Google / Azure AD / Outro]
- [ ] Novo formato de exportação: [CSV / PDF / Outro]

## Alternativas Consideradas
<!-- Outras abordagens avaliadas e por que não foram escolhidas -->

## Critérios de Aceitação
- [ ] Critério 1: [ex: coluna aparece na aba correta com header padronizado]
- [ ] Critério 2: [ex: filtro funciona na busca e na exportação]
- [ ] Critério 3: [ex: testes unitários cobrem nova lógica (mínimo 1 teste)]
- [ ] Critério 4: [ex: documentação TSDoc atualizada]
- [ ] Critério 5: [ex: compatível com Google Sheets E Excel Online]

## Impacto Técnico
- **Arquivos a modificar**: [liste caminhos relativos: `src/lib/sheetMapping.ts`, `src/types/index.ts`, etc.]
- **Migração de dados**: [Sim / Não - se sim, descreva]
- **Breaking change**: [Sim / Não - se sim, justifique e documente no CHANGELOG]
- **Dependências novas**: [Sim / Não - se sim, liste e justifique]

## Checklist de Conformidade
- [ ] **Lei 14.133/2021**: Nova feature não viola regras de carona/adesão
- [ ] **LGPD**: Nenhum dado pessoal sensível exposto sem necessidade
- [ ] **Segurança**: Tokens OAuth não expostos, validação Zod mantida
- [ ] **Testes**: `npm test` passa (adicione testes para nova lógica)
- [ ] **Build**: `npm run build` passa
- [ ] **Docs**: TSDoc + `docs/ARCHITECTURE.md` + `CHANGELOG.md` atualizados

## Recursos / Referências
- Documentação API: [links]
- Normativos legais: [links para Lei 14.133, PNCP, etc.]
- Issues relacionadas: #[número]

---

**Dica**: Para novas colunas, veja `src/lib/sheetMapping.ts` (mappers) e `src/types/index.ts` (SheetRow*). Para novos filtros, veja `src/lib/validation.ts` (searchSchema) e `src/app/api/atas/buscar/route.ts`.