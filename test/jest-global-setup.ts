import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Wait } from 'testcontainers'
import { execSync } from 'node:child_process'

async function globalSetup() {
  // Start PostgreSQL container
  globalThis.postgresContainer = await new PostgreSqlContainer(
    'postgres:16.2-alpine',
  )
    .withWaitStrategy(Wait.forListeningPorts())
    .start()

  process.env.DATABASE_POSTGRE_URL =
    globalThis.postgresContainer.getConnectionUri()

  // Run Prisma migrations
  try {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_POSTGRE_URL: process.env.DATABASE_POSTGRE_URL,
      },
      stdio: 'inherit',
    })
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export default globalSetup
