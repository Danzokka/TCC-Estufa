---
applyTo: "apps/api/**/*.{ts,js}"
---

# Backend Development Guidelines - NestJS

## Tech Stack

- NestJS com TypeScript
- Prisma ORM com PostgreSQL
- JWT para autenticação
- Class-validator para validação
- Jest para testes

## Arquitetura e Padrões

### Estrutura de Módulos

- Organize por domínio/feature (users, projects, posts, etc.)
- Cada módulo deve ter: controller, service, module, DTOs
### Controllers

- Use decorators apropriados (@Get, @Post, @Put, @Delete)
- Implemente validação com DTOs
- Use guards para autenticação e autorização
- Mantenha controllers leves, lógica no service

### Services

- Implemente toda lógica de negócio nos services
- Use dependency injection
- Faça tratamento de erros adequado
- Use transações para operações complexas

### DTOs (Data Transfer Objects)

- Use class-validator para validação
- Crie DTOs separados para Create e Update
- Use Pick, Omit para reutilizar types
- Implemente transformação de dados quando necessário

### Prisma Integration

- Use PrismaService injetado nos services
- Implemente relacionamentos corretamente
- Use transactions para operações que afetam múltiplas tabelas
- Faça seed do banco de dados para desenvolvimento

### Security

- Use AuthGuard para rotas protegidas
- Implemente AdminGuard para rotas administrativas
- Use CORS apropriadamente