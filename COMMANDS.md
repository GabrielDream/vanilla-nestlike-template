LOGIN SYSTEM — Backend Node.js + Prisma + JWT Auth
Projeto backend desenvolvido com **Node.js**, **Express**, **Prisma**, **JWT** e **Jest**, integrando autenticação, middlewares, testes e estrutura de banco relacional.

# COMMANDS.md -- Operational step-by-step for cloning, reusing, configuring, testing, and running the template.

## STEPS

    #1- Inicializing the project.
    1. Clonar o template base
    	git clone https://github.com/GabrielDream/vanilla-nestlike-template

    2. Desacoplar pasta clonada:
    	git remote -v
    	git remote remove origin

    	Confirmar:
    		git remote -v (não deve aparecer nada)

    3. Instalar dependencias:
    	npm install

    4. Ajustar prisma/schema.prisma -- NUNCA RODAR MIGRATION ANTES DISSO.

    5. Configurar banco de dados:
    	No .env:
    		DATABASE_URL="postgresql://USER:SENHA@localhost:5432/NOME_DO_DB?schema=public"
    	Criar o banco no Postgres antes do migrate.

    6. Rodar migrations
    	npx prisma migrate dev --name init
    	Se necessário:
    		npx prisma generate

    7. Criar o ADM da aplicação via Seed:
    	npx prisma db seed
    		npm run db:seed - Ambos validos.

    8. Testa conexão com db:
    	npm run dev


    #2 - Testing the template.
    	npm test
    	--Se for testes especificos:
    	npm test -- _test_/../../../

    #3 - Code quality and formatting:
    	Check lint:
    		npm run lint

    	Fix lint automatically:
    		npm run lint:fix

    	Format the project:
    		npm run format

    	Check formatting only:
    		npm run format:check

    #4 - Git utility commands
    	Check compact history:
    		git log --oneline --graph --decorate

    	Check current branch:
    		git branch

    	Create a new branch:
    		git checkout -b branch-name

    	Check status:
    		git status

    	Stage all files:
    		git add .

    	Commit:
    		git commit -m "feat: your message"

    	Push current branch:
    		git push -u origin branch-name

    	Check remotes:
    		git remote -v

    #5 - Husky / Commitlint

    #6 - Tree command
    	tree -I 'node_modules|.git|dist|build' -a

    #8. Runtime smoke tests
    	Check email:
    		curl -i "http://localhost:3051/checkEmail/test@example.com"

    	Protected route:
    		curl -i http://localhost:3051/me

    #9. EXTRA: from-scratch project notes
    	Initialize a new project:
    		npm init -y

    	Install main dependencies:
    		npm install bcrypt chalk cors dotenv express jsonwebtoken @prisma/client

    	Install dev dependencies:
    		npm install --save-dev prisma nodemon jest supertest eslint prettier husky @commitlint/cli @commitlint/config-conventional

    	Initialize Prisma:
    		npx prisma init























## 🚀 Início rápido -- FLOW like starting the project from zero.

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
