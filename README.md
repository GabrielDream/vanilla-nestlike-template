# 🧠 VANILLA NEST-LIKE BACKEND TEMPLATE

Backend template in **Node.js (ESM)** with **Express 5**, **Prisma (PostgreSQL)**, **JWT Auth**, **RBAC**, **ESLint + Prettier**, **Husky + Commitlint** and **Jest + Supertest** fully integrated.

**Objective:** serve as a professional Nest-like base in pure JavaScript, ready for freelancing, technical tests and real projects.

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/GabrielDream/vanilla-nestlike-template.git
cd vanilla-nestlike-template
npm install

# 2. Environment configuration
cp .env.example .env
cp .env.test.example .env.test

# 3. Database setup
npx prisma migrate dev

# 4. Seed database
npx prisma db seed

# 5. Development
npm run dev
# Server: http://localhost:3050

# 6. Check Tree:
tree -I node_modules

🧰 Main Stack
Runtime: Node.js (ESM)

Framework: Express 5

ORM: Prisma (PostgreSQL)

Auth: JWT + RBAC

Testing: Jest + Supertest

Code Quality: ESLint + Prettier + Husky

Security: Bcrypt + CORS


📦 Main Scripts
{
  "dev": "nodemon server.js",
  "start": "node server.js",
  "test": "jest --runInBand",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier . --write",
  "db:push": "prisma db push",
  "db:seed": "node prisma/seed.js",
  "prepare": "husky"
}


🧩 Quality & Git Hooks — Husky / Commitlint

	This template includes a small quality pipeline focused on **code consistency**, **readability**, and **commit organization**.

	### EditorConfig
	**EditorConfig** helps keep basic file consistency across different editors and machines.

	It is used here to standardize things like:
	- indentation
	- line endings
	- charset
	- final newline behavior

	Its goal is to reduce editor-based inconsistencies between developers and environments.

	---

	### ESLint
	**ESLint** is responsible for analyzing code quality and enforcing coding rules.

	In this template, ESLint is used to:
	- detect unused variables
	- detect undefined variables
	- enforce style rules
	- catch risky or inconsistent patterns

	Useful commands:
		npm run lint
		npm run lint:fix
			--- IMPORTANT: current rules and current errors, lint:fix is not very useful, because most errors need human decision.

	### Prettier
	Prettier is responsible for formatting the code automatically in a consistent style.

	It helps standardize things like:

	spacing
	line breaks
	indentation
	code layout

	Useful commands:
		npm run format
		npm run format:check

	Current choice in this template:
		Prettier is manual by choice
		it is not automatically executed during commit

	Prettier config
		semi: true → adds semicolons at the end of statements
		singleQuote: true → uses single quotes instead of double quotes
		tabWidth: 2 → defines the visual width of a tab as 2 spaces
		useTabs: true → uses tabs for indentation
		trailingComma: "none" → does not add trailing commas
		printWidth: 120 → tries to keep lines within 120 characters

	### Husky / Commitlint
	Husky is used to automate Git hook actions.

	Git already supports native hooks such as:
	pre-commit
	commit-msg
	pre-push

	What Husky does is:
		manage hook files in a cleaner and versioned way
		make hook behavior easier to maintain inside the project
		automate tools during Git actions
		Current flow in this template

	When git commit is executed:
		Git triggers the commit-msg hook
		Husky manages this hook through .husky/commit-msg
		.husky/commit-msg runs:
		npx --no-install commitlint --edit "$1"
		commitlint automatically reads commitlint.config.js
		the commit message is validated using the Conventional Commits pattern
		Current choice in this template

	In this project, Husky is intentionally being used only for commit message validation.

	Automated:
		commit message check via commitlint

		Manual by choice:
			Prettier
			ESLint
			What could be automated later with Husky

	If desired, Husky could also be used to run:
		Prettier on pre-commit
		ESLint on pre-commit
		tests before push

	Current files related to this flow:
		.husky/commit-msg
		commitlint.config.js


SUMMARY:
	This template currently separates responsibilities like this:
		EditorConfig → editor/file consistency
		ESLint → code quality checks
		Prettier → code formatting
		Husky + Commitlint → commit message validation

	This structure keeps the workflow simple:
		formatting is manual
		linting is manual
		commit message validation is automatic



🗄️ Database
	Main Schema (User):

	id (UUID), name, email (unique, case-insensitive)

	passwordHash, age (optional), role (ADMIN | STAFF)

	createdAt, updatedAt

	Commands:
		npx prisma generate    # Generate client
		npx prisma db push     # Apply schema
		npm run db:seed        # Initial data


