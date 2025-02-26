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

  process.env.DATABASE_POSTGRE_URL =
    globalThis.postgresContainer.getConnectionUri()

  try {
    execSync('npm run prisma:migrate:deploy', { stdio: 'inherit' })
    execSync('npm run prisma:seed', { stdio: 'inherit' })
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
  process.env.DATABASE_MONGO_URL =
    globalThis.mongoContainer.getConnectionString()
}

async function globalSetup() {
  dotenv.config({ path: '.env.test' })

  await createPostgresContainer()
  await createMongoContainer()
}

export default globalSetup
