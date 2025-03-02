import * as request from 'supertest'
import { getHttpServer } from '../jest-setup'

describe('AppController (e2e)', () => {
  it('/ (GET) - HealthCheck', () => {
    return request(getHttpServer())
      .get('/')
      .expect(200)
      .expect('بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ')
  })
})
