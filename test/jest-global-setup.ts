import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { MongoDBContainer } from '@testcontainers/mongodb'
import { Wait } from 'testcontainers'
import { execSync } from 'node:child_process'
import * as dotenv from 'dotenv'

async function createPostgresContainer() {
  globalThis.postgresContainer = await new PostgreSqlContainer(
    'postgres:16.2-alpine',
  )
    .withWaitStrategy(Wait.forListeningPorts())
    .start()

  process.env.DB_POSTGRE_URI = globalThis.postgresContainer.getConnectionUri()
  try {
    execSync('npm run prisma:migrate:reset')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

async function createMongoContainer() {
  globalThis.mongoContainer = await new MongoDBContainer('mongo:7.0.8')
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forListeningPorts())
    .start()
  process.env.DB_MONGO_URI = globalThis.mongoContainer.getConnectionString()
}

async function globalSetup() {
  dotenv.config({ path: '.env' })
  if (process.env.CI !== 'true') {
    await createPostgresContainer()
    await createMongoContainer()
  }
}

export default globalSetup
