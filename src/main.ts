import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      // NOTE: if forbidNonWhitelisted is set to true, then the whitelist is useless
      whitelist: true, // Automatically strips properties that do not have any decorators
      forbidNonWhitelisted: true, // Rejects request if there are any properties not part of the DTO
      transform: true, // Automatically transforms payloads to DTOs
    }),
  )
  await app.listen(process.env.PORT ?? 3000)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
