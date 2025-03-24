<p align="center">
  <a href="/" target="blank"><img src="https://avatars.githubusercontent.com/u/199998394" width="150" alt="Remal's Logo" /></a>
</p>

# NestJs Backend Starter - [RemalDev](./README.md)

Up-to-date NestJS-based API boilerplate with Prisma ORM, authentication, and testing setup.

## Table of Contents

- [Setup](#setup)
- [Database Commands](#database-commands)
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [Git Workflow Commands](#git-workflow-commands)
- [Project Structure](#project-structure)

## Setup

**Prerequisites:** Volta, Node.js (`v23.6.0`), npm (_`v11.1.0`_), PostgreSQL

1. **Create a new repository from template:**

   Go to the [backend-template repository](https://github.com/remaldev/backend-template) and click "Use this template" to create your own repository based on this template.

   Then clone your new repository:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git && cd your-repo-name && npm install
   ```

2. **Environment setup:** Create `.env` file with:

   ```bash
   # fallback values
   DB_POSTGRE_URI="postgresql://iam_username:iam_psswd@localhost:3033/remalDB?schema=public"
   DB_MONGO_URI="mongodb://iam_username:iam_psswd@localhost:3044/remalDB"

   docker_DB_POSTGRE_URI="postgresql://iam_username:iam_psswd@remalDB_postgres:5432/remalDB?schema=public"
   docker_DB_MONGO_URI="mongodb://iam_username:iam_psswd@remalDB_mongo:27017/remalDB"

   dev_DB_POSTGRE_URI="postgresql://iam_username:iam_psswd@localhost:3033/remalDB?schema=public"
   dev_DB_MONGO_URI="mongodb://iam_username:iam_psswd@localhost:3044/remalDB"

   prod_DB_POSTGRE_URI=
   prod_DB_MONGO_URI=

   NODE_ENV=dev  # dev | prod | docker

   PORT=3000
   LOG_LEVEL=log
   HOST=127.0.0.1
   ```

3. **Setup database:**

   ```bash
   npm run prisma:migrate:deploy
   ```

4. **Start development server:**
   ```bash
   npm run start:dev   # API runs at http://localhost:3000
   ```

## Database Commands

| Command                         | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `npm run prisma:generate`       | Generate Prisma client after schema changes                              |
| `npm run prisma:migrate`        | Create a new migration when schema.prisma is modified                    |
| `npm run prisma:migrate:deploy` | Apply pending migrations (run after pulling new changes with migrations) |
| `npm run prisma:migrate:reset`  | Reset database (⚠️ WARNING: deletes all data)                            |
| `npm run prisma:seed`           | Populate database with initial data                                      |
| `npm run prisma:studio`         | Open Prisma Studio to explore database                                   |

## Development Commands

| Command                       | Description                              |
| ----------------------------- | ---------------------------------------- |
| `npm run start:dev`           | Start development server with hot-reload |
| `npm run start:debug`         | Start server in debug mode               |
| `npm run lint`                | Run ESLint to check code quality         |
| `npm run format`              | Format code with Prettier                |
| `npm run deps:outdated:check` | Check for outdated dependencies          |
| `bash update-packages.sh`     | Update dependencies safely + Auto-commit |
| `npm run build`               | Build application for production         |

## Testing Commands

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `npm test`           | Run all unit tests            |
| `npm run test:watch` | Run tests in watch mode       |
| `npm run test:cov`   | Generate test coverage report |
| `npm run test:e2e`   | Run end-to-end tests          |
| `npm run test:debug` | Debug tests                   |

## Git Workflow Commands

### Basic Workflow

| Command                                                  | Description                                   |
| -------------------------------------------------------- | --------------------------------------------- |
| `git checkout -b feature/R-123`                          | Create new feature branch (use ticket number) |
| `git add file1 file2`                                    | Stage target changes                          |
| `git commit -m "[FEAT](user) Add createUser controller"` | Commit with conventional format               |
| `git push origin feature/R-123`                          | Push changes to remote                        |

### Modular Commit Workflow

| Command                                                                                                                          | Description                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `git checkout -b feature/R-123`                                                                                                  | Create new feature branch (use ticket number) |
| `git add src/module-name/dto/*.dto.ts && git commit -m "[FEAT](module-name) Add data transfer objects"`                          | Commit DTOs                                   |
| `git add src/module-name/module-name.service.ts && git commit -m "[FEAT](module-name) Implement core service logic"`             | Commit service changes                        |
| `git add src/module-name/module-name.controller.ts && git commit -m "[FEAT](module-name) Add controller endpoints"`              | Commit controller changes                     |
| `git add src/module-name/*.spec.ts && git commit -m "[TEST](module-name) Add unit tests"`                                        | Commit unit tests                             |
| `git add test/module-name.e2e-spec.ts && git commit -m "[TEST](module-name) Add e2e tests"`                                      | Commit e2e tests                              |
| `git add src/module-name/module-name.controller.ts && git commit -m "[DOC](module-name) Add swagger documentation to endpoints"` | Commit documentation updates to controller    |
| `git add bruno/remal-api-1/user/create-module-name.bru && git commit -m [DOC](module-name) Add bruno collection of endpoints`    | Commit bruno collections used to test         |
| `git add src/app.module.ts && git commit -m "[FEAT](app) Register module-name module"`                                           | Commit module registration                    |
| `git push origin feature/R-123`                                                                                                  | Push all commits to remote                    |

### Commit Types

Valid commit prefixes: `[BUILD]`, `[DOC]`, `[FAKE]`, `[FEAT]`, `[FIX]`, `[REFACT]`, `[TEST]`, `[UPGRADE]`

### Advanced Git Commands

| Command                     | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `git pull origin main`      | Pull latest changes from main branch               |
| `git fetch --all`           | Fetch all branches from remote                     |
| `git stash`                 | Temporarily save changes to work on something else |
| `git stash list`            | List all stashed changes                           |
| `git stash apply stash@{n}` | Apply stash number n without removing it           |
| `git stash pop stash@{n}`   | Apply and remove stash number n                    |
| `git reset --soft HEAD~1`   | Undo last commit, keep changes staged              |
| `git reset --hard HEAD~1`   | ⚠️ Discard last commit and all changes             |
| `git checkout -`            | Switch to previous branch                          |

### Handling Feature Branch Updates

When main branch has been updated and you need to update your feature branch:

```bash
# If you haven't pushed your changes yet:
git checkout main
git pull
git checkout feature/R-123
git rebase main

# If you've already pushed your feature branch:
git checkout main
git pull
git checkout feature/R-123
git rebase main
git push origin feature/R-123 --force-with-lease  # ⚠️ Use with caution
```

## Project Structure

```
prisma/
├── migrations/      # database migrations
├── prisma.seed.ts   # data seeding
└── schema.prisma    # database schema
src/
├── common/          # Shared utilities, filters, exceptions
├── config/          # Application configuration
├── prisma/          # Database module, service
├── user/            # User module (auth, registration)
│   ├── dto/         # Data transfer objects
│   ├── utils/       # Helper functions (mappers,...)
│   └── ...          # Controllers, services, etc.
├── app.bootstrap.ts # Application bootstrap configuration
└── main.ts          # Application entry point
test/
├── e2e/
├── helpers/
├── migrations/      # database migrations
├── prisma.seed.ts   # data seeding
└── schema.prisma    # database schema
```

## CI/CD Pipeline

Includes GitHub Actions workflows for:

- Code quality checks (linting, formatting)
- Test coverage reporting (minimum 85% threshold)
- Dependency analysis
