---
applyTo: "**"
---

# Code Review Guidelines

## Review Checklist

### Security

- Verificar inputs são validados e sanitizados
- Confirmar que dados sensíveis não estão expostos
- Verificar autenticação e autorização apropriadas
- Checar se há vulnerabilidades de injeção (SQL, XSS)

### Performance

- Identificar possíveis vazamentos de memória
- Verificar consultas N+1 no banco de dados
- Checar se há lazy loading apropriado
- Analisar bundle size impact no frontend

### Code Quality

- Verificar se segue padrões estabelecidos do projeto
- Confirmar naming conventions consistentes
- Checar se há duplicação de código
- Verificar se há comentários adequados para lógica complexa

### Testing

- Confirmar que novos features têm testes
- Verificar se testes cobrem edge cases
- Checar se testes existentes ainda passam
- Verificar qualidade dos mocks e fixtures

### TypeScript

- Verificar tipagem correta em todo código novo
- Checar se não há uso de 'any' desnecessário
- Confirmar interfaces estão bem definidas
- Verificar se generics são usados apropriadamente

### Architecture

- Verificar se mudanças seguem arquitetura estabelecida
- Checar se há violação de separation of concerns
- Verificar se dependências são apropriadas
- Confirmar que padrões de design estão sendo seguidos

## Review Comments Format

- Use linguagem construtiva e específica
- Forneça sugestões de melhoria
- Explique o 'porquê' por trás dos comentários
- Destaque pontos positivos também
