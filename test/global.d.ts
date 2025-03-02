import type { INestApplication } from '@nestjs/common'
import type { App } from 'supertest/types'

declare global {
  var app: INestApplication<App>
  var postgresContainer: import('@testcontainers/postgresql').StartedPostgreSqlContainer
  var mongoContainer: import('@testcontainers/mongodb').StartedMongoDBContainer
}
