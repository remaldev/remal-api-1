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

2. **Environment setup:**

   Copy the `.env.example` file to create your own `.env` file:

   ```bash
   cp .env.example .env
   ```

   Then update the values in your `.env` file as needed:

   ```bash
   # Database connection strings
   DB_POSTGRE_URI="postgresql://iam_username:iam_psswd@localhost:3033/remal_db?schema=public"
   DB_MONGO_URI="mongodb://iam_username:iam_psswd@localhost:3044/remal_db"

   # Environment name (local, dev, test, prod)
   NODE_ENV=local

   # Application settings
   PORT=3000
   LOG_LEVEL=log
   HOST=127.0.0.1
   ```

   For different environments, you can create specific env files:

   - `.env.local` - Local development
   - `.env.test` - Testing environment (used by Jest)
   - `.env.dev` - Development server
   - `.env.prod` - Production environment

   Environment variables are loaded based on NODE_ENV value, with values from the specific environment file taking precedence over the base `.env` file.

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
.
├── .github/                     # GitHub Actions workflows and scripts
│   ├── workflows/               # CI/CD pipeline definitions
│   └── scripts/                 # Helper scripts for CI/CD
├── bruno/                       # Bruno API collections for testing
│   └── remal-api-1/             # Organized by modules/features
├── prisma/                      # Database configuration
│   ├── migrations/              # Database migrations
│   ├── schema.prisma            # Database schema
│   └── prisma.seed.ts           # Seed data
├── src/
│   ├── common/                  # Shared utilities, filters, exceptions
│   │   ├── dto/                 # Common DTOs
│   │   ├── exceptions/          # Custom exceptions
│   │   └── filters/             # Exception filters
│   ├── config/                  # Application configuration
│   │   └── configuration.ts     # Environment configuration
│   ├── prisma/                  # Database module, service
│   ├── user/                    # User module (auth, registration)
│   │   ├── dto/                 # Data transfer objects
│   │   ├── entities/            # Domain entities
│   │   ├── utils/               # Helper functions
│   │   ├── user.controller.ts   # REST endpoints
│   │   ├── user.module.ts       # Module definition
│   │   ├── user.service.ts      # Business logic
│   │   └── *.spec.ts            # Unit tests
│   ├── app.bootstrap.ts         # Application bootstrap configuration
│   ├── app.controller.ts        # Root controller (health check)
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application entry point
├── test/
│   ├── e2e/                     # End-to-end tests
│   ├── helpers/                 # Test utilities
│   ├── global.d.ts              # TypeScript declarations for tests
│   ├── jest-global-setup.ts     # Jest setup
│   ├── jest-global-teardown.ts  # Jest teardown
│   ├── jest-setup.ts            # Test application setup
│   └── jest.config.ts           # Jest configuration
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment variables (gitignored)
├── .env.test                    # Test environment variables
├── .env.dev                     # Development environment variables (optional)
├── .env.prod                    # Production environment variables (optional)
└── package.json                 # Project metadata and scripts
```

## CI/CD Pipeline

Includes GitHub Actions workflows for:

- Code quality checks (linting, formatting)
- Test coverage reporting (minimum 85% threshold)
- Dependency analysis

## Environment Configuration

The project uses a hierarchical environment loading system that allows for environment-specific configurations:

### Environment Files Structure

- `.env` - Base environment file with common settings
- `.env.local` - Local development overrides (gitignored)
- `.env.test` - Testing environment settings
- `.env.dev` - Development server settings
- `.env.prod` - Production environment settings

### Environment Loading Logic

1. The base `.env` file is always loaded first
2. Then, based on the `NODE_ENV` value, a specific environment file (`.env.local`, `.env.test`, etc.) is loaded
3. Values from the environment-specific file override those from the base `.env` file

### Usage in Code

Environment variables are loaded in `main.ts` and are available throughout the application via NestJS's ConfigService:

```typescript
// Example of using environment variables in a service
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const port = this.configService.get<number>("PORT");
    const dbUri = this.configService.get<string>("DB_POSTGRE_URI");
    // ...
  }
}
```

## Developer Tools

The project includes several tools to improve development workflow and code quality:

### Code Quality Tools

| Tool        | Purpose                                       | Configuration                  |
| ----------- | --------------------------------------------- | ------------------------------ |
| Biome       | Modern formatter and linter                   | `.biome.json`                  |
| Commitlint  | Enforce consistent commit message format      | `commitlint.config.ts`         |
| Husky       | Git hooks for pre-commit validation           | `.husky/`                      |
| Lint-staged | Run linters on staged files before committing | `package.json` > "lint-staged" |

### Testing Tools

| Tool           | Purpose                                | Configuration                  |
| -------------- | -------------------------------------- | ------------------------------ |
| Jest           | Testing framework                      | `test/jest.config.ts`          |
| Supertest      | HTTP assertions for API testing        | Used in e2e tests              |
| Testcontainers | Disposable Docker containers for tests | Used in `jest-global-setup.ts` |
| Bruno          | API client for endpoint testing        | `bruno/` directory             |

### Package Management

| Command                       | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `npm run deps:check`          | Check for unused dependencies                      |
| `npm run deps:outdated:check` | Check for outdated packages                        |
| `npm run deps:update:all`     | Update all dependencies at once                    |
| `bash update-packages.sh`     | Safely update dependencies one by one with commits |

## Security Best Practices

The project follows these security best practices:

### API Protection

- Uses class-validator for input validation
- Implements rate limiting for sensitive endpoints
- All API endpoints are documented and versioned
- Properly handles and sanitizes error messages

### Data Protection

- Environment variables for sensitive information
- Different environment configurations for development and production
- Using parameterized queries with Prisma ORM to prevent SQL injection
- Strong password hashing with bcrypt

### CI/CD Security

- Automated dependency scanning in CI pipeline
- Regular updates of all dependencies
- Minimum test coverage requirements
- Secrets stored in GitHub Actions secrets, not in code

### Development Guidelines

- Never commit `.env` files with real credentials
- Use `.env.example` as a template with placeholder values
- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies updated using the provided scripts
