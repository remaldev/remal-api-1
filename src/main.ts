import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { LogLevel, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      // NOTE: if forbidNonWhitelisted is set to true, then the whitelist is useless
      whitelist: true, // Automatically strips properties that do not have any decorators
      forbidNonWhitelisted: true, // Rejects request if there are any properties not part of the DTO
      transform: true, // Automatically transforms payloads to DTOs
    }),
  )

  const logLevel = configService.get<string>('LOG_LEVEL')
  const port = configService.get<number>('PORT', 3000)

  app.useLogger([logLevel as LogLevel])
  await app.listen(port)
}

bootstrap()
