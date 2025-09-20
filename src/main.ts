import { LogLevel } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { bootstrapApp } from './app.bootstrap'
import { AppModule } from './app.module'

async function init() {
  const app = await NestFactory.create(AppModule)

  bootstrapApp(app)

  // Additional main.ts specific configurations
  // (if any - like port configuration, CORS, etc.)\
  const configService = app.get(ConfigService)
  const logLevel = configService.get<string>('LOG_LEVEL')
  const port = configService.get<number>('PORT', 3000)

  app.useLogger([logLevel as LogLevel])

  await app.listen(port)
}

init()
