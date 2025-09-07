# Configuração da ReCAPTZ

Este projeto utiliza a biblioteca [ReCAPTZ](https://recaptz.vercel.app/) para implementar captcha moderno e seguro.

## Características Implementadas

### 🔒 Segurança

- **Validação server-side automática**: A ReCAPTZ inclui validação server-side integrada
- **Rate limiting**: Proteção contra ataques de força bruta
- **Validação de tentativas**: Sistema de tentativas progressivas com bloqueio

### ♿ Acessibilidade

- **Suporte a leitores de tela**: Compatível com tecnologias assistivas
- **Navegação por teclado**: Suporte completo para navegação via teclado
- **Feedback de áudio**: Opção de ouvir o código (pressione Espaço)

### 🎨 Experiência do Usuário

- **Animações de sucesso**: Feedback visual quando o captcha é resolvido
- **Efeitos de confete**: Celebração visual após validação bem-sucedida
- **Design responsivo**: Funciona perfeitamente em dispositivos móveis
- **Tema personalizado**: Integrado com o design system do projeto

## Configuração Atual

```tsx
<Captcha
  type="numbers" // Apenas números (mais fácil para usuários)
  length={4} // 4 dígitos
  enableAudio={true} // Suporte a áudio
  showSuccessAnimation={true} // Animação de sucesso
  showConfetti={true} // Efeito de confete
  refreshable={true} // Botão para atualizar
  maxAttempts={3} // Máximo 3 tentativas
  validationRules={{
    required: true,
    allowedCharacters: "0123456789",
  }}
/>
```

## Fluxo de Segurança

1. **Primeiras tentativas**: Login normal sem captcha
2. **Após 3 tentativas**: Captcha é exigido
3. **Após 5 tentativas**: Bloqueio por 5 minutos
4. **Validação**: ReCAPTZ valida server-side automaticamente

## Personalização

### Estilos Customizados

```tsx
customStyles={{
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}}
```

### Internacionalização

```tsx
i18n={{
  securityCheck: "Verificação de Segurança",
  inputPlaceholder: "Digite o código",
  verifyButton: "Verificar",
  refreshButton: "Atualizar",
  audioButton: "Ouvir código",
  successMessage: "Verificação bem-sucedida!",
  errorMessage: "Código incorreto. Tente novamente.",
  maxAttemptsReached: "Muitas tentativas. Tente novamente mais tarde.",
}}
```

## Tipos de Captcha Disponíveis

### 1. Números (Atual)

```tsx
type="numbers"
length={4}
```

### 2. Letras

```tsx
type="letters"
length={6}
```

### 3. Misto

```tsx
type="mixed"
length={8}
```

### 4. Slider Puzzle

```tsx
type="slider"
sliderConfig={{
  width: 320,
  height: 180,
  pieceSize: 42,
  tolerance: 12,
  enableShadow: true,
}}
```

## Comandos de Teclado

- **Espaço**: Ouvir o código em áudio
- **Enter**: Validar o código
- **Esc**: Limpar o campo de entrada

## Benefícios da ReCAPTZ

1. **Segurança Robusta**: Validação server-side automática
2. **Acessibilidade**: Suporte completo para tecnologias assistivas
3. **Performance**: Otimizado com bundle size mínimo
4. **TypeScript**: Suporte completo com tipagem
5. **Customização**: Altamente personalizável
6. **Manutenção**: Biblioteca ativamente mantida

## Troubleshooting

### Problemas Comuns

1. **Captcha não aparece**: Verifique se `isCaptchaRequired` está true
2. **Validação falha**: A ReCAPTZ faz validação automática server-side
3. **Estilos não aplicados**: Verifique se `customStyles` está configurado corretamente

### Logs de Debug

Para debug, verifique o console do navegador para mensagens da ReCAPTZ.

## Recursos Adicionais

- [Documentação Oficial](https://recaptz.vercel.app/)
- [NPM Package](https://www.npmjs.com/package/recaptz)
- [GitHub Repository](https://github.com/ShejanMahamud/recaptz)
- [Playground Interativo](https://recaptz.vercel.app/)
