import * as request from 'supertest'
import { getHttpServer } from '../jest-setup'

describe('UserController (e2e)', () => {
  let userId: string

  beforeAll(async () => {
    const testUser = {
      name: 'Test User',
      email: 'test-user@email.com',
    }
    const response = await request(getHttpServer()).post('/user').send(testUser)
    userId = response.body.id
  })

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
  // add 409 test case when user exists already
  it('/user (POST) - create user - 409', async () => {
    
    const testUserDto = {
      name: 'Tmp User 2',
      email: 'tmp-2@email.com',
    }
    await request(getHttpServer()).post('/user').send(testUserDto).expect(201)

    await request(getHttpServer()).post('/user').send(testUserDto).expect(409)
  })

  it('/user/:id (GET) - fetch user by id', async () => {
    const response = await request(getHttpServer())
      .get(`/user/${userId}`)
      .expect(200)

    expect(response.body).toMatchObject({
      id: userId,
      name: expect.any(String),
      email: expect.any(String),
      createdAt: expect.any(String),
    })
  })

  it('/user/:id (GET) - user not found - 404', () => {
    return request(getHttpServer()).get('/user/nonexistent-id').expect(404)
  })

  it('/user/email/:email (GET) - fetch user by email', async () => {
    const email = 'tmp-1@email.com'
    const response = await request(getHttpServer())
      .get(`/user/email/${email}`)
      .expect(200)

    expect(response.body).toMatchObject({
      email,
      name: expect.any(String),
      id: expect.any(String),
      createdAt: expect.any(String),
    })
  })

  it('/user/email/:email (GET) - user not found - 404', () => {
    return request(getHttpServer())
      .get('/user/email/nonexistent@email.com')
      .expect(404)
  })

  it('/user/:id (PATCH) - update user', async () => {
    const updateData = {
      name: 'Updated Name',
    }

    const response = await request(getHttpServer())
      .patch(`/user/${userId}`)
      .send(updateData)
      .expect(200)

    expect(response.body).toMatchObject({
      id: userId,
      name: updateData.name,
      email: expect.any(String),
      createdAt: expect.any(String),
    })
  })

  it('/user/:id (PATCH) - user not found - 404', () => {
    return request(getHttpServer())
      .patch('/user/nonexistent-id')
      .send({ name: 'New Name' })
      .expect(404)
  })

  it('/user/count (GET) - count users', async () => {
    const response = await request(getHttpServer())
      .get('/user/count')
      .expect(200)

    expect(response.body).toEqual({
      count: expect.any(Number),
    })
  })

  it('/user/:id (DELETE) - delete user', async () => {
    await request(getHttpServer()).delete(`/user/${userId}`).expect(200)

    // Verify user is deleted
    await request(getHttpServer()).get(`/user/${userId}`).expect(404)
  })

  it('/user/:id (DELETE) - user not found - 404', () => {
    return request(getHttpServer()).delete('/user/nonexistent-id').expect(404)
  })
})
