import { beforeAll } from '@jest/globals'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import { App } from 'supertest/types'

let app: INestApplication<App>

async function setupApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()
  return app
}
export function getHttpServer() {
  return app.getHttpServer()
}
beforeAll(async () => {
  await setupApp()
})

afterAll(async () => {
  await app.close()
})
