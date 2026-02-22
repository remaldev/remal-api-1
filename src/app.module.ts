import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import configuration from './config/configuration'
import { configValidationSchema } from './config/validation'
import { MailerModule } from './mailer/mailer.module'
import { PosModule } from './pos/pos.module'
import { PrismaModule } from './prisma/prisma.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    UserModule,
    MailerModule,
    AuthModule,
    PosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // Global ThrottlerGuard to rate limit requests
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // Register JwtAuthGuard as a global guard (applies to all routes by default)
      // This means the guard runs automatically on every route unless you explicitly
      // mark a route as @Public() (if you’ve set up a decorator to bypass the guard).
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
