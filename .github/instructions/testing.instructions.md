---
applyTo: "**/*.test.{ts,tsx,js,jsx},**/*.spec.{ts,tsx,js,jsx}"
---

# Test Generation Guidelines

## Testing Strategy

### Frontend (Next.js/React)

- Use Jest + React Testing Library para testes unitários
- Use Playwright para testes E2E
- Teste comportamentos, não implementação
- Foque em user interactions e acessibilidade

### Backend (NestJS)

- Use Jest para testes unitários
- Use Supertest para testes de integração
- Teste todos os endpoints da API
- Mock dependências externas (banco, APIs)

## Test Patterns

### React Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('should submit form with valid data', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### NestJS Controller Tests

```typescript
describe("ProjectController", () => {
  let controller: ProjectController;
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);
  });

  it("should create a project", async () => {
    const createDto = { name: "Test Project" };
    const mockProject = { id: "1", ...createDto };

    jest.spyOn(service, "create").mockResolvedValue(mockProject);

    const result = await controller.create(createDto, mockUser);

    expect(result).toEqual(mockProject);
    expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
  });
});
```

## Test Requirements

- Sempre inclua testes para casos de erro
- Use mocks para isolar unidades de código
- Teste edge cases e validações
- Mantenha cobertura de testes acima de 80%
- Use describe blocks para organizar testes por funcionalidade