🛡️ Authentication System
	JWT Tokens
	Signing with signJwt(payload)

	Verification with verifyJwt(token)

	In-memory denylist for revocation

	Guards
	authRequired - Validates token

	allowRoles(['ADMIN']) - Basic RBAC

	isSelfOrRoles(['ADMIN']) - Self-update + admin override


🔌 API Routes
	Authentication
	Method	Route	Protection	Description
	POST	/auth/register	Public	Creates STAFF user
	POST	/auth/login	Public	Login → JWT
	POST	/auth/logout	Auth	Revokes token
	GET	/auth/me	Auth	Logged user
	Users & RBAC
	Method	Route	Protection	Description
	GET	/users	ADMIN	Lists all users
	PUT	/users/me	STAFF	Updates own profile
	DELETE	/users/me	STAFF	Self-deletion
	PUT	/admin/users/:id	ADMIN	Updates STAFF
	DELETE	/admin/users/:id	ADMIN	Deletes STAFF
	GET	/users/check-email	Public	Checks email
	🧪 Automated Tests
	Complete Coverage:

	✅ Middlewares (success/error handlers)

	✅ JWT Core (sign/verify/revocation)

	✅ Guards (authRequired, allowRoles, isSelfOrRoles)

	✅ Auth Routes (register, login, logout, me)

	✅ User Routes + RBAC (Complete CRUD)

	✅ Database Integrity


# Run tests
	npm test


## 🏗️ Project Structure
	|-- .COMMANDS
	|-- .editorconfig
	|-- .env
	|-- .env.example
	|-- .env.test
	|-- .env.test.example
	|-- .eslintignore
	|-- .gitignore
	|-- .husky
	|   |-- _
	|   |   |-- .gitignore
	|   |   |-- applypatch-msg
	|   |   |-- commit-msg
	|   |   |-- h
	|   |   |-- husky.sh
	|   |   |-- post-applypatch
	|   |   |-- post-checkout
	|   |   |-- post-commit
	|   |   |-- post-merge
	|   |   |-- post-rewrite
	|   |   |-- pre-applypatch
	|   |   |-- pre-auto-gc
	|   |   |-- pre-commit
	|   |   |-- pre-merge-commit
	|   |   |-- pre-push
	|   |   |-- pre-rebase
	|   |   `-- prepare-commit-msg
	|   |-- commit-msg
	|   `-- pre-commit
	|-- .prettierrc
	|-- README
	|-- _tests_
	|   |-- MiddlewareHelpers
	|   |   |-- errorHandler.test.js
	|   |   `-- successHandler.test.js
	|   |-- auth
	|   |   |-- authRoutes
	|   |   |   |-- auth.login.http.test.js
	|   |   |   |-- auth.logout.http.test.js
	|   |   |   |-- auth.me.http.test.js
	|   |   |   `-- auth.register.http.test.js
	|   |   `-- authenticationConfig
	|   |       |-- allowRoles.test.js
	|   |       |-- authGuards.test.js
	|   |       |-- authRequired.test.js
	|   |       |-- isSelfOrRoles.test.js
	|   |       |-- signJwt.test.js
	|   |       |-- tokenDenylist.memory.test.js
	|   |       `-- verifyJwt.test.js
	|   |-- bridgeUserRouteTest
	|   |   |-- app.bridge.userToDb.js
	|   |   `-- bridge.http.test.js
	|   |-- setup
	|   |   `-- globalSetup.cjs
	|   `-- userRoutes
	|       |-- adminDeleteAllStaffRoute.test.js
	|       |-- adminUpdateAllStaffRoute.test.js
	|       |-- checkEmailRoute.prisma.test.js
	|       |-- dbTest
	|       |   `-- user.db.test.js
	|       |-- deleteUserStaffRoute.test.js
	|       |-- listUserRoute.test.js
	|       `-- updateUserStaff.test.js
	|-- commitlint.config.js
	|-- eslint.config.js
	|-- generated
	|   `-- prisma
	|       |-- client.d.ts
	|       |-- client.js
	|       |-- default.d.ts
	|       |-- default.js
	|       |-- edge.d.ts
	|       |-- edge.js
	|       |-- index-browser.js
	|       |-- index.d.ts
	|       |-- index.js
	|       |-- package.json
	|       |-- query_engine-windows.dll.node
	|       |-- runtime
	|       |   |-- edge-esm.js
	|       |   |-- edge.js
	|       |   |-- index-browser.d.ts
	|       |   |-- index-browser.js
	|       |   |-- library.d.ts
	|       |   |-- library.js
	|       |   |-- react-native.js
	|       |   |-- wasm-compiler-edge.js
	|       |   `-- wasm-engine-edge.js
	|       |-- schema.prisma
	|       |-- wasm.d.ts
	|       `-- wasm.js
	|-- jest.config.cjs
	|-- jest.setup.env.cjs
	|-- middlewares
	|   |-- AppError.js
	|   |-- errorHandler.js
	|   |-- success.js
	|   `-- successHandler.js
	|-- package-lock.json
	|-- package.json
	|-- prisma
	|   |-- migrations
	|   |   |-- 20250905174117_init
	|   |   |   `-- migration.sql
	|   |   |-- 20250905174316_email_ci_rules
	|   |   |   `-- migration.sql
	|   |   |-- 20250905175224_email_lowercase_ci
	|   |   |   `-- migration.sql
	|   |   `-- migration_lock.toml
	|   |-- schema.prisma
	|   `-- seed.js
	|-- server.js
	|-- src
	|   |-- app.js
	|   |-- auth
	|   |   |-- guards
	|   |   |   |-- allowRoles.js
	|   |   |   |-- authRequired.js
	|   |   |   `-- isSelfOrRoles.js
	|   |   |-- routes
	|   |   |   |-- getMeRoute.js
	|   |   |   |-- loginRoute.js
	|   |   |   |-- logoutRoute.js
	|   |   |   `-- registerRoute.js
	|   |   `-- tokens
	|   |       |-- signJwt.js
	|   |       |-- tokenDenylist.memory.js
	|   |       `-- verifyJwt.js
	|   |-- users
	|   |   |-- adminRoutes
	|   |   |   |-- adminDeleteAllStaffRoute.js
	|   |   |   `-- adminUpdateAllStaffRoute.js
	|   |   |-- db
	|   |   |   `-- prisma.js
	|   |   |-- emailCheckRoute.js
	|   |   |-- listUsersRoute.js
	|   |   `-- staffRoutes
	|   |       |-- deleteUserStaff.js
	|   |       `-- updateUserStaff.js
	|   `-- utils
	|       `-- sanitize.js
	`-- terminalStylization
			|-- logger.js
			`-- spyConsole.js


