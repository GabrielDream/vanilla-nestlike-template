LOGIN SYSTEM — Backend Node.js + Prisma + JWT Auth
Projeto backend desenvolvido com **Node.js**, **Express**, **Prisma**, **JWT** e **Jest**, integrando autenticação, middlewares, testes e estrutura de banco relacional.

## 🚀 Início rápido

#npm init -y: para iniciar o projeto

#Para descobrir os commits:
#fee4bc2 (HEAD -> master) db structure done
#fb66780 skeleton done

Dependências principais:
npm install bcrypt chalk cors dotenv express

Dependências de desenvolvimento:
npm install --save-dev @types/express nodemon jest supertest

npm install eslint --save-dev

# Para verificar erros

npm run lint

# Para corrigir automaticamente

npm run lint:fix

#db:
npm i @prisma/client
npm i -D prisma

#start db:
npx prisma init

#Roda a migração:
npx prisma migrate dev --name init

# git log --oneline --graph --decorate

- f1ae606 (HEAD -> master) DB WITH MIDDLEWARE TESTS DONE NOW
- d0488bb db tests with helpers done
- 6e7128a helpers middlewares and its tests done
- fee4bc2 db structure done
- fb66780 skeleton done

# 1️⃣ Instala o commitlint

npm i -D @commitlint/config-conventional @commitlint/cli
bash
Copiar código

# 2️⃣ Cria o arquivo de configuração

echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
bash
Copiar código

# 3️⃣ Adiciona o hook commit-msg no Husky

npx husky add .husky/commit-msg 'npx --no-install commitlint --edit $1'

## COMANDO TREE:

tree -I 'node_modules|.git|dist|build' -a

# Possiveis problemas do git:

🎯 O .LF ESTÁ CERTO!
NO VSCODE:
text
UTF-8 com .LF = ✅ **CORRETO para desenvolvimento**
UTF-8 com .CRLF = ❌ Problema do Windows
💡 SOBRE O git config core.autocrlf true:
ONDE EXECUTAR:
bash

# ✅ NO GIT BASH/MSYS (seu terminal atual):

git config core.autocrlf true
O QUE ELE FAZ:
bash

# Windows → Linux: CRLF → LF (ao commitar)

# Linux → Windows: LF → CRLF (ao fazer checkout)

##Testing in runtime:
curl -i -X POST http://localhost:3000/users -d "{}"
