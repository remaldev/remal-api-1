import * as request from 'supertest'
import { getHttpServer } from '../jest-setup'
import { UserResponseDto } from 'src/user/dto/user-response.dto'
import { isValidDate } from '../helpers/test-matchers'

describe('UserController (e2e)', () => {
  it('/user (POST) - Create User -201- should create user succefully', () => {
    const testUserDto = {
      email: 'test@test.com',
      password: 'Password123!',
    }
    return request(getHttpServer())
      .post('/user')
      .send(testUserDto)
      .expect(201)
      .expect(({ body }: { body: UserResponseDto }) =>
        expect(body).toMatchObject({
          email: testUserDto.email,
          id: expect.any(String),
          createdAt: isValidDate,
          updatedAt: isValidDate,
        }),
      )
  })
  it('/user (POST) - Create User -409- should throw error on duplicate records', async () => {
    const testUserDto = {
      email: 'test-2@test.com',
      password: 'Password123!',
    }
    await request(getHttpServer())
      .post('/user')
      .send(testUserDto)
      .expect(201)
      .expect(({ body }: { body: UserResponseDto }) =>
        expect(body).toMatchObject({
          email: testUserDto.email,
          id: expect.any(String),
          createdAt: isValidDate,
          updatedAt: isValidDate,
        }),
      )
    return request(getHttpServer()).post('/user').send(testUserDto).expect(409)
  })
})
