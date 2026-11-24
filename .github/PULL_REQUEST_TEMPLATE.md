# Pull Request Template

## Descrição
<!-- Descreva brevemente o que este PR faz -->

## Tipo de Mudança
- [ ] Bug fix (correção que não quebra funcionalidade existente)
- [ ] Nova feature (funcionalidade que adiciona comportamento novo)
- [ ] Breaking change (correção/feature que quebra compatibilidade)
- [ ] Documentação (atualização de docs, README, comentários)
- [ ] CI/CD (pipelines, workflows, configurações)
- [ ] Refatoração (mudança de código sem alterar comportamento)
- [ ] Testes (adição ou correção de testes)

## Checklist Técnico

### Conformidade Legal
- [ ] **Lei 14.133/2021**: Cálculos de saldo de adesão/carona mantidos ou atualizados corretamente
- [ ] **PNCP/Comprasnet**: Links de navegação funcionais e formatados conforme especificação
- [ ] **BrasilAPI**: Enriquecimento de CNPJ funcionando

### Segredos e Dados Sensíveis
- [ ] **Nenhuma chave secreta** (API keys, tokens, passwords) no código
- [ ] **Nenhuma planilha local** (.xlsx, .xls, .csv) commitada
- [ ] **Nenhum arquivo .env.local** ou similar rastreado
- [ ] Variáveis de ambiente documentadas em `.env.example`

### Qualidade de Código
- [ ] `npm run lint` passa sem erros
- [ ] `npx tsc --noEmit` passa sem erros de tipagem
- [ ] `npm test` - todos os 10 testes passam
- [ ] `npm run build` - build de produção bem-sucedido

### Compatibilidade de Integração
- [ ] **Google Sheets API**: Listagem, leitura e escrita de planilhas funcionais
- [ ] **Microsoft Graph / Excel Online**: Listagem, leitura e escrita de planilhas funcionais
- [ ] **Compras.gov.br ARP API**: Busca e detalhes de itens funcionais
- [ ] Estrutura da planilha padrão mantida (4 abas: Dashboard_Chefia, Atas - Mat. Consumo, Atas - Mat. Permanente, Atas - Contratos)

### Documentação
- [ ] TSDoc/JSDoc atualizado para funções/classes públicas novas ou modificadas
- [ ] `docs/ARCHITECTURE.md` atualizado se houver mudança arquitetural
- [ ] `CHANGELOG.md` atualizado (seção Unreleased)

## Testes Realizados
<!-- Descreva como testou localmente -->
- [ ] Testes unitários (`npm test`)
- [ ] Build local (`npm run build`)
- [ ] Teste manual de fluxo completo (busca → seleção → exportação)

## Screenshots / Evidências
<!-- Adicione screenshots se aplicável (UI, planilhas geradas, logs) -->

## Checklist de Revisão
- [ ] Código segue padrões do projeto (Clean Code, TypeScript strict)
- [ ] Nomes de variáveis/funções claros e em inglês
- [ ] Comentários explicam "porquê", não "o quê"
- [ ] Sem código morto ou comentado
- [ ] Imports organizados (externos → internos → relativos)

---

**Para revisores**: Verifique especialmente a conformidade com a Lei 14.133/2021 e a integridade dos tokens OAuth nas integrações Google/Microsoft.