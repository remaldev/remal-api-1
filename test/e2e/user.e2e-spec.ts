import * as request from 'supertest'
import { getHttpServer } from '../jest-setup'

describe('UserController (e2e)', () => {
  it('/user (GET) - fetch all users', () => {
    return request(getHttpServer())
      .get('/user')
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true)
        for (const user of response.body) {
          expect(user).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            createdAt: expect.any(String),
          })
        }
      })
  })
  it('/user (POST) - create user', async () => {
    const testUserDto = {
      name: 'Tmp User 1',
      email: 'tmp-1@email.com',
    }
    await request(getHttpServer())
      .post('/user')
      .send(testUserDto)
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          ...testUserDto,
          id: expect.any(String),
          createdAt: expect.any(String),
        })
        expect(new Date(response.body.createdAt).toString()).not.toBe(
          'Invalid Date',
        )
      })
  })
})
