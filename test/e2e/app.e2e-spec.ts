import * as request from 'supertest'
import { getHttpServer } from '../jest-setup'

describe('AppController (e2e)', () => {
  it('/ (GET) - HealthCheck', async () => {
    const res = await request(getHttpServer()).get('/').expect(200)
    expect(res.body).toEqual({
      success: true,
      data: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
    })
  })
})
