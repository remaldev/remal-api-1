import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded } from 'express'
import helmet from 'helmet'
import * as packageJson from '../package.json'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

/**
 * Apply common application configurations
 * This function is used by both main.ts and test setup
 */
export function bootstrapApp(app: INestApplication): void {
  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // keep Swagger working; enable with proper config if needed
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  // Body size limits (defensive)
  app.use(json({ limit: '1mb' }))
  app.use(urlencoded({ limit: '1mb', extended: true }))

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  const config = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
    },
  })

  // CORS hardening
  const rawOrigins = process.env.CORS_ORIGINS || ''
  const origins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins.length
      ? origins
      : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
}