📖 Project Narrative Order
1️⃣ Project Foundation
 README · COMMANDS.md · package.json · .gitignore

2️⃣ Environment and Sensitive Config
 .env · .env.test

3️⃣ Quality and Semantic Pipeline
 .editorconfig · eslint.config · .prettierrc · husky/commit-msg · commitlint

4️⃣ Terminal & Logging Helpers
 logger.js · spyConsole.js

5️⃣ Middleware Helpers
 success.js · successHandler.js · AppError.js · errorHandler.js (+ tests)

6️⃣ Database (Prisma)
 schema.prisma · migrations/ · seed.js · prisma.js

7️⃣ Global Configuration and Tests
 jest.config.cjs · jest.setup.env.cjs · globalSetup.cjs

8️⃣ Database Integrity Tests
 user.db.test.js · app.bridge.userToDb.js · bridge.http.test.js

9️⃣ JWT Core
 signJwt.js · verifyJwt.js (+ tests)

🔟 JWT Denylist (Revocation)
 tokenDenylist.memory.js (+ tests)

1️⃣1️⃣ JWT Guards
 authRequired.js · allowRoles.js · isSelfOrRoles.js (+ tests)

1️⃣2️⃣ Auth Routes
 sanitize · register · login · logout · me (+ HTTP tests)

1️⃣3️⃣ User Routes with RBAC
 list · checkEmail · meDelete · adminDeleteStaff (+ tests)

1️⃣4️⃣ Webhooks Ready
 signatureRequired.js · payloadValidator.js · idempotency.js · webhookDataBase.md

1️⃣5️⃣ Final Server
 app.js · server.js (+ listen/shutdown config)



## ⚙️ Code Quality & Engineering Standards
	This template is structured for **real backend projects**, with a focus on:
	- consistency
	- maintainability
	- scalability
	- safe development workflow

	Quality stack:
	- ESLint for code quality checks
	- Prettier for formatting consistency
	- EditorConfig for cross-editor standardization
	- Husky + Commitlint for commit message validation

	Commit standard:
	- Conventional Commits

	---

	**Author:** Jibrail Bussab
	**Contact:** https://www.linkedin.com/in/gabriel-bussab/
	**Purpose:** Production-oriented backend template for scalable applications, technical delivery, reusable architecture, and professional software workflows.
```
