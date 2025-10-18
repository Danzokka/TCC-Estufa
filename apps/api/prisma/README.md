# 🌱 Database Seed - Guia Rápido

## 📋 O que será criado?

### 👤 Usuário

- **Email**: `admin@greenhouse.local`
- **Username**: `admin`
- **Senha**: `Test@123`

### 🌿 5 Plantas

- Tomate
- Alface
- Manjericão
- Morango
- Pimentão

### 🏠 3 Estufas

- Estufa Principal (online)
- Estufa Experimental (online)
- Estufa Hidropônica (offline)

### 📊 Dados Históricos

- 96 leituras de sensores de plantas (48h)
- 192 leituras de sensores de estufas (48h)
- 4 operações de irrigação
- 3 posts de blog com comentários e likes

---

## 🚀 Como Executar

```bash
cd apps/api
npm run prisma:seed
```

Ou use o Prisma diretamente:

```bash
npx prisma db seed
```

---

## 📊 Resultado Final

```
✅ 1 Usuário (admin@greenhouse.local)
✅ 5 Plantas
✅ 5 Associações usuário-planta
✅ 3 Estufas configuradas
✅ 3 Dispositivos ESP32
✅ 288 Leituras de sensores
✅ 4 Operações de irrigação
✅ 3 Posts + 3 Comentários + 3 Likes
```

---

## 🔍 Visualizar Dados

### Prisma Studio

```bash
npx prisma studio
```

Acesse: http://localhost:5555

### Login no Sistema

- Email: `admin@greenhouse.local`
- Senha: `Test@123`

---

## ⚠️ Importante

⚠️ O seed **LIMPA todos os dados existentes** antes de criar os novos.

Se quiser manter dados, comente as linhas de `deleteMany` no arquivo `seed.ts`.

---

## 🔄 Reset Completo

Para limpar e recriar o banco:

```bash
npx prisma migrate reset
```

Isso irá:

1. Deletar o banco de dados
2. Recriar o banco
3. Executar migrations
4. Executar o seed automaticamente

---

**Pronto para usar! 🎉**
